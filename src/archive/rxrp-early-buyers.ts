/**
 * RXRP (RainXRP) Early Buyers Analysis
 *
 * Deep analysis of all buyers in the first 30 seconds of RXRP trading.
 * For each buyer:
 * - Total spent USD
 * - First Funder check (deployer chain connection)
 * - Current balance
 * - Categorization: USER, INSIDER, WHALE, BOT, UNKNOWN
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import type { TGMDexTrade } from "./types.js";
import {
  WALLETS,
  DEPLOYER_CHAIN,
  ALL_DEPLOYERS,
  ALL_INSIDERS,
  USER_WALLETS,
  TOKENS,
} from "./config/index.js";
import { delay, parseTimestamp, formatAddress } from "./utils.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// RXRP token info
const RXRP = TOKENS.RXRP;
const RXRP_FIRST_TRADE = new Date(RXRP.launchDate);
const ANALYSIS_WINDOW_SECONDS = 30;

// Known addresses sets
const KNOWN_USER_WALLETS = new Set(USER_WALLETS);
const KNOWN_INSIDERS = new Set(ALL_INSIDERS);
const DEPLOYER_CHAIN_SET = new Set([...DEPLOYER_CHAIN, ...ALL_DEPLOYERS]);

// Coinbase hot wallets (connected to deployer chain)
const COINBASE_WALLETS = new Set([
  WALLETS.COINBASE_HOT_1,
  WALLETS.COINBASE_HOT_2,
]);

// Interface for buyer data
interface RXRPBuyer {
  address: string;
  totalSpentUsd: number;
  tradeCount: number;
  firstBuyTime: string;
  secondsAfterFirstTrade: number;
  // Deep analysis fields
  firstFunder?: string;
  firstFunderLabel?: string;
  connectedToDeployerChain: boolean;
  currentBalanceSol?: number;
  category: "USER" | "INSIDER" | "WHALE" | "BOT" | "UNKNOWN" | "CONNECTED";
  categoryReason: string;
}

interface AnalysisResult {
  token: string;
  tokenAddress: string;
  firstTrade: string;
  analysisWindow: string;
  cutoffTime: string;
  runTime: string;
  totalBuyers: number;
  totalVolume: number;
  buyers: RXRPBuyer[];
  summary: {
    userWallets: number;
    knownInsiders: number;
    chainConnected: number;
    whales: number;
    unknown: number;
    newInsiderCandidates: string[];
  };
}

async function getAllRXRPTrades(): Promise<TGMDexTrade[]> {
  console.log("\n=== Fetching RXRP trades ===");
  console.log(`Token: ${RXRP.name} (${RXRP.ticker})`);
  console.log(`Target first trade: ${RXRP_FIRST_TRADE.toISOString()}`);

  const startDate = RXRP_FIRST_TRADE.toISOString().split("T")[0];
  const nextDay = new Date(RXRP_FIRST_TRADE.getTime() + 86400000);
  const endDate = nextDay.toISOString().split("T")[0];

  console.log(`Query date range: ${startDate} to ${endDate}`);

  const allTrades: TGMDexTrade[] = [];
  const perPage = 100;
  const maxPages = 50; // Increase to ensure we get to first trade

  for (let page = 1; page <= maxPages; page++) {
    console.log(`  Fetching page ${page}...`);

    const trades = await client.getTGMDexTrades({
      token_address: RXRP.address,
      chain: "solana",
      date: { from: startDate, to: endDate },
      pagination: { page, per_page: perPage },
    });

    if (trades.length === 0) {
      console.log(`  Page ${page} empty, stopping.`);
      break;
    }

    allTrades.push(...trades);

    // Check if we've reached the first trade window
    // API returns trades NEWEST first, so last in batch = oldest on this page
    const oldestInBatch = trades[trades.length - 1];
    const oldestTime = parseTimestamp(oldestInBatch.block_timestamp);

    console.log(`    Oldest in batch: ${oldestInBatch.block_timestamp}`);

    // Keep paginating until we find trades BEFORE the expected first trade time
    // This ensures we capture ALL trades from the actual first trade onward
    if (oldestTime.getTime() < RXRP_FIRST_TRADE.getTime()) {
      console.log(`  Reached trades before first trade on page ${page}`);
      break;
    }

    if (trades.length < perPage) break;
    await delay(1500);
  }

  console.log(`  Total trades fetched: ${allTrades.length}`);

  // Sort by time (oldest first)
  allTrades.sort((a, b) => {
    const ta = parseTimestamp(a.block_timestamp).getTime();
    const tb = parseTimestamp(b.block_timestamp).getTime();
    return ta - tb;
  });

  // Find and report actual first trade
  if (allTrades.length > 0) {
    const firstTrade = allTrades[0];
    const firstTradeTime = parseTimestamp(firstTrade.block_timestamp);
    console.log(`  Actual first trade found: ${firstTrade.block_timestamp}`);
    console.log(`  First trader: ${firstTrade.trader_address?.slice(0, 12)}...`);
    const gapMs = firstTradeTime.getTime() - RXRP_FIRST_TRADE.getTime();
    console.log(`  Gap from config: ${(gapMs / 1000).toFixed(1)}s`);
  }

  return allTrades;
}

function filterFirst30Seconds(allTrades: TGMDexTrade[]): {
  windowTrades: TGMDexTrade[];
  actualFirstTradeTime: Date;
} {
  if (allTrades.length === 0) {
    return {
      windowTrades: [],
      actualFirstTradeTime: RXRP_FIRST_TRADE,
    };
  }

  // Use the ACTUAL first trade from the data (already sorted oldest first)
  const actualFirstTrade = allTrades[0];
  const actualFirstTradeTime = parseTimestamp(actualFirstTrade.block_timestamp);

  const cutoffTime = new Date(
    actualFirstTradeTime.getTime() + ANALYSIS_WINDOW_SECONDS * 1000
  );

  console.log(`\n=== Filtering to first ${ANALYSIS_WINDOW_SECONDS} seconds ===`);
  console.log(`Actual first trade: ${actualFirstTrade.block_timestamp}`);
  console.log(`Cutoff time: ${cutoffTime.toISOString()}`);

  const windowTrades = allTrades.filter((trade) => {
    const tradeTime = parseTimestamp(trade.block_timestamp);
    return (
      tradeTime >= actualFirstTradeTime &&
      tradeTime <= cutoffTime &&
      trade.action === "BUY"
    );
  });

  console.log(`  BUY trades in ${ANALYSIS_WINDOW_SECONDS}s window: ${windowTrades.length}`);

  return { windowTrades, actualFirstTradeTime };
}

function aggregateBuyers(
  trades: TGMDexTrade[],
  actualFirstTradeTime: Date
): Map<string, RXRPBuyer> {
  console.log("\n=== Aggregating buyers ===");

  const buyerMap = new Map<string, RXRPBuyer>();

  for (const trade of trades) {
    const addr = trade.trader_address;
    if (!addr) continue;

    const tradeTime = parseTimestamp(trade.block_timestamp);
    const secondsAfterFirstTrade = Math.round(
      (tradeTime.getTime() - actualFirstTradeTime.getTime()) / 1000
    );

    // Use estimated_value_usd if available, otherwise estimate from SOL
    const valueUsd = trade.value_usd || (trade.traded_token_amount || 0) * 200;

    const existing = buyerMap.get(addr);
    if (existing) {
      existing.totalSpentUsd += valueUsd;
      existing.tradeCount += 1;
      if (secondsAfterFirstTrade < existing.secondsAfterFirstTrade) {
        existing.firstBuyTime = trade.block_timestamp;
        existing.secondsAfterFirstTrade = secondsAfterFirstTrade;
      }
    } else {
      buyerMap.set(addr, {
        address: addr,
        totalSpentUsd: valueUsd,
        tradeCount: 1,
        firstBuyTime: trade.block_timestamp,
        secondsAfterFirstTrade,
        connectedToDeployerChain: false,
        category: "UNKNOWN",
        categoryReason: "Not yet analyzed",
      });
    }
  }

  console.log(`  Unique buyers: ${buyerMap.size}`);
  return buyerMap;
}

async function analyzeBuyer(buyer: RXRPBuyer): Promise<void> {
  const addr = buyer.address;

  // Quick categorization for known addresses
  if (KNOWN_USER_WALLETS.has(addr)) {
    buyer.category = "USER";
    buyer.categoryReason = "Known user wallet (excluded)";
    return;
  }

  if (KNOWN_INSIDERS.has(addr)) {
    buyer.category = "INSIDER";
    buyer.categoryReason = "Previously identified insider";
    buyer.connectedToDeployerChain = false; // We know H3Q is not connected
    return;
  }

  if (DEPLOYER_CHAIN_SET.has(addr)) {
    buyer.category = "CONNECTED";
    buyer.categoryReason = "Deployer chain wallet";
    buyer.connectedToDeployerChain = true;
    return;
  }

  // Deep analysis - First Funder check
  try {
    const relatedWallets = await client.getRelatedWallets({
      address: addr,
      chain: "solana",
      pagination: { page: 1, per_page: 20 },
    });

    const firstFunderRel = relatedWallets.find(
      (w) => w.relation === "First Funder"
    );

    if (firstFunderRel) {
      buyer.firstFunder = firstFunderRel.address;
      buyer.firstFunderLabel = firstFunderRel.address_label;

      // Check if First Funder is in deployer chain or Coinbase
      if (
        DEPLOYER_CHAIN_SET.has(firstFunderRel.address) ||
        COINBASE_WALLETS.has(firstFunderRel.address)
      ) {
        buyer.connectedToDeployerChain = true;
        buyer.category = "CONNECTED";
        buyer.categoryReason = `First Funder: ${formatAddress(firstFunderRel.address)} (deployer chain/Coinbase)`;
        return;
      }

      // Check one more level - is First Funder's First Funder in chain?
      await delay(1500);
      const level2FirstFunder = await client.findFirstFunder(
        firstFunderRel.address
      );
      if (
        level2FirstFunder &&
        (DEPLOYER_CHAIN_SET.has(level2FirstFunder) ||
          COINBASE_WALLETS.has(level2FirstFunder))
      ) {
        buyer.connectedToDeployerChain = true;
        buyer.category = "CONNECTED";
        buyer.categoryReason = `Level 2 connection: ${formatAddress(level2FirstFunder)}`;
        return;
      }
    }

    await delay(1500);

    // Get current balance for whale check
    const balances = await client.getCurrentBalance({
      address: addr,
      chain: "solana",
    });

    const solBalance = balances.find(
      (b) => b.token_symbol === "SOL" || b.token_symbol === "Wrapped SOL"
    );
    buyer.currentBalanceSol = solBalance?.token_amount || 0;

    // Whale check: > 100 SOL
    if (buyer.currentBalanceSol > 100) {
      buyer.category = "WHALE";
      buyer.categoryReason = `High balance: ${buyer.currentBalanceSol.toFixed(2)} SOL`;
      return;
    }

    // Bot check: Would need historical trading volume
    // For now, we'll flag high trade counts as potential bots
    if (buyer.tradeCount >= 5 && buyer.totalSpentUsd > 2000) {
      buyer.category = "BOT";
      buyer.categoryReason = `High activity: ${buyer.tradeCount} trades, $${buyer.totalSpentUsd.toFixed(0)}`;
      return;
    }

    // Default to UNKNOWN
    buyer.category = "UNKNOWN";
    buyer.categoryReason = "No deployer chain connection found";
  } catch (error) {
    console.error(`  Error analyzing ${formatAddress(addr)}:`, error);
    buyer.category = "UNKNOWN";
    buyer.categoryReason = "Analysis error";
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("RXRP EARLY BUYERS ANALYSIS");
  console.log("=".repeat(60));
  console.log(`\nAnalyzing first ${ANALYSIS_WINDOW_SECONDS} seconds of RXRP trading`);
  console.log(`Token: ${RXRP.name} (${RXRP.ticker})`);
  console.log(`Address: ${RXRP.address}`);
  console.log(`First Trade: ${RXRP.launchDate}`);

  // Phase 1: Get all trades
  const allTrades = await getAllRXRPTrades();

  // Phase 2: Filter to first 30 seconds
  const { windowTrades, actualFirstTradeTime } = filterFirst30Seconds(allTrades);

  // Phase 3: Aggregate by buyer
  const buyerMap = aggregateBuyers(windowTrades, actualFirstTradeTime);

  // Sort by volume (SIZE priority)
  const buyers = Array.from(buyerMap.values()).sort(
    (a, b) => b.totalSpentUsd - a.totalSpentUsd
  );

  // Phase 4: Deep analysis of each buyer
  console.log("\n=== Deep analysis of each buyer ===");
  console.log(`Analyzing ${buyers.length} buyers (checking First Funder for each)...`);

  for (let i = 0; i < buyers.length; i++) {
    const buyer = buyers[i];
    console.log(
      `  [${i + 1}/${buyers.length}] ${formatAddress(buyer.address)} - $${buyer.totalSpentUsd.toFixed(0)}`
    );
    await analyzeBuyer(buyer);
    console.log(`    → ${buyer.category}: ${buyer.categoryReason}`);

    // Rate limit
    if (buyer.category === "UNKNOWN") {
      await delay(1000);
    }
  }

  // Calculate summary
  const summary = {
    userWallets: buyers.filter((b) => b.category === "USER").length,
    knownInsiders: buyers.filter((b) => b.category === "INSIDER").length,
    chainConnected: buyers.filter((b) => b.category === "CONNECTED").length,
    whales: buyers.filter((b) => b.category === "WHALE").length,
    unknown: buyers.filter((b) => b.category === "UNKNOWN").length,
    newInsiderCandidates: buyers
      .filter(
        (b) =>
          b.category === "CONNECTED" &&
          !KNOWN_INSIDERS.has(b.address) &&
          !DEPLOYER_CHAIN_SET.has(b.address)
      )
      .map((b) => b.address),
  };

  const cutoffTime = new Date(
    actualFirstTradeTime.getTime() + ANALYSIS_WINDOW_SECONDS * 1000
  );

  const result: AnalysisResult = {
    token: RXRP.ticker,
    tokenAddress: RXRP.address,
    firstTrade: actualFirstTradeTime.toISOString(),
    analysisWindow: `${ANALYSIS_WINDOW_SECONDS} seconds`,
    cutoffTime: cutoffTime.toISOString(),
    runTime: new Date().toISOString(),
    totalBuyers: buyers.length,
    totalVolume: buyers.reduce((sum, b) => sum + b.totalSpentUsd, 0),
    buyers,
    summary,
  };

  // Save results
  writeFileSync(
    "data/analysis/rxrp-first-30s-buyers.json",
    JSON.stringify(result, null, 2)
  );

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));

  console.log(`\nTotal buyers in first ${ANALYSIS_WINDOW_SECONDS}s: ${result.totalBuyers}`);
  console.log(`Total volume: $${result.totalVolume.toFixed(2)}`);

  console.log("\nBreakdown by category:");
  console.log(`  USER (excluded):     ${summary.userWallets}`);
  console.log(`  INSIDER (known):     ${summary.knownInsiders}`);
  console.log(`  CONNECTED (chain):   ${summary.chainConnected}`);
  console.log(`  WHALE (>100 SOL):    ${summary.whales}`);
  console.log(`  UNKNOWN:             ${summary.unknown}`);

  console.log("\n📊 All buyers (sorted by volume):");
  for (const buyer of buyers) {
    const flag =
      buyer.category === "CONNECTED"
        ? "⚠️ "
        : buyer.category === "INSIDER"
          ? "🎯"
          : buyer.category === "USER"
            ? "👤"
            : buyer.category === "WHALE"
              ? "🐋"
              : "  ";
    console.log(
      `${flag} ${formatAddress(buyer.address, 12)} | $${buyer.totalSpentUsd.toFixed(0).padStart(6)} | ${buyer.secondsAfterFirstTrade}s | ${buyer.category}`
    );
    if (buyer.firstFunder) {
      console.log(`     First Funder: ${formatAddress(buyer.firstFunder, 12)}`);
    }
  }

  if (summary.newInsiderCandidates.length > 0) {
    console.log("\n🚨 NEW INSIDER CANDIDATES (connected to deployer chain):");
    for (const addr of summary.newInsiderCandidates) {
      const buyer = buyers.find((b) => b.address === addr);
      console.log(`  ${addr}`);
      if (buyer) {
        console.log(`    Spent: $${buyer.totalSpentUsd.toFixed(2)}`);
        console.log(`    Timing: ${buyer.secondsAfterFirstTrade}s after first trade`);
        console.log(`    Reason: ${buyer.categoryReason}`);
      }
    }
  }

  console.log("\n📁 Results saved to: data/analysis/rxrp-first-30s-buyers.json");
  console.log("=".repeat(60));
}

main().catch(console.error);
