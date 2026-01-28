/**
 * Unified Insider Detection Script
 *
 * Consolidates insider-hunt-v2.ts, insider-detection-v3.ts, and token-analysis.ts
 * into a single CLI tool for detecting potential insider wallets.
 *
 * Features:
 * - Time-window filtering (find buyers in first N minutes)
 * - Position-based filtering (find first N unique buyers)
 * - TGM holders analysis
 * - Bot detection with configurable thresholds
 * - Tiered ranking system
 * - Cross-token buyer detection
 * - Funding chain analysis
 *
 * Usage:
 *   npx tsx src/insider-detect.ts [options]
 *
 * Options:
 *   --tokens <list>       Comma-separated tokens to analyze (default: all from config)
 *   --mode <mode>         "time" | "position" | "holders" (default: position)
 *   --window <min>        Time window in minutes (for mode=time, default: 5)
 *   --top-n <n>           First N buyers (for mode=position, default: 20)
 *   --bot-filter          Enable bot detection (default: false)
 *   --funding-check       Enable funding chain analysis (default: true)
 *   --output <path>       Output path (default: data/analysis/insider-unified.json)
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import type { TGMDexTrade, TGMHolder } from "./types.js";
import {
  WALLETS,
  DEPLOYER_CHAIN,
  ALL_DEPLOYERS,
  USER_WALLETS,
  TOKENS,
} from "./config/index.js";
import { delay, parseTimestamp, formatAddress } from "./utils.js";

// ============================================
// CLI ARGUMENT PARSING
// ============================================

interface CLIOptions {
  tokens: string[];
  mode: "time" | "position" | "holders";
  windowMinutes: number;
  topN: number;
  botFilter: boolean;
  fundingCheck: boolean;
  outputPath: string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    tokens: Object.keys(TOKENS),
    mode: "position",
    windowMinutes: 5,
    topN: 20,
    botFilter: false,
    fundingCheck: true,
    outputPath: "data/analysis/insider-unified.json",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--tokens":
        if (nextArg) {
          options.tokens = nextArg.split(",").map((t) => t.trim().toUpperCase());
          i++;
        }
        break;
      case "--mode":
        if (nextArg && ["time", "position", "holders"].includes(nextArg)) {
          options.mode = nextArg as "time" | "position" | "holders";
          i++;
        }
        break;
      case "--window":
        if (nextArg) {
          options.windowMinutes = parseInt(nextArg, 10) || 5;
          i++;
        }
        break;
      case "--top-n":
        if (nextArg) {
          options.topN = parseInt(nextArg, 10) || 20;
          i++;
        }
        break;
      case "--bot-filter":
        options.botFilter = true;
        break;
      case "--no-funding-check":
        options.fundingCheck = false;
        break;
      case "--output":
        if (nextArg) {
          options.outputPath = nextArg;
          i++;
        }
        break;
      case "--help":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Insider Detection - Unified Analysis Tool

Usage:
  npx tsx src/insider-detect.ts [options]

Options:
  --tokens <list>       Comma-separated tokens to analyze (default: all)
                        Example: --tokens XRPEP3,TROLLXRP
  --mode <mode>         Analysis mode (default: position)
                        time     - Find buyers in first N minutes after first trade
                        position - Find first N unique buyers
                        holders  - Analyze current TGM holders
  --window <min>        Time window in minutes for mode=time (default: 5)
  --top-n <n>           First N buyers for mode=position (default: 20)
  --bot-filter          Enable bot detection filtering
  --no-funding-check    Disable funding chain analysis
  --output <path>       Output file path (default: data/analysis/insider-unified.json)
  --help                Show this help message

Examples:
  npx tsx src/insider-detect.ts --mode time --window 5
  npx tsx src/insider-detect.ts --tokens XRPEP3,TROLLXRP --bot-filter
  npx tsx src/insider-detect.ts --mode position --top-n 30 --bot-filter
`);
}

// ============================================
// CONSTANTS & TYPES
// ============================================

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Known addresses to exclude from analysis
const KNOWN_ADDRESSES = new Set([
  ...DEPLOYER_CHAIN,
  ...ALL_DEPLOYERS,
  ...USER_WALLETS,
  WALLETS.COINBASE_HOT_1,
  WALLETS.COINBASE_HOT_2,
]);

// Deployer-connected addresses for funding chain check
const DEPLOYER_CONNECTED = new Set([
  WALLETS.ROOT,
  WALLETS.PRIMARY_FUNDER,
  WALLETS.ORIGINAL_DEPLOYER,
  WALLETS.COINBASE_HOT_1,
  WALLETS.COINBASE_HOT_2,
]);

// Bot detection thresholds
const BOT_THRESHOLDS = {
  maxVolumeUsd: 1_000_000,    // >$1M trading volume = bot
  maxCounterparties: 20,     // >20 counterparties = bot
  maxTransactions: 50,       // >50 txns in 3 months = bot
  maxSolBalance: 100,        // >100 SOL = likely bot
};

// ============================================
// INTERFACES
// ============================================

interface EarlyBuyer {
  address: string;
  position: number;
  buyTime: string;
  secondsAfterFirstTrade: number;
  valueUsd: number;
  tokenAmount: number;
}

interface TokenAnalysis {
  ticker: string;
  tokenAddress: string;
  launchDate: string;
  firstTradeTime: string;
  totalTradesFound: number;
  buyers: EarlyBuyer[];
}

interface BotCheckResult {
  address: string;
  isBot: boolean;
  reasons: string[];
  volumeUsd?: number;
  counterpartyCount?: number;
  solBalance?: number;
}

interface FundingCheckResult {
  address: string;
  firstFunder?: string;
  firstFunderLabel?: string;
  connectedToDeployer: boolean;
}

interface InsiderCandidate {
  address: string;
  tokens: string[];
  positions: Record<string, number>;
  avgPosition: number;
  firstFunder?: string;
  firstFunderLabel?: string;
  connectedToDeployer: boolean;
  tier: 1 | 2 | 3;
  tierReason: string;
  isBot?: boolean;
  botReasons?: string[];
}

interface AnalysisResult {
  runTime: string;
  options: CLIOptions;
  tokenAnalyses: TokenAnalysis[];
  botChecks?: Record<string, BotCheckResult>;
  fundingChecks?: Record<string, FundingCheckResult>;
  crossTokenBuyers: string[];
  insiderWatchlist: InsiderCandidate[];
  summary: {
    totalTokensAnalyzed: number;
    totalEarlyBuyers: number;
    uniqueEarlyBuyers: number;
    crossTokenCount: number;
    botsFiltered?: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
  };
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Get early buyers using time-window mode (first N minutes after first trade)
 */
