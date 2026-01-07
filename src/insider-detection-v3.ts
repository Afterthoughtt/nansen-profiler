/**
 * Insider Detection v3 - First 20 Transactions Analysis
 *
 * Find true insider wallets by analyzing the first ~20 BUY transactions
 * on XRPEP3 and TrollXRP, filtering out bots, and identifying wallets
 * with funding chain connections to the deployer.
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import type { TGMDexTrade } from "./types.js";
import {
  WALLETS,
  DEPLOYER_CHAIN,
  ALL_DEPLOYERS,
  TOKENS as CONFIG_TOKENS,
} from "./config/index.js";
import { delay, parseTimestamp } from "./utils.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Token addresses (v49j-chain tokens only) - from centralized config
const TOKENS = {
  XRPEP3: {
    address: CONFIG_TOKENS.XRPEP3.address,
    deploymentDate: "2025-09-28",
    deployer: WALLETS.DEPLOYER_D7MS,
  },
  TrollXRP: {
    address: CONFIG_TOKENS.TROLLXRP.address,
    deploymentDate: "2025-11-02",
    deployer: WALLETS.DEPLOYER_DBMX,
  },
};

// Known addresses to exclude (deployers, funders, etc.) - from centralized config
const KNOWN_ADDRESSES = new Set([
  ...DEPLOYER_CHAIN,
  ...ALL_DEPLOYERS,
  WALLETS.COINBASE_HOT_1,
]);

// Deployer-connected addresses for funding chain check - from centralized config
const DEPLOYER_CONNECTED = new Set([
  WALLETS.COINBASE_HOT_1,
  WALLETS.COINBASE_HOT_2,
  WALLETS.PRIMARY_FUNDER,
  WALLETS.ORIGINAL_DEPLOYER,
  WALLETS.ROOT,
]);

// Bot detection thresholds
const BOT_THRESHOLDS = {
  maxVolumeUsd: 1_000_000, // >$1M trading volume = bot
  maxCounterparties: 20, // >20 counterparties = bot
  maxTransactions: 50, // >50 txns in 3 months = bot
  maxSolBalance: 100, // >100 SOL = likely bot
};

interface EarlyBuyer {
  address: string;
  position: number; // Transaction position (1 = first buyer)
  buyTime: string;
  secondsAfterFirstTrade: number;
  valueUsd: number;
  tokenAmount: number;
}

interface TokenAnalysis {
  token: string;
  tokenAddress: string;
  firstTradeTime: string;
  totalTradesFound: number;
  first20Buyers: EarlyBuyer[];
}

interface BotCheckResult {
  address: string;
  isBot: boolean;
  reasons: string[];
  volumeUsd?: number;
  counterpartyCount?: number;
  transactionCount?: number;
  solBalance?: number;
}

interface InsiderCandidate {
  address: string;
  tokens: string[];
  positions: { [token: string]: number };
  avgPosition: number;
  firstFunder?: string;
  firstFunderLabel?: string;
  connectedToDeployer: boolean;
  tier: 1 | 2 | 3;
  tierReason: string;
}

/**
 * Get the first N BUY transactions for a token
 */
