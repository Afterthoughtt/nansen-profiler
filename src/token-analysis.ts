import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import * as fs from "fs";
import * as path from "path";

// Known tokens from launches
const TOKENS = [
  {
    ticker: "XRPEP3",
    launchDate: "2025-09-28",
    deployer: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    // Token address would need to be looked up or provided
    tokenAddress: "", // TODO: Add actual token address
  },
  {
    ticker: "TrollXRP",
    launchDate: "2025-11-02",
    deployer: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
    tokenAddress: "", // TODO: Add actual token address
  },
];

const KNOWN_WALLETS = {
  level1: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  deployers: [
    "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
  ],
};

interface TokenAnalysisResult {
  generatedAt: string;
  tokens: {
    ticker: string;
    tokenAddress?: string;
    launchDate: string;
    deployer: string;
    holders?: {
      address: string;
      balance: number;
      isKnownWallet: boolean;
      walletType?: string;
    }[];
    earlyBuyers?: {
      address: string;
      boughtWithin24h: boolean;
      totalBought: number;
    }[];
    tradingPatterns?: {
      first48hVolume?: number;
      uniqueTraders?: number;
    };
  }[];
  crossTokenAnalysis: {
    walletsInBothTokens: string[];
    potentialInsiders: string[];
  };
}

async function analyzeToken(
  client: NansenClient,
  token: (typeof TOKENS)[0],
): Promise<TokenAnalysisResult["tokens"][0]> {
  console.log(`\n📊 Analyzing ${token.ticker} token...`);
  console.log(`   Launch: ${token.launchDate}`);
  console.log(`   Deployer: ${token.deployer}`);

  const result: TokenAnalysisResult["tokens"][0] = {
    ticker: token.ticker,
    tokenAddress: token.tokenAddress || undefined,
    launchDate: token.launchDate,
    deployer: token.deployer,
    holders: [],
    earlyBuyers: [],
  };

  // If we don't have token address, we can still analyze deployer activity
  if (!token.tokenAddress) {
    console.log(
      "   ⚠️ Token address not available - analyzing deployer instead",
    );

    // Get deployer's counterparties to find early traders
    const counterparties = await client.getCounterparties({
      address: token.deployer,
      chain: "solana",
      group_by: "wallet",
      source_input: "Combined",
      date: {
        from: token.launchDate,
        to: getDatePlusDays(token.launchDate, 2),
      },
    });

    console.log(
      `   Found ${counterparties.length} counterparties in first 48h`,
    );

    for (const cp of counterparties.slice(0, 20)) {
      const isKnown =
        KNOWN_WALLETS.deployers.includes(cp.counterparty_address) ||
        cp.counterparty_address === KNOWN_WALLETS.level1;

      result.holders?.push({
        address: cp.counterparty_address,
        balance: cp.total_volume_usd || 0,
        isKnownWallet: isKnown,
        walletType: isKnown ? "known_entity" : undefined,
      });

      if (!isKnown && cp.interaction_count > 0) {
        result.earlyBuyers?.push({
          address: cp.counterparty_address,
          boughtWithin24h: true,
          totalBought: cp.volume_in_usd || 0,
        });
      }
    }

    return result;
  }

  // If we have token address, use TGM endpoints
  try {
    console.log("   Fetching token holders...");
    const holders = await client.getTGMHolders({
      token_address: token.tokenAddress,
      chain: "solana",
      pagination: { page: 1, per_page: 25 },
    });

    for (const holder of holders) {
      const isKnown =
        KNOWN_WALLETS.deployers.includes(holder.address) ||
        holder.address === KNOWN_WALLETS.level1;

      result.holders?.push({
        address: holder.address,
        balance: holder.balance,
        isKnownWallet: isKnown,
        walletType: holder.holder_type,
      });
    }
    console.log(`   Found ${holders.length} holders`);

    // Get DEX trades in first 48h
    console.log("   Fetching early DEX trades...");
    const trades = await client.getTGMDexTrades({
      token_address: token.tokenAddress,
      chain: "solana",
      date: {
        from: token.launchDate,
        to: getDatePlusDays(token.launchDate, 2),
      },
      pagination: { page: 1, per_page: 100 },
    });

    // Aggregate by buyer
    const buyerMap = new Map<string, number>();
    for (const trade of trades) {
      if (trade.side === "buy") {
        const current = buyerMap.get(trade.address) || 0;
        buyerMap.set(trade.address, current + (trade.value_usd || 0));
      }
    }

    for (const [address, totalBought] of buyerMap) {
      result.earlyBuyers?.push({
        address,
        boughtWithin24h: true,
        totalBought,
      });
    }

    result.tradingPatterns = {
      uniqueTraders: buyerMap.size,
    };

    console.log(
      `   Found ${trades.length} trades, ${buyerMap.size} unique buyers`,
    );
  } catch (error) {
    console.log(`   ⚠️ TGM endpoints not available for this token`);
  }

  return result;
}

function getDatePlusDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function findCrossTokenPatterns(
  tokens: TokenAnalysisResult["tokens"],
): TokenAnalysisResult["crossTokenAnalysis"] {
  const result: TokenAnalysisResult["crossTokenAnalysis"] = {
    walletsInBothTokens: [],
    potentialInsiders: [],
  };

  if (tokens.length < 2) return result;

  // Get all early buyers from each token
  const token1Buyers = new Set(
    tokens[0].earlyBuyers?.map((b) => b.address) || [],
  );
  const token2Buyers = new Set(
    tokens[1].earlyBuyers?.map((b) => b.address) || [],
  );

  // Find intersection
  for (const buyer of token1Buyers) {
    if (token2Buyers.has(buyer)) {
      result.walletsInBothTokens.push(buyer);

      // If they bought both tokens early, potential insider
      if (
        !KNOWN_WALLETS.deployers.includes(buyer) &&
        buyer !== KNOWN_WALLETS.level1
      ) {
        result.potentialInsiders.push(buyer);
      }
    }
  }

  return result;
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  console.log("🚀 Starting Token Analysis");
  console.log("═".repeat(50));

  const tokenResults: TokenAnalysisResult["tokens"] = [];

  for (const token of TOKENS) {
    const result = await analyzeToken(client, token);
    tokenResults.push(result);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Cross-token analysis
  console.log("\n📊 Cross-Token Analysis...");
  const crossAnalysis = findCrossTokenPatterns(tokenResults);

  const analysis: TokenAnalysisResult = {
    generatedAt: new Date().toISOString(),
    tokens: tokenResults,
    crossTokenAnalysis: crossAnalysis,
  };

  // Save results
  const outputDir = path.join(process.cwd(), "data", "analysis");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "token-intelligence.json");
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`\n✅ Token analysis saved to: ${outputPath}`);

  // Print summary
  console.log("\n" + "═".repeat(50));
  console.log("📊 TOKEN ANALYSIS SUMMARY");
  console.log("═".repeat(50));

  for (const token of tokenResults) {
    console.log(`\n${token.ticker}:`);
    console.log(`  Holders analyzed: ${token.holders?.length || 0}`);
    console.log(`  Early buyers: ${token.earlyBuyers?.length || 0}`);
    const knownHolders = token.holders?.filter((h) => h.isKnownWallet) || [];
    console.log(`  Known wallet holders: ${knownHolders.length}`);
  }

  console.log("\nCross-Token Patterns:");
  console.log(
    `  Wallets in both tokens: ${crossAnalysis.walletsInBothTokens.length}`,
  );
  console.log(
    `  Potential insiders: ${crossAnalysis.potentialInsiders.length}`,
  );
  for (const insider of crossAnalysis.potentialInsiders.slice(0, 5)) {
    console.log(`    - ${insider.slice(0, 12)}...`);
  }
}

main().catch(console.error);