async function getEarlyBuyersTimeWindow(
  tokenAddress: string,
  ticker: string,
  launchDate: string,
  windowMinutes: number
): Promise<TokenAnalysis> {
  console.log(`\n   Fetching trades for ${ticker} (time-window mode)...`);

  const startDate = launchDate.split("T")[0];
  const nextDay = new Date(new Date(launchDate).getTime() + 86400000)
    .toISOString()
    .split("T")[0];

  const allTrades: TGMDexTrade[] = [];
  const perPage = 100;
  const maxPages = 50;

  for (let page = 1; page <= maxPages; page++) {
    const trades = await client.getTGMDexTrades({
      token_address: tokenAddress,
      chain: "solana",
      date: { from: startDate, to: nextDay },
      pagination: { page, per_page: perPage },
    });

    if (trades.length === 0) break;
    allTrades.push(...trades);

    // Check if we've reached deployment window
    const oldestInBatch = trades[trades.length - 1];
    const oldestTime = parseTimestamp(oldestInBatch.block_timestamp);
    const deployTime = new Date(launchDate);

    if (oldestTime.getTime() <= deployTime.getTime() + 30 * 60 * 1000) {
      console.log(`   Found deployment window on page ${page}`);
      break;
    }

    if (trades.length < perPage) break;
    await delay(1500);
  }

  console.log(`   Total trades fetched: ${allTrades.length}`);

  if (allTrades.length === 0) {
    return {
      ticker,
      tokenAddress,
      launchDate,
      firstTradeTime: "N/A",
      totalTradesFound: 0,
      buyers: [],
    };
  }

  // Sort by time (oldest first)
  allTrades.sort((a, b) => {
    const ta = parseTimestamp(a.block_timestamp).getTime();
    const tb = parseTimestamp(b.block_timestamp).getTime();
    return ta - tb;
  });

  const firstTradeTime = parseTimestamp(allTrades[0].block_timestamp);
  const windowEnd = new Date(firstTradeTime.getTime() + windowMinutes * 60 * 1000);

  console.log(`   First trade: ${allTrades[0].block_timestamp}`);
  console.log(`   Window end: ${windowEnd.toISOString()}`);

  // Filter trades in window
  const windowTrades = allTrades.filter((trade) => {
    const tradeTime = parseTimestamp(trade.block_timestamp);
    return tradeTime >= firstTradeTime && tradeTime <= windowEnd;
  });

  // Aggregate buyers
  const buyerMap = new Map<string, EarlyBuyer>();
  let position = 0;

  for (const trade of windowTrades) {
    if (trade.action !== "BUY") continue;
    const addr = trade.trader_address;
    if (!addr || KNOWN_ADDRESSES.has(addr)) continue;

    const tradeTime = parseTimestamp(trade.block_timestamp);
    const secondsAfterFirstTrade = Math.round(
      (tradeTime.getTime() - firstTradeTime.getTime()) / 1000
    );

    if (!buyerMap.has(addr)) {
      position++;
      buyerMap.set(addr, {
        address: addr,
        position,
        buyTime: trade.block_timestamp,
        secondsAfterFirstTrade,
        valueUsd: trade.value_usd || 0,
        tokenAmount: trade.token_amount || 0,
      });
    } else {
      const existing = buyerMap.get(addr)!;
      existing.valueUsd += trade.value_usd || 0;
      existing.tokenAmount += trade.token_amount || 0;
    }
  }

  const buyers = Array.from(buyerMap.values()).sort(
    (a, b) => a.secondsAfterFirstTrade - b.secondsAfterFirstTrade
  );

  console.log(`   Unique buyers in ${windowMinutes}min window: ${buyers.length}`);

  return {
    ticker,
    tokenAddress,
    launchDate,
    firstTradeTime: allTrades[0].block_timestamp,
    totalTradesFound: allTrades.length,
    buyers,
  };
}