async function getFirstNBuyers(
  tokenAddress: string,
  tokenName: string,
  deploymentDate: string,
  n: number = 20
): Promise<TokenAnalysis> {
  console.log(`\n📊 Fetching trades for ${tokenName}...`);

  // Fetch trades - need to paginate to get all trades and find earliest
  const allTrades: TGMDexTrade[] = [];
  const perPage = 100;
  const maxPages = 50;
  const nextDay = new Date(new Date(deploymentDate).getTime() + 86400000)
    .toISOString()
    .split("T")[0];

  for (let page = 1; page <= maxPages; page++) {
    const trades = await client.getTGMDexTrades({
      token_address: tokenAddress,
      chain: "solana",
      date: { from: deploymentDate, to: nextDay },
      pagination: { page, per_page: perPage },
    });

    if (trades.length === 0) break;
    allTrades.push(...trades);

    // Check if we've reached near deployment time
    const oldestInBatch = trades[trades.length - 1];
    const oldestTime = parseTimestamp(oldestInBatch.block_timestamp);
    const deployTime = new Date(deploymentDate + "T00:00:00Z");

    if (oldestTime.getTime() <= deployTime.getTime() + 60 * 60 * 1000) {
      console.log(`   Found deployment window on page ${page}`);
      break;
    }

    if (trades.length < perPage) break;
    await delay(1500);
  }

  console.log(`   Total trades fetched: ${allTrades.length}`);

  // Sort by timestamp (oldest first)
  allTrades.sort((a, b) => {
    const ta = parseTimestamp(a.block_timestamp).getTime();
    const tb = parseTimestamp(b.block_timestamp).getTime();
    return ta - tb;
  });

  // Get first trade time
  const firstTrade = allTrades[0];
  const firstTradeTime = parseTimestamp(firstTrade.block_timestamp);

  console.log(`   First trade: ${firstTrade.block_timestamp}`);

  // Filter for BUY transactions only, excluding known addresses
  const buyTrades = allTrades.filter(
    (t) => t.action === "BUY" && t.trader_address && !KNOWN_ADDRESSES.has(t.trader_address)
  );

  console.log(`   Total BUY trades (excluding known): ${buyTrades.length}`);

  // Get first N unique buyers
  const seenBuyers = new Set<string>();
  const first20Buyers: EarlyBuyer[] = [];
  let position = 0;

  for (const trade of buyTrades) {
    if (seenBuyers.has(trade.trader_address)) continue;
    seenBuyers.add(trade.trader_address);
    position++;

    const tradeTime = parseTimestamp(trade.block_timestamp);
    const secondsAfterFirstTrade = Math.round(
      (tradeTime.getTime() - firstTradeTime.getTime()) / 1000
    );

    first20Buyers.push({
      address: trade.trader_address,
      position,
      buyTime: trade.block_timestamp,
      secondsAfterFirstTrade,
      valueUsd: trade.value_usd || 0,
      tokenAmount: trade.token_amount || 0,
    });

    if (first20Buyers.length >= n) break;
  }

  console.log(`   First ${n} unique buyers found: ${first20Buyers.length}`);

  // Show the first 20 buyers
  console.log(`\n   First ${n} buyers:`);
  for (const buyer of first20Buyers) {
    console.log(
      `   #${buyer.position.toString().padStart(2)} | ${buyer.address.slice(0, 12)}... | +${buyer.secondsAfterFirstTrade}s | $${buyer.valueUsd.toFixed(2)}`
    );
  }

  return {
    token: tokenName,
    tokenAddress,
    firstTradeTime: firstTrade.block_timestamp,
    totalTradesFound: allTrades.length,
    first20Buyers,
  };
}

/**
 * Check if a wallet is a bot based on activity metrics
 */
async function checkIfBot(address: string): Promise<BotCheckResult> {
  const reasons: string[] = [];
  let volumeUsd = 0;
  let counterpartyCount = 0;
  let transactionCount = 0;
  let solBalance = 0;

  try {
    // Check counterparties (this gives us volume and interaction count)
    const counterparties = await client.getCounterparties({
      address,
      chain: "solana",
      date: { from: "2025-01-01", to: "2025-11-30" },
    });

    counterpartyCount = counterparties?.length || 0;
    volumeUsd = (counterparties || []).reduce(
      (sum, cp) => sum + (cp.total_volume_usd || 0),
      0
    );

    if (volumeUsd > BOT_THRESHOLDS.maxVolumeUsd) {
      reasons.push(`High volume: $${(volumeUsd / 1_000_000).toFixed(1)}M`);
    }

    if (counterpartyCount > BOT_THRESHOLDS.maxCounterparties) {
      reasons.push(`Many counterparties: ${counterpartyCount}`);
    }

    await delay(1500);

    // Check current balance
    const balances = await client.getCurrentBalance({
      address,
      chain: "solana",
    });

    const solBal = (balances || []).find((b) => b.token_symbol === "SOL");
    solBalance = solBal?.token_amount || 0;

    if (solBalance > BOT_THRESHOLDS.maxSolBalance) {
      reasons.push(`High SOL balance: ${solBalance.toFixed(1)}`);
    }

    await delay(1500);
  } catch (error) {
    console.error(`   Error checking ${address.slice(0, 8)}...:`, error);
  }

  return {
    address,
    isBot: reasons.length > 0,
    reasons,
    volumeUsd,
    counterpartyCount,
    transactionCount,
    solBalance,
  };
}

/**
 * Check funding chain for deployer connections
 */
async function checkFundingChain(
  address: string
): Promise<{ firstFunder?: string; label?: string; connected: boolean }> {
  try {
    const related = await client.getRelatedWallets({
      address,
      chain: "solana",
    });

    const firstFunder = (related || []).find((r) => r.relation === "First Funder");

    if (firstFunder) {
      const connected = DEPLOYER_CONNECTED.has(firstFunder.address);
      return {
        firstFunder: firstFunder.address,
        label: firstFunder.label,
        connected,
      };
    }
  } catch (error) {
    console.error(`   Error checking funding for ${address.slice(0, 8)}...:`, error);
  }

  return { connected: false };
}

/**
 * Main analysis function
 */
