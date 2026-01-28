/**
 * Smart Money Scan - Demo Script for New API Endpoints
 *
 * Demonstrates the new Nansen API capabilities:
 * - Flow Intelligence (1 credit) - Token accumulation by segment
 * - Smart Money DEX Trades (5 credits) - Real-time SM trade alerts
 * - PnL Leaderboard (5 credits) - Top traders by token
 * - PnL Summary (1 credit) - Quick wallet quality check
 *
 * Usage:
 *   npx tsx src/smart-money-scan.ts [options]
 *
 * Options:
 *   --token <address>     Token address to analyze (default: XRPEP3)
 *   --wallet <address>    Wallet address for PnL summary
 *   --timeframe <tf>      Timeframe for flow intelligence (1h|4h|12h|24h|7d|30d)
 *   --output <path>       Output path (default: data/analysis/smart-money-scan.json)
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import { TOKENS, WALLETS, DATES } from "./config/index.js";
import { delay, formatAddress } from "./utils.js";
import type {
  FlowIntelligenceData,
  SmartMoneyDexTrade,
  PnlLeaderboardEntry,
  PnlSummaryData,
} from "./types.js";

// ============================================
// CLI ARGUMENT PARSING
// ============================================

interface CLIOptions {
  tokenAddress: string;
  tokenTicker: string;
  walletAddress?: string;
  timeframe: "1h" | "4h" | "12h" | "24h" | "7d" | "30d";
  outputPath: string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    tokenAddress: TOKENS.XRPEP3.address,
    tokenTicker: "XRPEP3",
    walletAddress: undefined,
    timeframe: "24h",
    outputPath: "data/analysis/smart-money-scan.json",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--token":
        if (nextArg) {
          // Check if it's a ticker or address
          const upperTicker = nextArg.toUpperCase();
          if (TOKENS[upperTicker]) {
            options.tokenAddress = TOKENS[upperTicker].address;
            options.tokenTicker = upperTicker;
          } else {
            options.tokenAddress = nextArg;
            options.tokenTicker = "CUSTOM";
          }
          i++;
        }
        break;
      case "--wallet":
        if (nextArg) {
          options.walletAddress = nextArg;
          i++;
        }
        break;
      case "--timeframe":
        if (nextArg && ["1h", "4h", "12h", "24h", "7d", "30d"].includes(nextArg)) {
          options.timeframe = nextArg as CLIOptions["timeframe"];
          i++;
        }
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
Smart Money Scan - New API Endpoints Demo

Usage:
  npx tsx src/smart-money-scan.ts [options]

Options:
  --token <address>     Token ticker or address to analyze (default: XRPEP3)
                        Accepts: ${Object.keys(TOKENS).join(", ")} or any address
  --wallet <address>    Wallet address for PnL summary check
  --timeframe <tf>      Timeframe for flow intelligence
                        Options: 1h, 4h, 12h, 24h, 7d, 30d (default: 24h)
  --output <path>       Output file path
  --help                Show this help message

Examples:
  npx tsx src/smart-money-scan.ts --token TROLLXRP --timeframe 7d
  npx tsx src/smart-money-scan.ts --wallet ${WALLETS.INSIDER_H3Q.slice(0, 12)}...
  npx tsx src/smart-money-scan.ts --token XRPEP3 --wallet ${WALLETS.INSIDER_H3Q.slice(0, 12)}...
`);
}

// ============================================
// MAIN FUNCTIONS
// ============================================

interface ScanResult {
  generatedAt: string;
  options: CLIOptions;
  flowIntelligence?: FlowIntelligenceData;
  smartMoneyTrades?: SmartMoneyDexTrade[];
  pnlLeaderboard?: PnlLeaderboardEntry[];
  walletPnlSummary?: PnlSummaryData;
  insights: string[];
}

async function runSmartMoneyScan() {
  const options = parseArgs();
  const client = new NansenClient(process.env.NANSEN_API_KEY || "");

  console.log("=".repeat(60));
  console.log("SMART MONEY SCAN - New API Endpoints Demo");
  console.log("=".repeat(60));
  console.log(`\nToken: ${options.tokenTicker} (${formatAddress(options.tokenAddress)})`);
  console.log(`Timeframe: ${options.timeframe}`);
  if (options.walletAddress) {
    console.log(`Wallet: ${formatAddress(options.walletAddress)}`);
  }
  console.log(`Output: ${options.outputPath}\n`);

  const result: ScanResult = {
    generatedAt: new Date().toISOString(),
    options,
    insights: [],
  };

  // ============================================
  // 1. Flow Intelligence (1 credit)
  // ============================================
  console.log("=".repeat(60));
  console.log("1. FLOW INTELLIGENCE (1 credit)");
  console.log("=".repeat(60));
  console.log(`   Token accumulation by segment over ${options.timeframe}...\n`);

  const flowData = await client.getFlowIntelligence({
    chain: "solana",
    token_address: options.tokenAddress,
    timeframe: options.timeframe,
  });

  if (flowData) {
    result.flowIntelligence = flowData;

    console.log("   Net Flows:");
    console.log(`      Smart Traders: $${flowData.smart_trader_net_flow_usd?.toLocaleString() || "N/A"}`);
    console.log(`      Whales:        $${flowData.whale_net_flow_usd?.toLocaleString() || "N/A"}`);
    console.log(`      Retail:        $${flowData.retail_net_flow_usd?.toLocaleString() || "N/A"}`);
    console.log(`      CEX:           $${flowData.cex_net_flow_usd?.toLocaleString() || "N/A"}`);
    console.log(`      Total:         $${flowData.total_net_flow_usd?.toLocaleString() || "N/A"}`);

    // Generate insights
    if (flowData.smart_trader_net_flow_usd > 0) {
      result.insights.push(`Smart traders NET BUYING (+$${flowData.smart_trader_net_flow_usd.toLocaleString()})`);
    } else if (flowData.smart_trader_net_flow_usd < 0) {
      result.insights.push(`Smart traders NET SELLING (-$${Math.abs(flowData.smart_trader_net_flow_usd).toLocaleString()})`);
    }

    if (flowData.whale_net_flow_usd > 0) {
      result.insights.push(`Whales accumulating (+$${flowData.whale_net_flow_usd.toLocaleString()})`);
    }
  } else {
    console.log("   No flow intelligence data available for this token.");
  }

  await delay(2000);

  // ============================================
  // 2. Smart Money DEX Trades (5 credits)
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("2. SMART MONEY DEX TRADES (5 credits)");
  console.log("=".repeat(60));
  console.log("   Recent smart money trades on this token...\n");

  const smTrades = await client.getSmartMoneyDexTrades({
    chains: ["solana"],
    filters: {
      token_address: options.tokenAddress,
    },
    pagination: { page: 1, per_page: 20 },
    order_by: [{ field: "block_timestamp", direction: "DESC" }],
  });

  if (smTrades.length > 0) {
    result.smartMoneyTrades = smTrades;

    console.log(`   Found ${smTrades.length} smart money trades:\n`);

    for (const trade of smTrades.slice(0, 10)) {
      const action = trade.token_bought_symbol === options.tokenTicker ? "BUY" : "SELL";
      const labels = trade.smart_money_labels?.join(", ") || "Smart Money";
      console.log(`   ${action} | $${trade.value_usd?.toLocaleString() || "?"}`);
      console.log(`      Trader: ${formatAddress(trade.trader_address)} (${labels})`);
      console.log(`      Time: ${trade.block_timestamp}`);
      console.log();
    }

    if (smTrades.length > 10) {
      console.log(`   ... and ${smTrades.length - 10} more trades`);
    }

    // Insights
    const buys = smTrades.filter((t) => t.token_bought_address === options.tokenAddress);
    const sells = smTrades.filter((t) => t.token_sold_address === options.tokenAddress);
    if (buys.length > sells.length) {
      result.insights.push(`Smart money mostly BUYING (${buys.length} buys vs ${sells.length} sells)`);
    } else if (sells.length > buys.length) {
      result.insights.push(`Smart money mostly SELLING (${sells.length} sells vs ${buys.length} buys)`);
    }
  } else {
    console.log("   No smart money trades found for this token.");
  }

  await delay(2000);

  // ============================================
  // 3. PnL Leaderboard (5 credits)
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("3. PNL LEADERBOARD (5 credits)");
  console.log("=".repeat(60));
  console.log("   Top traders by profit on this token...\n");

  const leaderboard = await client.getPnlLeaderboard({
    chain: "solana",
    token_address: options.tokenAddress,
    date: DATES.RECENT_90D,
    pagination: { page: 1, per_page: 20 },
    order_by: [{ field: "pnl_usd_realised", direction: "DESC" }],
  });

  if (leaderboard.length > 0) {
    result.pnlLeaderboard = leaderboard;

    console.log(`   Top ${Math.min(leaderboard.length, 10)} profitable traders:\n`);

    for (let i = 0; i < Math.min(leaderboard.length, 10); i++) {
      const entry = leaderboard[i];
      const roi = entry.roi_percent ? `${entry.roi_percent.toFixed(1)}%` : "N/A";
      console.log(`   #${i + 1} ${formatAddress(entry.trader_address)}`);
      console.log(`      Realized PnL: $${entry.pnl_usd_realised?.toLocaleString() || "N/A"}`);
      console.log(`      ROI: ${roi}`);
      console.log(`      Trades: ${entry.trade_count || "N/A"}`);
      console.log();
    }

    // Insights
    const topTrader = leaderboard[0];
    if (topTrader && topTrader.pnl_usd_realised > 10000) {
      result.insights.push(`Top trader made $${topTrader.pnl_usd_realised.toLocaleString()} profit`);
    }

    const avgRoi =
      leaderboard
        .filter((e) => e.roi_percent)
        .reduce((sum, e) => sum + (e.roi_percent || 0), 0) / leaderboard.length;
    if (avgRoi > 100) {
      result.insights.push(`Average ROI among top traders: ${avgRoi.toFixed(1)}%`);
    }
  } else {
    console.log("   No PnL leaderboard data available for this token.");
  }

  await delay(2000);

  // ============================================
  // 4. Wallet PnL Summary (1 credit) - Optional
  // ============================================
  if (options.walletAddress) {
    console.log("\n" + "=".repeat(60));
    console.log("4. WALLET PNL SUMMARY (1 credit)");
    console.log("=".repeat(60));
    console.log(`   Checking trading quality for ${formatAddress(options.walletAddress)}...\n`);

    const pnlSummary = await client.getPnlSummary({
      address: options.walletAddress,
      chain: "solana",
      date: DATES.RECENT_90D,
    });

    if (pnlSummary) {
      result.walletPnlSummary = pnlSummary;

      console.log("   PnL Summary:");
      console.log(`      Realized PnL:   $${pnlSummary.realized_pnl_usd?.toLocaleString() || "N/A"}`);
      console.log(`      Unrealized PnL: $${pnlSummary.unrealized_pnl_usd?.toLocaleString() || "N/A"}`);
      console.log(`      Total PnL:      $${pnlSummary.total_pnl_usd?.toLocaleString() || "N/A"}`);
      console.log(`      Win Rate:       ${pnlSummary.win_rate ? (pnlSummary.win_rate * 100).toFixed(1) + "%" : "N/A"}`);
      console.log(`      Tokens Traded:  ${pnlSummary.traded_token_count || "N/A"}`);
      console.log(`      Total Volume:   $${pnlSummary.total_volume_usd?.toLocaleString() || "N/A"}`);
      console.log(`      Best Trade:     $${pnlSummary.best_trade_pnl_usd?.toLocaleString() || "N/A"}`);
      console.log(`      Worst Trade:    $${pnlSummary.worst_trade_pnl_usd?.toLocaleString() || "N/A"}`);

      // Insights
      if (pnlSummary.win_rate && pnlSummary.win_rate > 0.6) {
        result.insights.push(`Wallet has HIGH win rate (${(pnlSummary.win_rate * 100).toFixed(1)}%)`);
      }
      if (pnlSummary.total_pnl_usd && pnlSummary.total_pnl_usd > 0) {
        result.insights.push(`Wallet is PROFITABLE (+$${pnlSummary.total_pnl_usd.toLocaleString()})`);
      }
    } else {
      console.log("   No PnL summary data available for this wallet.");
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("INSIGHTS SUMMARY");
  console.log("=".repeat(60));

  if (result.insights.length > 0) {
    console.log("\n   Key findings:\n");
    for (const insight of result.insights) {
      console.log(`   - ${insight}`);
    }
  } else {
    console.log("\n   No significant insights generated.");
  }

  // Save results
  const outputDir = options.outputPath.substring(0, options.outputPath.lastIndexOf("/"));
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(options.outputPath, JSON.stringify(result, null, 2));

  console.log(`\nResults saved to: ${options.outputPath}`);
  console.log("=".repeat(60));
}

runSmartMoneyScan().catch(console.error);
