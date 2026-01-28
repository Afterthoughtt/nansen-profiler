import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { TOKENS } from "./config/tokens.js";

const apiKey = process.env.NANSEN_API_KEY;
if (!apiKey) {
  console.error("❌ NANSEN_API_KEY not found in environment variables");
  process.exit(1);
}

const client = new NansenClient(apiKey);

interface EarlyBuyer {
  wallet: string;
  timestamp: string;
  action: string;
  amount?: number;
  price_usd?: number;
  tx_hash: string;
}

async function getEarlyBuyers(tokenAddress: string, tokenName: string, launchDate: string): Promise<EarlyBuyer[]> {
  console.log(`\n📊 Fetching early trades for ${tokenName}...`);

  // Get launch date and add 1 day window
  const launchDateObj = new Date(launchDate);
  const endDate = new Date(launchDateObj);
  endDate.setDate(endDate.getDate() + 1);

  const dateFrom = launchDateObj.toISOString().split('T')[0];
  const dateTo = endDate.toISOString().split('T')[0];

  console.log(`   Date range: ${dateFrom} to ${dateTo}`);

  try {
    // Paginate to get enough early trades
    // API may return newest first by default, so we request ascending order
    let allTrades: Awaited<ReturnType<typeof client.getTGMDexTrades>> = [];
    let page = 1;
    const perPage = 100;
    const maxPages = 5; // Fetch up to 500 trades to find earliest

    while (page <= maxPages) {
      console.log(`   Fetching page ${page}...`);
      const trades = await client.getTGMDexTrades({
        token_address: tokenAddress,
        chain: "solana",
        date: {
          from: dateFrom,
          to: dateTo,
        },
        pagination: {
          page,
          per_page: perPage,
        },
        order_by: [{ field: "block_timestamp", direction: "ASC" }],
      });

      if (trades.length === 0) break;
      allTrades.push(...trades);

      // If we have enough BUY trades, stop early
      const buyCount = allTrades.filter(t => t.action === "BUY").length;
      if (buyCount >= 20) break;

      if (trades.length < perPage) break; // No more pages
      page++;
      await new Promise(r => setTimeout(r, 1500)); // Rate limit
    }

    console.log(`   Total trades fetched: ${allTrades.length}`);

    // Filter for BUY actions and sort by timestamp (API uses uppercase "BUY")
    const buys = allTrades
      .filter(t => t.action === "BUY")
      .sort((a, b) => new Date(a.block_timestamp).getTime() - new Date(b.block_timestamp).getTime())
      .slice(0, 15);

    console.log(`   BUY trades found: ${buys.length}`);

    // Map to correct field names per API documentation
    return buys.map(t => ({
      wallet: t.trader_address,
      timestamp: t.block_timestamp,
      action: t.action,
      amount: t.token_amount,
      price_usd: t.value_usd ?? t.price_usd,
      tx_hash: t.transaction_hash,
    }));
  } catch (error) {
    console.error(`  Error: ${error}`);
    return [];
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("        EARLY BUYERS ANALYSIS - ALL TOKEN LAUNCHES");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Time: ${new Date().toISOString()}`);

  const results: Record<string, EarlyBuyer[]> = {};

  // Process tokens in order of launch date
  const tokenList = Object.entries(TOKENS).sort(
    (a, b) => new Date(a[1].launchDate).getTime() - new Date(b[1].launchDate).getTime()
  );

  for (const [key, token] of tokenList) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`🪙 ${token.ticker} (${token.name})`);
    console.log(`   Launch: ${token.launchDateLocal}`);
    console.log(`   Address: ${token.address}`);
    console.log(`${"═".repeat(60)}`);

    const buyers = await getEarlyBuyers(token.address, token.ticker, token.launchDate);
    results[token.ticker] = buyers;

    if (buyers.length === 0) {
      console.log("   ⚠️ No early buyer data found");
    } else {
      console.log(`\n   First 15 Buyers:`);
      console.log(`   ${"─".repeat(55)}`);

      buyers.forEach((buyer, idx) => {
        const time = new Date(buyer.timestamp).toISOString().replace('T', ' ').slice(0, 19);
        const wallet = buyer.wallet?.slice(0, 8) + "..." + buyer.wallet?.slice(-4);
        console.log(`   ${String(idx + 1).padStart(2)}. ${time} | ${wallet}`);
      });
    }

    // Rate limit delay
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary: Find wallets that appear in multiple DIFFERENT token launches
  console.log(`\n\n${"═".repeat(60)}`);
  console.log("🔍 CROSS-TOKEN ANALYSIS: Wallets in Multiple Launches");
  console.log(`${"═".repeat(60)}`);

  // Track unique tokens per wallet (using Set to avoid duplicates from multiple buys)
  const walletTokens: Record<string, Set<string>> = {};

  for (const [ticker, buyers] of Object.entries(results)) {
    for (const buyer of buyers) {
      if (!buyer.wallet) continue;
      if (!walletTokens[buyer.wallet]) {
        walletTokens[buyer.wallet] = new Set();
      }
      walletTokens[buyer.wallet].add(ticker);
    }
  }

  // Find wallets in 2+ different tokens
  const crossTokenWallets = Object.entries(walletTokens)
    .filter(([_, tokens]) => tokens.size >= 2)
    .map(([wallet, tokens]) => ({ wallet, tokens: Array.from(tokens) }))
    .sort((a, b) => b.tokens.length - a.tokens.length);

  if (crossTokenWallets.length === 0) {
    console.log("\n   No wallets found in multiple DIFFERENT token launches");
  } else {
    console.log(`\n   🚨 Found ${crossTokenWallets.length} wallet(s) appearing across multiple launches:\n`);
    for (const { wallet, tokens } of crossTokenWallets) {
      const shortWallet = wallet.slice(0, 8) + "..." + wallet.slice(-4);
      console.log(`   🔴 ${shortWallet} - ${tokens.length} tokens: ${tokens.join(", ")}`);
    }
  }

  // Save results
  const outputPath = "./data/analysis/early-buyers-all-tokens.json";
  const fs = await import("fs");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Full results saved to: ${outputPath}`);
}

main().catch(console.error);
