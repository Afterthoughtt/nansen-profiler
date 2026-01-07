/**
 * Insider Wallet Hunt v2
 *
 * Fixed version that:
 * 1. Paginates through ALL trades to find the actual first trade
 * 2. Uses the first trade time (not deployment time) as reference
 * 3. Looks for buyers in the first 5 minutes after first trade
 *
 * Goal: Find cross-token buyers who bought early on multiple launches
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import type { TGMDexTrade } from "./types.js";
import {
  DEPLOYER_CHAIN,
  ALL_DEPLOYERS,
  USER_WALLETS,
} from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Known addresses to filter out (deployers, funders, user wallets)
// Built from centralized config
const KNOWN_ADDRESSES = new Set([
  ...DEPLOYER_CHAIN,
  ...ALL_DEPLOYERS,
  ...USER_WALLETS,
]);

interface TokenLaunch {
  ticker: string;
  tokenAddress: string;
  deploymentTime: Date;
  deployer: string;
}

interface EarlyBuyer {
  address: string;
  totalBoughtUsd: number;
  tradeCount: number;
  firstBuyTime: string;
  secondsAfterFirstTrade: number;
}

interface TokenResult {
  ticker: string;
  tokenAddress: string;
  deploymentTime: string;
  actualFirstTradeTime: string;
  gapMinutes: number;
  firstMinuteBuyers: EarlyBuyer[];
  buyerCount: number;
  totalVolumeUsd: number;
  rawTradesReturned: number;
  tradesInWindow: number;
}

interface CrossTokenBuyer {
  address: string;
  tokensBought: string[];
  insiderScore: number;
  totalSpentUsd: number;
  averageSecondsAfterFirstTrade: number;
  firstFunder?: string;
  connectedToDeployer: boolean;
}

interface InsiderHuntResult {
  runTime: string;
  windowMinutes: number;
  tokens: TokenResult[];
  crossTokenBuyers: CrossTokenBuyer[];
  watchlist: string[];
  summary: {
    totalTokensAnalyzed: number;
    totalEarlyBuyers: number;
    uniqueEarlyBuyers: number;
    crossTokenBuyersFound: number;
    deployerConnectedInsiders: number;
  };
}

// Helper to parse timestamp correctly (API returns without Z)
function parseTimestamp(ts: string): Date {
  return new Date(ts.endsWith("Z") ? ts : ts + "Z");
}

// Load token launches from deployers.json
function loadTokenLaunches(): TokenLaunch[] {
  const deployersData = JSON.parse(
    readFileSync("data/deployers.json", "utf-8")
  );

  const launches: TokenLaunch[] = [];

  for (const deployer of deployersData) {
    for (const launch of deployer.launches) {
      launches.push({
        ticker: launch.ticker,
        tokenAddress: launch.tokenAddress,
        deploymentTime: new Date(launch.launchDate),
        deployer: deployer.address,
      });
    }
  }

  // Sort by deployment date
  return launches.sort(
    (a, b) => a.deploymentTime.getTime() - b.deploymentTime.getTime()
  );
}

async function getFirstMinuteBuyers(
  tokenAddress: string,
  ticker: string,
  deploymentTime: Date,
  windowMinutes: number = 5
): Promise<{
  buyers: EarlyBuyer[];
  rawTradesReturned: number;
  tradesInWindow: number;
  actualFirstTradeTime: string;
  gapMinutes: number;
}> {
  console.log(`\n   Fetching trades for ${ticker}...`);
  console.log(`   Deployment time: ${deploymentTime.toISOString()}`);

  // Format dates for API
  const startDate = deploymentTime.toISOString().split("T")[0];
  const nextDay = new Date(deploymentTime.getTime() + 86400000);
  const endDate = nextDay.toISOString().split("T")[0];

  console.log(`   Query range: ${startDate} to ${endDate}`);

  try {
    // API returns trades NEWEST FIRST, so we need to paginate until we reach deployment time
    const allTrades: TGMDexTrade[] = [];
    const perPage = 100;
    const maxPages = 50; // Up to 5000 trades to search through

    for (let page = 1; page <= maxPages; page++) {
      const trades = await client.getTGMDexTrades({
        token_address: tokenAddress,
        chain: "solana",
        date: { from: startDate, to: endDate },
        pagination: { page, per_page: perPage },
      });

      if (trades.length === 0) break;

      allTrades.push(...trades);

      // Check if we've reached trades from around deployment time
      const oldestInBatch = trades[trades.length - 1];
      const oldestTime = parseTimestamp(oldestInBatch.block_timestamp);

      // If oldest trade is within 30 minutes of deployment, we have enough
      if (oldestTime.getTime() <= deploymentTime.getTime() + 30 * 60 * 1000) {
        console.log(`   Found deployment window on page ${page}`);
        break;
      }

      if (trades.length < perPage) break;
      await delay(1500);
    }

    console.log(`   Raw trades returned: ${allTrades.length}`);

    if (allTrades.length === 0) {
      return {
        buyers: [],
        rawTradesReturned: 0,
        tradesInWindow: 0,
        actualFirstTradeTime: "N/A",
        gapMinutes: 0,
      };
    }

    // Sort all trades by time (oldest first) to find actual first trade
    allTrades.sort((a, b) => {
      const ta = parseTimestamp(a.block_timestamp).getTime();
      const tb = parseTimestamp(b.block_timestamp).getTime();
      return ta - tb;
    });

    // Find actual first trade time
    const firstTrade = allTrades[0];
    const firstTradeTime = parseTimestamp(firstTrade.block_timestamp);
    const gapMinutes =
      (firstTradeTime.getTime() - deploymentTime.getTime()) / 60000;

    console.log(`   First trade: ${firstTrade.block_timestamp}`);
    console.log(`   Gap from deployment: ${gapMinutes.toFixed(1)} minutes`);

    // Use first trade time as the reference (not deployment time)
    const windowEnd = new Date(
      firstTradeTime.getTime() + windowMinutes * 60 * 1000
    );
    console.log(`   Window: First ${windowMinutes} minutes after first trade`);
    console.log(`   Window end: ${windowEnd.toISOString()}`);

    // Filter to only trades within the window
    const windowTrades = allTrades.filter((trade) => {
      const tradeTime = parseTimestamp(trade.block_timestamp);
      return tradeTime >= firstTradeTime && tradeTime <= windowEnd;
    });

    console.log(`   Trades in ${windowMinutes}min window: ${windowTrades.length}`);

    // Filter for buys only and aggregate by wallet
    const buyerMap = new Map<string, EarlyBuyer>();

    for (const trade of windowTrades) {
      if (trade.action !== "BUY") continue;

      const addr = trade.trader_address;
      if (!addr || KNOWN_ADDRESSES.has(addr)) continue;

      const tradeTime = parseTimestamp(trade.block_timestamp);
      const secondsAfterFirstTrade = Math.round(
        (tradeTime.getTime() - firstTradeTime.getTime()) / 1000
      );

      const valueUsd =
        trade.value_usd || (trade.traded_token_amount || 0) * 150;

      const existing = buyerMap.get(addr);
      if (existing) {
        existing.totalBoughtUsd += valueUsd;
        existing.tradeCount += 1;
        if (secondsAfterFirstTrade < existing.secondsAfterFirstTrade) {
          existing.firstBuyTime = trade.block_timestamp;
          existing.secondsAfterFirstTrade = secondsAfterFirstTrade;
        }
      } else {
        buyerMap.set(addr, {
          address: addr,
          totalBoughtUsd: valueUsd,
          tradeCount: 1,
          firstBuyTime: trade.block_timestamp,
          secondsAfterFirstTrade,
        });
      }
    }

    // Sort by earliest buy
    const buyers = Array.from(buyerMap.values()).sort(
      (a, b) => a.secondsAfterFirstTrade - b.secondsAfterFirstTrade
    );

    console.log(`   Unique early buyers: ${buyers.length}`);
    if (buyers.length > 0) {
      console.log(
        `   Earliest buy: ${buyers[0].secondsAfterFirstTrade}s after first trade`
      );
    }

    return {
      buyers,
      rawTradesReturned: allTrades.length,
      tradesInWindow: windowTrades.length,
      actualFirstTradeTime: firstTrade.block_timestamp,
      gapMinutes,
    };
  } catch (error) {
    console.error(`   Error fetching trades for ${ticker}:`, error);
    return {
      buyers: [],
      rawTradesReturned: 0,
      tradesInWindow: 0,
      actualFirstTradeTime: "ERROR",
      gapMinutes: 0,
    };
  }
}

function findCrossTokenBuyers(
  tokenResults: TokenResult[]
): Map<string, { tokens: string[]; totalSpent: number; avgSeconds: number }> {
  const walletData = new Map<
    string,
    { tokens: string[]; totalSpent: number; secondsSum: number; count: number }
  >();

  for (const token of tokenResults) {
    for (const buyer of token.firstMinuteBuyers) {
      const existing = walletData.get(buyer.address);
      if (existing) {
        existing.tokens.push(token.ticker);
        existing.totalSpent += buyer.totalBoughtUsd;
        existing.secondsSum += buyer.secondsAfterFirstTrade;
        existing.count += 1;
      } else {
        walletData.set(buyer.address, {
          tokens: [token.ticker],
          totalSpent: buyer.totalBoughtUsd,
          secondsSum: buyer.secondsAfterFirstTrade,
          count: 1,
        });
      }
    }
  }

  // Filter to wallets that bought 2+ tokens early
  const crossTokenBuyers = new Map<
    string,
    { tokens: string[]; totalSpent: number; avgSeconds: number }
  >();
  for (const [address, data] of walletData) {
    if (data.tokens.length >= 2) {
      crossTokenBuyers.set(address, {
        tokens: data.tokens,
        totalSpent: data.totalSpent,
        avgSeconds: Math.round(data.secondsSum / data.count),
      });
    }
  }

  return crossTokenBuyers;
}

async function investigateInsider(
  address: string,
  tokensBought: string[],
  totalSpent: number,
  avgSeconds: number
): Promise<CrossTokenBuyer> {
  console.log(`   Investigating ${address.slice(0, 12)}...`);

  let firstFunder: string | undefined;
  let connectedToDeployer = false;

  try {
    const relatedWallets = await client.getRelatedWallets({
      address,
      chain: "solana",
    });

    const firstFunderRel = relatedWallets.find(
      (w) => w.relation === "First Funder"
    );
    if (firstFunderRel) {
      firstFunder = firstFunderRel.address;

      const deployerAddresses = [
        "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
        "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
        "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
        "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
        "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
      ];

      if (deployerAddresses.includes(firstFunder)) {
        connectedToDeployer = true;
        console.log(
          `   ⚠️  Connected to deployer chain via ${firstFunder.slice(0, 8)}...`
        );
      }
    }

    await delay(2000);
  } catch (error) {
    console.error(`   Error investigating ${address}:`, error);
  }

  return {
    address,
    tokensBought,
    insiderScore: tokensBought.length / 5,
    totalSpentUsd: totalSpent,
    averageSecondsAfterFirstTrade: avgSeconds,
    firstFunder,
    connectedToDeployer,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=".repeat(60));
  console.log("INSIDER WALLET HUNT v2");
  console.log("=".repeat(60));
  console.log("\nThis analysis:");
  console.log("- Uses the FIRST TRADE TIME (not deployment time) as reference");
  console.log("- Looks for buyers in the first 5 minutes after first trade");
  console.log("- Analyzes all 5 tokens to find cross-token insiders\n");

  const windowMinutes = 5;
  const tokenLaunches = loadTokenLaunches();

  console.log(`Found ${tokenLaunches.length} token launches to analyze:`);
  for (const launch of tokenLaunches) {
    console.log(
      `   ${launch.ticker}: ${launch.deploymentTime.toISOString()} (${launch.tokenAddress.slice(0, 8)}...)`
    );
  }

  // Phase 1: Get early buyers for each token
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 1: Finding first 5-minute buyers for each token");
  console.log("=".repeat(60));

  const tokenResults: TokenResult[] = [];
  let allBuyers = new Set<string>();

  for (const launch of tokenLaunches) {
    const result = await getFirstMinuteBuyers(
      launch.tokenAddress,
      launch.ticker,
      launch.deploymentTime,
      windowMinutes
    );

    const totalVolume = result.buyers.reduce(
      (sum, b) => sum + b.totalBoughtUsd,
      0
    );

    tokenResults.push({
      ticker: launch.ticker,
      tokenAddress: launch.tokenAddress,
      deploymentTime: launch.deploymentTime.toISOString(),
      actualFirstTradeTime: result.actualFirstTradeTime,
      gapMinutes: result.gapMinutes,
      firstMinuteBuyers: result.buyers,
      buyerCount: result.buyers.length,
      totalVolumeUsd: totalVolume,
      rawTradesReturned: result.rawTradesReturned,
      tradesInWindow: result.tradesInWindow,
    });

    for (const buyer of result.buyers) {
      allBuyers.add(buyer.address);
    }

    await delay(2000);
  }

  // Phase 2: Find cross-token buyers
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 2: Finding cross-token buyers");
  console.log("=".repeat(60));

  const crossTokenMap = findCrossTokenBuyers(tokenResults);
  console.log(
    `\nFound ${crossTokenMap.size} wallets that bought 2+ tokens early`
  );

  // Phase 3: Investigate cross-token buyers
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 3: Investigating cross-token buyers");
  console.log("=".repeat(60));

  const crossTokenBuyers: CrossTokenBuyer[] = [];

  if (crossTokenMap.size > 0) {
    for (const [address, data] of crossTokenMap) {
      const insider = await investigateInsider(
        address,
        data.tokens,
        data.totalSpent,
        data.avgSeconds
      );
      crossTokenBuyers.push(insider);
    }

    crossTokenBuyers.sort((a, b) => b.insiderScore - a.insiderScore);
  } else {
    console.log("\n   No cross-token buyers found to investigate.");
  }

  const watchlist = crossTokenBuyers
    .filter((b) => b.tokensBought.length >= 2)
    .map((b) => b.address);

  const deployerConnected = crossTokenBuyers.filter(
    (b) => b.connectedToDeployer
  ).length;

  const result: InsiderHuntResult = {
    runTime: new Date().toISOString(),
    windowMinutes,
    tokens: tokenResults,
    crossTokenBuyers,
    watchlist,
    summary: {
      totalTokensAnalyzed: tokenResults.length,
      totalEarlyBuyers: tokenResults.reduce((sum, t) => sum + t.buyerCount, 0),
      uniqueEarlyBuyers: allBuyers.size,
      crossTokenBuyersFound: crossTokenBuyers.length,
      deployerConnectedInsiders: deployerConnected,
    },
  };

  writeFileSync(
    "data/analysis/insider-hunt-v2.json",
    JSON.stringify(result, null, 2)
  );

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));

  console.log(`\nTokens analyzed: ${result.summary.totalTokensAnalyzed}`);
  console.log(`Total early buyers found: ${result.summary.totalEarlyBuyers}`);
  console.log(`Unique early buyers: ${result.summary.uniqueEarlyBuyers}`);
  console.log(
    `Cross-token buyers (2+ tokens): ${result.summary.crossTokenBuyersFound}`
  );
  console.log(
    `Deployer-connected insiders: ${result.summary.deployerConnectedInsiders}`
  );

  console.log("\n📊 Per-token breakdown:");
  for (const token of tokenResults) {
    console.log(
      `   ${token.ticker}: ${token.buyerCount} early buyers, ${token.tradesInWindow} trades in window`
    );
    console.log(
      `      First trade: ${token.actualFirstTradeTime} (${token.gapMinutes.toFixed(1)}min after deployment)`
    );
    if (token.firstMinuteBuyers.length > 0) {
      const earliest = token.firstMinuteBuyers[0];
      console.log(
        `      Earliest buyer: ${earliest.address.slice(0, 12)}... at ${earliest.secondsAfterFirstTrade}s`
      );
    }
  }

  if (crossTokenBuyers.length > 0) {
    console.log("\n🎯 Cross-token buyers (INSIDER CANDIDATES):");
    for (const insider of crossTokenBuyers) {
      console.log(`   ${insider.address}`);
      console.log(`      Tokens: ${insider.tokensBought.join(", ")}`);
      console.log(
        `      Insider score: ${(insider.insiderScore * 100).toFixed(0)}%`
      );
      console.log(
        `      Avg buy time: ${insider.averageSecondsAfterFirstTrade}s after first trade`
      );
      if (insider.firstFunder) {
        console.log(
          `      First Funder: ${insider.firstFunder.slice(0, 12)}...`
        );
      }
      if (insider.connectedToDeployer) {
        console.log(`      ⚠️  CONNECTED TO DEPLOYER CHAIN`);
      }
    }
  } else {
    console.log("\n❌ No cross-token buyers found.");
    console.log("   Possible reasons:");
    console.log("   - They use fresh wallets for each launch");
    console.log("   - They buy through DEX aggregators/bots");
    console.log("   - The 5-minute window might be too narrow");
  }

  console.log("\n📁 Results saved to: data/analysis/insider-hunt-v2.json");
  console.log("=".repeat(60));
}

main().catch(console.error);