/**
 * Get early buyers using position mode (first N unique buyers)
 */
async function getEarlyBuyersPosition(
  tokenAddress: string,
  ticker: string,
  launchDate: string,
  topN: number
): Promise<TokenAnalysis> {
  console.log(`\n   Fetching trades for ${ticker} (position mode)...`);

  const startDate = launchDate.split("T")[0];
  const nextDay = new Date(new Date(launchDate).getTime() + 86400000)
    .toISOString()
    .split("T")[0];

  const allTrades: TGMDexTrade[] = [];
  const perPage = 100;
  const maxPages = 50;

  for (let page = 1; page <= maxPages; page++) {
    const trades = await client.getTGMDexTrades({
      token_address: tokenAddress,
      chain: "solana",
      date: { from: startDate, to: nextDay },
      pagination: { page, per_page: perPage },
    });

    if (trades.length === 0) break;
    allTrades.push(...trades);

    const oldestInBatch = trades[trades.length - 1];
    const oldestTime = parseTimestamp(oldestInBatch.block_timestamp);
    const deployTime = new Date(launchDate);

    if (oldestTime.getTime() <= deployTime.getTime() + 60 * 60 * 1000) {
      console.log(`   Found deployment window on page ${page}`);
      break;
    }

    if (trades.length < perPage) break;
    await delay(1500);
  }

  console.log(`   Total trades fetched: ${allTrades.length}`);

  if (allTrades.length === 0) {
    return {
      ticker,
      tokenAddress,
      launchDate,
      firstTradeTime: "N/A",
      totalTradesFound: 0,
      buyers: [],
    };
  }

  // Sort by time (oldest first)
  allTrades.sort((a, b) => {
    const ta = parseTimestamp(a.block_timestamp).getTime();
    const tb = parseTimestamp(b.block_timestamp).getTime();
    return ta - tb;
  });

  const firstTradeTime = parseTimestamp(allTrades[0].block_timestamp);

  // Get first N unique buyers
  const seenBuyers = new Set<string>();
  const buyers: EarlyBuyer[] = [];
  let position = 0;

  const buyTrades = allTrades.filter(
    (t) => t.action === "BUY" && t.trader_address && !KNOWN_ADDRESSES.has(t.trader_address)
  );

  for (const trade of buyTrades) {
    if (seenBuyers.has(trade.trader_address)) continue;
    seenBuyers.add(trade.trader_address);
    position++;

    const tradeTime = parseTimestamp(trade.block_timestamp);
    const secondsAfterFirstTrade = Math.round(
      (tradeTime.getTime() - firstTradeTime.getTime()) / 1000
    );

    buyers.push({
      address: trade.trader_address,
      position,
      buyTime: trade.block_timestamp,
      secondsAfterFirstTrade,
      valueUsd: trade.value_usd || 0,
      tokenAmount: trade.token_amount || 0,
    });

    if (buyers.length >= topN) break;
  }

  console.log(`   First ${topN} unique buyers found: ${buyers.length}`);

  return {
    ticker,
    tokenAddress,
    launchDate,
    firstTradeTime: allTrades[0].block_timestamp,
    totalTradesFound: allTrades.length,
    buyers,
  };
}