async function runAnalysis() {
  console.log("=".repeat(60));
  console.log("INSIDER DETECTION v3 - First 20 Transactions Analysis");
  console.log("=".repeat(60));
  console.log("\nFocusing on XRPEP3 and TrollXRP (v49j-chain tokens)");
  console.log("Looking for wallets in the first 20 BUY transactions of BOTH tokens\n");

  // Phase 1: Get first 20 buyers for each token
  console.log("=".repeat(60));
  console.log("PHASE 1: Get First 20 Buyers");
  console.log("=".repeat(60));

  const xrpep3Analysis = await getFirstNBuyers(
    TOKENS.XRPEP3.address,
    "XRPEP3",
    TOKENS.XRPEP3.deploymentDate,
    20
  );

  await delay(2000);

  const trollxrpAnalysis = await getFirstNBuyers(
    TOKENS.TrollXRP.address,
    "TrollXRP",
    TOKENS.TrollXRP.deploymentDate,
    20
  );

  // Phase 2: Find cross-token buyers
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 2: Find Cross-Token Buyers");
  console.log("=".repeat(60));

  const xrpep3Wallets = new Set(xrpep3Analysis.first20Buyers.map((b) => b.address));
  const trollxrpWallets = new Set(trollxrpAnalysis.first20Buyers.map((b) => b.address));

  const crossTokenBuyers = [...xrpep3Wallets].filter((w) => trollxrpWallets.has(w));

  console.log(`\nXRPEP3 first 20 unique buyers: ${xrpep3Wallets.size}`);
  console.log(`TrollXRP first 20 unique buyers: ${trollxrpWallets.size}`);
  console.log(`\n🎯 Cross-token buyers (in first 20 of BOTH): ${crossTokenBuyers.length}`);

  if (crossTokenBuyers.length > 0) {
    console.log("\nCross-token buyers found:");
    for (const addr of crossTokenBuyers) {
      const xPos = xrpep3Analysis.first20Buyers.find((b) => b.address === addr)?.position;
      const tPos = trollxrpAnalysis.first20Buyers.find((b) => b.address === addr)?.position;
      console.log(`   ${addr}`);
      console.log(`      XRPEP3: #${xPos}, TrollXRP: #${tPos}`);
    }
  }

  // Phase 3: Bot filtering on ALL first 20 buyers (not just cross-token)
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 3: Bot Filtering");
  console.log("=".repeat(60));

  // Get all unique wallets from both tokens
  const allEarlyBuyers = new Set([...xrpep3Wallets, ...trollxrpWallets]);
  console.log(`\nTotal unique early buyers to check: ${allEarlyBuyers.size}`);

  const botCheckResults: Map<string, BotCheckResult> = new Map();
  const nonBots: string[] = [];

  let checked = 0;
  for (const address of allEarlyBuyers) {
    checked++;
    console.log(`\n   [${checked}/${allEarlyBuyers.size}] Checking ${address.slice(0, 12)}...`);

    const result = await checkIfBot(address);
    botCheckResults.set(address, result);

    if (result.isBot) {
      console.log(`   ❌ BOT: ${result.reasons.join(", ")}`);
    } else {
      console.log(`   ✅ NOT a bot`);
      nonBots.push(address);
    }

    await delay(1000);
  }

  console.log(`\n\nBot check summary:`);
  console.log(`   Total checked: ${allEarlyBuyers.size}`);
  console.log(`   Bots identified: ${allEarlyBuyers.size - nonBots.length}`);
  console.log(`   Non-bots: ${nonBots.length}`);

  // Phase 4: Check funding chains
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 4: Funding Chain Analysis");
  console.log("=".repeat(60));

  const fundingResults: Map<string, { firstFunder?: string; label?: string; connected: boolean }> =
    new Map();

  for (const address of nonBots) {
    console.log(`\n   Checking funding for ${address.slice(0, 12)}...`);
    const result = await checkFundingChain(address);
    fundingResults.set(address, result);

    if (result.firstFunder) {
      console.log(`      First Funder: ${result.firstFunder.slice(0, 12)}...`);
      if (result.label) console.log(`      Label: ${result.label}`);
      if (result.connected) console.log(`      ⚠️  CONNECTED TO DEPLOYER CHAIN!`);
    } else {
      console.log(`      First Funder: Unknown`);
    }

    await delay(1500);
  }

  // Phase 5: Rank insiders
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 5: Insider Ranking");
  console.log("=".repeat(60));

  const insiders: InsiderCandidate[] = [];

  for (const address of nonBots) {
    const inXrpep3 = xrpep3Wallets.has(address);
    const inTrollxrp = trollxrpWallets.has(address);
    const funding = fundingResults.get(address) || { connected: false };

    const tokens: string[] = [];
    const positions: { [token: string]: number } = {};

    if (inXrpep3) {
      tokens.push("XRPEP3");
      positions["XRPEP3"] =
        xrpep3Analysis.first20Buyers.find((b) => b.address === address)?.position || 0;
    }
    if (inTrollxrp) {
      tokens.push("TrollXRP");
      positions["TrollXRP"] =
        trollxrpAnalysis.first20Buyers.find((b) => b.address === address)?.position || 0;
    }

    const avgPosition =
      Object.values(positions).reduce((a, b) => a + b, 0) / Object.values(positions).length;

    // Determine tier
    let tier: 1 | 2 | 3;
    let tierReason: string;

    if (tokens.length >= 2 && funding.connected) {
      tier = 1;
      tierReason = "Cross-token buyer + Funding chain connection";
    } else if (tokens.length >= 2) {
      tier = 2;
      tierReason = "Cross-token buyer";
    } else if (funding.connected) {
      tier = 3;
      tierReason = "Single token + Funding chain connection";
    } else {
      // Skip wallets with no special characteristics
      continue;
    }

    insiders.push({
      address,
      tokens,
      positions,
      avgPosition,
      firstFunder: funding.firstFunder,
      firstFunderLabel: funding.label,
      connectedToDeployer: funding.connected,
      tier,
      tierReason,
    });
  }

  // Sort by tier, then by average position
  insiders.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.avgPosition - b.avgPosition;
  });

  // Output results
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS: INSIDER WATCHLIST");
  console.log("=".repeat(60));

  if (insiders.length === 0) {
    console.log("\n❌ No insider candidates found that meet criteria.");
    console.log("   All early buyers were either bots or had no special characteristics.");
  } else {
    console.log(`\n🎯 Found ${insiders.length} insider candidates:\n`);

    for (const insider of insiders) {
      console.log(`   TIER ${insider.tier}: ${insider.address}`);
      console.log(`      Tokens: ${insider.tokens.join(", ")}`);
      console.log(`      Positions: ${JSON.stringify(insider.positions)}`);
      console.log(`      Avg Position: ${insider.avgPosition.toFixed(1)}`);
      if (insider.firstFunder) {
        console.log(`      First Funder: ${insider.firstFunder.slice(0, 20)}...`);
      }
      if (insider.connectedToDeployer) {
        console.log(`      ⚠️  CONNECTED TO DEPLOYER CHAIN`);
      }
      console.log(`      Reason: ${insider.tierReason}`);
      console.log();
    }
  }

  // Save results
  const output = {
    runTime: new Date().toISOString(),
    tokens: {
      XRPEP3: {
        address: TOKENS.XRPEP3.address,
        firstTradeTime: xrpep3Analysis.firstTradeTime,
        totalTrades: xrpep3Analysis.totalTradesFound,
        first20Buyers: xrpep3Analysis.first20Buyers,
      },
      TrollXRP: {
        address: TOKENS.TrollXRP.address,
        firstTradeTime: trollxrpAnalysis.firstTradeTime,
        totalTrades: trollxrpAnalysis.totalTradesFound,
        first20Buyers: trollxrpAnalysis.first20Buyers,
      },
    },
    crossTokenBuyers,
    botChecks: Object.fromEntries(botCheckResults),
    nonBots,
    fundingChains: Object.fromEntries(fundingResults),
    insiderWatchlist: insiders,
    summary: {
      totalEarlyBuyers: allEarlyBuyers.size,
      botsFiltered: allEarlyBuyers.size - nonBots.length,
      nonBots: nonBots.length,
      crossTokenCount: crossTokenBuyers.length,
      tier1Count: insiders.filter((i) => i.tier === 1).length,
      tier2Count: insiders.filter((i) => i.tier === 2).length,
      tier3Count: insiders.filter((i) => i.tier === 3).length,
    },
  };

  writeFileSync("data/analysis/insider-v3.json", JSON.stringify(output, null, 2));
  console.log("\n✅ Results saved to data/analysis/insider-v3.json");

  // Print final watchlist
  console.log("\n" + "=".repeat(60));
  console.log("FINAL INSIDER WATCHLIST");
  console.log("=".repeat(60));

  const tier1 = insiders.filter((i) => i.tier === 1);
  const tier2 = insiders.filter((i) => i.tier === 2);
  const tier3 = insiders.filter((i) => i.tier === 3);

  if (tier1.length > 0) {
    console.log("\n🔴 TIER 1 (Cross-token + Funding connection):");
    for (const i of tier1) console.log(`   ${i.address}`);
  }

  if (tier2.length > 0) {
    console.log("\n🟡 TIER 2 (Cross-token only):");
    for (const i of tier2) console.log(`   ${i.address}`);
  }

  if (tier3.length > 0) {
    console.log("\n🟢 TIER 3 (Single token + Funding connection):");
    for (const i of tier3) console.log(`   ${i.address}`);
  }

  if (insiders.length === 0) {
    console.log("\n   No insiders found meeting criteria.");
    console.log("   Consider checking the non-bot wallets manually:");
    for (const addr of nonBots.slice(0, 10)) {
      console.log(`   ${addr}`);
    }
  }
}

runAnalysis().catch(console.error);