/**
 * Get early buyers using TGM holders analysis
 */
async function getEarlyBuyersHolders(
  tokenAddress: string,
  ticker: string,
  launchDate: string,
  topN: number
): Promise<TokenAnalysis> {
  console.log(`\n   Fetching TGM holders for ${ticker}...`);

  const holders = await client.getTGMHolders({
    token_address: tokenAddress,
    chain: "solana",
    pagination: { page: 1, per_page: topN + 10 },
  });

  const buyers: EarlyBuyer[] = [];
  let position = 0;

  for (const holder of holders) {
    if (KNOWN_ADDRESSES.has(holder.address)) continue;
    position++;

    buyers.push({
      address: holder.address,
      position,
      buyTime: "N/A",
      secondsAfterFirstTrade: 0,
      valueUsd: holder.balance_usd || 0,
      tokenAmount: holder.balance || 0,
    });

    if (buyers.length >= topN) break;
  }

  console.log(`   Top ${topN} holders found: ${buyers.length}`);

  return {
    ticker,
    tokenAddress,
    launchDate,
    firstTradeTime: "N/A (holders mode)",
    totalTradesFound: 0,
    buyers,
  };
}

/**
 * Check if a wallet is a bot
 */
async function checkIfBot(address: string): Promise<BotCheckResult> {
  const reasons: string[] = [];
  let volumeUsd = 0;
  let counterpartyCount = 0;
  let solBalance = 0;

  try {
    // Check counterparties
    const counterparties = await client.getCounterparties({
      address,
      chain: "solana",
      date: { from: "2025-01-01", to: "2025-12-31" },
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
    const balances = await client.getCurrentBalance({ address, chain: "solana" });
    const solBal = (balances || []).find((b) => b.token_symbol === "SOL");
    solBalance = solBal?.token_amount || 0;

    if (solBalance > BOT_THRESHOLDS.maxSolBalance) {
      reasons.push(`High SOL balance: ${solBalance.toFixed(1)}`);
    }

    await delay(1500);
  } catch (error) {
    console.error(`   Error checking ${formatAddress(address)}:`, error);
  }

  return {
    address,
    isBot: reasons.length > 0,
    reasons,
    volumeUsd,
    counterpartyCount,
    solBalance,
  };
}

/**
 * Check funding chain for deployer connections
 */
async function checkFundingChain(address: string): Promise<FundingCheckResult> {
  try {
    const related = await client.getRelatedWallets({
      address,
      chain: "solana",
    });

    const firstFunder = (related || []).find((r) => r.relation === "First Funder");

    if (firstFunder) {
      return {
        address,
        firstFunder: firstFunder.address,
        firstFunderLabel: firstFunder.address_label,
        connectedToDeployer: DEPLOYER_CONNECTED.has(firstFunder.address),
      };
    }
  } catch (error) {
    console.error(`   Error checking funding for ${formatAddress(address)}:`, error);
  }

  return { address, connectedToDeployer: false };
}

/**
 * Find wallets that appear in multiple token early buyer lists
 */
function findCrossTokenBuyers(analyses: TokenAnalysis[]): string[] {
  const walletCounts = new Map<string, number>();

  for (const analysis of analyses) {
    for (const buyer of analysis.buyers) {
      walletCounts.set(buyer.address, (walletCounts.get(buyer.address) || 0) + 1);
    }
  }

  return Array.from(walletCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([address]) => address);
}

/**
 * Rank insiders into tiers based on criteria
 */
function rankInsiders(
  analyses: TokenAnalysis[],
  fundingChecks: Map<string, FundingCheckResult>,
  botChecks: Map<string, BotCheckResult>,
  botFilter: boolean
): InsiderCandidate[] {
  const walletTokens = new Map<string, string[]>();
  const walletPositions = new Map<string, Record<string, number>>();

  // Collect all wallets and their token participation
  for (const analysis of analyses) {
    for (const buyer of analysis.buyers) {
      const tokens = walletTokens.get(buyer.address) || [];
      tokens.push(analysis.ticker);
      walletTokens.set(buyer.address, tokens);

      const positions = walletPositions.get(buyer.address) || {};
      positions[analysis.ticker] = buyer.position;
      walletPositions.set(buyer.address, positions);
    }
  }

  const insiders: InsiderCandidate[] = [];

  for (const [address, tokens] of walletTokens) {
    // Skip bots if filtering enabled
    const botCheck = botChecks.get(address);
    if (botFilter && botCheck?.isBot) continue;

    const funding = fundingChecks.get(address);
    const positions = walletPositions.get(address) || {};
    const avgPosition =
      Object.values(positions).reduce((a, b) => a + b, 0) / tokens.length;

    // Determine tier
    let tier: 1 | 2 | 3;
    let tierReason: string;

    if (tokens.length >= 2 && funding?.connectedToDeployer) {
      tier = 1;
      tierReason = "Cross-token buyer + Funding chain connection";
    } else if (tokens.length >= 2) {
      tier = 2;
      tierReason = "Cross-token buyer";
    } else if (funding?.connectedToDeployer) {
      tier = 3;
      tierReason = "Single token + Funding chain connection";
    } else {
      continue; // Skip wallets with no special characteristics
    }

    insiders.push({
      address,
      tokens,
      positions,
      avgPosition,
      firstFunder: funding?.firstFunder,
      firstFunderLabel: funding?.firstFunderLabel,
      connectedToDeployer: funding?.connectedToDeployer || false,
      tier,
      tierReason,
      isBot: botCheck?.isBot,
      botReasons: botCheck?.reasons,
    });
  }

  // Sort by tier, then by average position
  return insiders.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.avgPosition - b.avgPosition;
  });
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  const options = parseArgs();

  console.log("=".repeat(60));
  console.log("INSIDER DETECTION - Unified Analysis Tool");
  console.log("=".repeat(60));
  console.log(`\nMode: ${options.mode}`);
  console.log(`Tokens: ${options.tokens.join(", ")}`);
  if (options.mode === "time") console.log(`Window: ${options.windowMinutes} minutes`);
  if (options.mode === "position") console.log(`Top N: ${options.topN}`);
  console.log(`Bot filtering: ${options.botFilter ? "enabled" : "disabled"}`);
  console.log(`Funding check: ${options.fundingCheck ? "enabled" : "disabled"}`);
  console.log(`Output: ${options.outputPath}\n`);

  // Validate tokens
  const validTokens = options.tokens.filter((t) => TOKENS[t]);
  if (validTokens.length === 0) {
    console.error("No valid tokens specified. Available tokens:", Object.keys(TOKENS).join(", "));
    process.exit(1);
  }

  // Phase 1: Get early buyers for each token
  console.log("=".repeat(60));
  console.log(`PHASE 1: Finding early buyers (mode=${options.mode})`);
  console.log("=".repeat(60));

  const tokenAnalyses: TokenAnalysis[] = [];

  for (const ticker of validTokens) {
    const token = TOKENS[ticker];
    let analysis: TokenAnalysis;

    switch (options.mode) {
      case "time":
        analysis = await getEarlyBuyersTimeWindow(
          token.address,
          ticker,
          token.launchDate,
          options.windowMinutes
        );
        break;
      case "holders":
        analysis = await getEarlyBuyersHolders(
          token.address,
          ticker,
          token.launchDate,
          options.topN
        );
        break;
      case "position":
      default:
        analysis = await getEarlyBuyersPosition(
          token.address,
          ticker,
          token.launchDate,
          options.topN
        );
    }

    tokenAnalyses.push(analysis);
    await delay(2000);
  }

  // Phase 2: Find cross-token buyers
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 2: Finding cross-token buyers");
  console.log("=".repeat(60));

  const crossTokenBuyers = findCrossTokenBuyers(tokenAnalyses);
  console.log(`\nFound ${crossTokenBuyers.length} wallets that bought 2+ tokens early`);

  // Get all unique wallets
  const allWallets = new Set<string>();
  for (const analysis of tokenAnalyses) {
    for (const buyer of analysis.buyers) {
      allWallets.add(buyer.address);
    }
  }

  // Phase 3: Bot filtering (optional)
  const botChecks = new Map<string, BotCheckResult>();

  if (options.botFilter) {
    console.log("\n" + "=".repeat(60));
    console.log("PHASE 3: Bot filtering");
    console.log("=".repeat(60));

    let checked = 0;
    for (const address of allWallets) {
      checked++;
      console.log(`   [${checked}/${allWallets.size}] Checking ${formatAddress(address)}...`);

      const result = await checkIfBot(address);
      botChecks.set(address, result);

      if (result.isBot) {
        console.log(`   BOT: ${result.reasons.join(", ")}`);
      } else {
        console.log(`   NOT a bot`);
      }
    }

    const botsFound = Array.from(botChecks.values()).filter((r) => r.isBot).length;
    console.log(`\nBot check summary: ${botsFound}/${allWallets.size} bots identified`);
  }

  // Phase 4: Funding chain analysis (optional)
  const fundingChecks = new Map<string, FundingCheckResult>();

  if (options.fundingCheck) {
    console.log("\n" + "=".repeat(60));
    console.log(`PHASE ${options.botFilter ? "4" : "3"}: Funding chain analysis`);
    console.log("=".repeat(60));

    // Only check non-bots if bot filtering is enabled
    const walletsToCheck = options.botFilter
      ? Array.from(allWallets).filter((w) => !botChecks.get(w)?.isBot)
      : Array.from(allWallets);

    for (const address of walletsToCheck) {
      console.log(`   Checking funding for ${formatAddress(address)}...`);
      const result = await checkFundingChain(address);
      fundingChecks.set(address, result);

      if (result.firstFunder) {
        console.log(`      First Funder: ${formatAddress(result.firstFunder)}`);
        if (result.connectedToDeployer) {
          console.log(`      CONNECTED TO DEPLOYER CHAIN!`);
        }
      }

      await delay(1500);
    }
  }

  // Phase 5: Rank insiders
  console.log("\n" + "=".repeat(60));
  console.log(`PHASE ${options.botFilter && options.fundingCheck ? "5" : options.botFilter || options.fundingCheck ? "4" : "3"}: Insider ranking`);
  console.log("=".repeat(60));

  const insiders = rankInsiders(
    tokenAnalyses,
    fundingChecks,
    botChecks,
    options.botFilter
  );

  // Build result
  const result: AnalysisResult = {
    runTime: new Date().toISOString(),
    options,
    tokenAnalyses,
    botChecks: options.botFilter ? Object.fromEntries(botChecks) : undefined,
    fundingChecks: options.fundingCheck ? Object.fromEntries(fundingChecks) : undefined,
    crossTokenBuyers,
    insiderWatchlist: insiders,
    summary: {
      totalTokensAnalyzed: tokenAnalyses.length,
      totalEarlyBuyers: tokenAnalyses.reduce((sum, t) => sum + t.buyers.length, 0),
      uniqueEarlyBuyers: allWallets.size,
      crossTokenCount: crossTokenBuyers.length,
      botsFiltered: options.botFilter
        ? Array.from(botChecks.values()).filter((r) => r.isBot).length
        : undefined,
      tier1Count: insiders.filter((i) => i.tier === 1).length,
      tier2Count: insiders.filter((i) => i.tier === 2).length,
      tier3Count: insiders.filter((i) => i.tier === 3).length,
    },
  };

  // Save results
  const outputDir = options.outputPath.substring(0, options.outputPath.lastIndexOf("/"));
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(options.outputPath, JSON.stringify(result, null, 2));

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));

  console.log(`\nTokens analyzed: ${result.summary.totalTokensAnalyzed}`);
  console.log(`Total early buyers found: ${result.summary.totalEarlyBuyers}`);
  console.log(`Unique early buyers: ${result.summary.uniqueEarlyBuyers}`);
  console.log(`Cross-token buyers: ${result.summary.crossTokenCount}`);
  if (result.summary.botsFiltered !== undefined) {
    console.log(`Bots filtered: ${result.summary.botsFiltered}`);
  }

  console.log("\nPer-token breakdown:");
  for (const analysis of tokenAnalyses) {
    console.log(`   ${analysis.ticker}: ${analysis.buyers.length} early buyers`);
    console.log(`      First trade: ${analysis.firstTradeTime}`);
  }

  if (insiders.length > 0) {
    console.log("\nINSIDER WATCHLIST:");

    const tier1 = insiders.filter((i) => i.tier === 1);
    const tier2 = insiders.filter((i) => i.tier === 2);
    const tier3 = insiders.filter((i) => i.tier === 3);

    if (tier1.length > 0) {
      console.log(`\n   TIER 1 (Cross-token + Funding connection): ${tier1.length}`);
      for (const i of tier1) {
        console.log(`   ${i.address}`);
        console.log(`      Tokens: ${i.tokens.join(", ")}`);
        console.log(`      Avg Position: ${i.avgPosition.toFixed(1)}`);
      }
    }

    if (tier2.length > 0) {
      console.log(`\n   TIER 2 (Cross-token only): ${tier2.length}`);
      for (const i of tier2) {
        console.log(`   ${i.address}`);
        console.log(`      Tokens: ${i.tokens.join(", ")}`);
      }
    }

    if (tier3.length > 0) {
      console.log(`\n   TIER 3 (Single token + Funding connection): ${tier3.length}`);
      for (const i of tier3.slice(0, 5)) {
        console.log(`   ${i.address}`);
      }
      if (tier3.length > 5) {
        console.log(`   ... and ${tier3.length - 5} more`);
      }
    }
  } else {
    console.log("\nNo insider candidates found meeting criteria.");
  }

  console.log(`\nResults saved to: ${options.outputPath}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
