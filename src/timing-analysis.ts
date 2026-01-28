/**
 * Unified Timing Analysis Script
 *
 * Consolidates timing-analysis.ts and launch-window-analysis.ts into a single
 * CLI tool for analyzing launch timing patterns and predicting future launches.
 *
 * Features:
 * - Funding → deployment timing analysis
 * - 48hr launch window analysis
 * - Days-between calculation
 * - Next launch prediction
 * - Pattern validation (Sunday launches, etc.)
 * - TimingPlaybook output
 *
 * Usage:
 *   npx tsx src/timing-analysis.ts [options]
 *
 * Options:
 *   --window <hours>      Analysis window before launch (default: 48)
 *   --predict             Calculate next launch prediction
 *   --output <path>       Output path (default: data/analysis/timing-playbook.json)
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import type { LaunchTimingData, TimingPlaybook, Transaction } from "./types.js";
import { TOKENS, WALLETS, DATES } from "./config/index.js";
import { delay, formatAddress } from "./utils.js";

// ============================================
// CLI ARGUMENT PARSING
// ============================================

interface CLIOptions {
  windowHours: number;
  predict: boolean;
  outputPath: string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    windowHours: 48,
    predict: false,
    outputPath: "data/analysis/timing-playbook.json",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--window":
        if (nextArg) {
          options.windowHours = parseInt(nextArg, 10) || 48;
          i++;
        }
        break;
      case "--predict":
        options.predict = true;
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
Timing Analysis - Launch Pattern Analysis Tool

Usage:
  npx tsx src/timing-analysis.ts [options]

Options:
  --window <hours>      Analysis window before launch (default: 48)
  --predict             Include next launch prediction
  --output <path>       Output file path (default: data/analysis/timing-playbook.json)
  --help                Show this help message

Examples:
  npx tsx src/timing-analysis.ts --predict
  npx tsx src/timing-analysis.ts --window 72 --predict
`);
}

// ============================================
// CONSTANTS
// ============================================

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Map deployer references to actual addresses
const DEPLOYER_MAP: Record<string, string> = {
  ORIGINAL_DEPLOYER: WALLETS.ORIGINAL_DEPLOYER,
  DEPLOYER_D7MS: WALLETS.DEPLOYER_D7MS,
  DEPLOYER_DBMX: WALLETS.DEPLOYER_DBMX,
  DEPLOYER_BZ2Y: WALLETS.DEPLOYER_BZ2Y,
};

// Get funder for each deployer
function getFunderForDeployer(deployerRef: string): string {
  // Fresh deployers are funded by PRIMARY_FUNDER
  // Original deployer was funded directly from ROOT
  if (deployerRef === "ORIGINAL_DEPLOYER") {
    return WALLETS.ROOT;
  }
  return WALLETS.PRIMARY_FUNDER;
}

// ============================================
// INTERFACES
// ============================================

interface LaunchWindowAnalysis {
  ticker: string;
  tokenAddress: string;
  deployer: string;
  launchTime: string;
  launchTimeLocal: string;
  windowStart: string;
  windowEnd: string;
  fundingTransaction?: {
    timestamp: string;
    amount?: number;
    fromAddress?: string;
  };
  deploymentTransaction?: {
    timestamp: string;
    hash: string;
    method?: string;
  };
  timeDelta?: {
    hours: number;
    minutes: number;
    seconds: number;
    totalMinutes: number;
  };
}

interface LaunchPrediction {
  basedOn: string[];
  daysBetweenLaunches: number[];
  averageDaysBetween: number;
  nextPredictedDate: string;
  nextPredictedDateLocal: string;
  dayOfWeekPattern?: string;
  confidence: "high" | "medium" | "low";
}

interface UnifiedTimingResult {
  generatedAt: string;
  options: CLIOptions;
  launchAnalyses: LaunchWindowAnalysis[];
  playbook: TimingPlaybook;
  prediction?: LaunchPrediction;
  patterns: {
    typicalDayOfWeek?: string;
    typicalHourUTC?: number;
    avgFundingToDeployHours?: number;
    allSundays?: boolean;
  };
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Get launch window dates
 */
function getWindowDates(
  launchTime: string,
  windowHours: number
): { start: string; end: string } {
  const launch = new Date(launchTime);
  const start = new Date(launch.getTime() - windowHours * 60 * 60 * 1000);

  return {
    start: start.toISOString().split("T")[0],
    end: launch.toISOString().split("T")[0],
  };
}

/**
 * Analyze a single launch window
 */
async function analyzeLaunchWindow(
  ticker: string,
  tokenAddress: string,
  launchTime: string,
  deployerRef: string,
  windowHours: number
): Promise<LaunchWindowAnalysis> {
  const deployer = DEPLOYER_MAP[deployerRef] || deployerRef;
  const funder = getFunderForDeployer(deployerRef);
  const window = getWindowDates(launchTime, windowHours);
  const launchTimestamp = new Date(launchTime).getTime();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Analyzing: ${ticker}`);
  console.log(`Launch Time: ${launchTime}`);
  console.log(`Deployer: ${formatAddress(deployer)}`);
  console.log(`Window: ${window.start} to ${window.end}`);
  console.log("=".repeat(60));

  const result: LaunchWindowAnalysis = {
    ticker,
    tokenAddress,
    deployer,
    launchTime,
    launchTimeLocal: new Date(launchTime).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }),
    windowStart: window.start,
    windowEnd: window.end,
  };

  try {
    // Fetch deployer transactions in window
    console.log(`   Fetching transactions in launch window...`);
    const txResponse = await client.getTransactions({
      address: deployer,
      chain: "solana",
      date: { from: window.start, to: window.end },
      pagination: { page: 1, per_page: 100 },
    });

    const transactions = txResponse.data || [];
    console.log(`   Found ${transactions.length} transactions in window`);

    // Find funding transaction (SOL received from funder)
    console.log(`   Looking for funding from ${formatAddress(funder)}...`);
    const fundingTx = transactions.find((tx) => {
      if (tx.tokens_received && tx.tokens_received.length > 0) {
        return tx.tokens_received.some(
          (token) =>
            token.from_address &&
            (token.from_address === funder ||
              token.from_address.startsWith(funder.substring(0, 8)))
        );
      }
      return false;
    });

    if (fundingTx) {
      const fundingTime = new Date(fundingTx.block_timestamp).getTime();
      const deltaMs = launchTimestamp - fundingTime;

      const hours = Math.floor(deltaMs / (1000 * 60 * 60));
      const minutes = Math.floor((deltaMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((deltaMs % (1000 * 60)) / 1000);

      const solReceived = fundingTx.tokens_received?.find(
        (t) => t.token_symbol === "SOL" || t.token_symbol === "WSOL"
      );

      result.fundingTransaction = {
        timestamp: fundingTx.block_timestamp,
        amount: solReceived?.token_amount,
        fromAddress: funder,
      };

      result.timeDelta = {
        hours,
        minutes,
        seconds,
        totalMinutes: hours * 60 + minutes,
      };

      console.log(`   FOUND FUNDING!`);
      console.log(`   Funding Time: ${fundingTx.block_timestamp}`);
      console.log(`   Time to Launch: ${hours}h ${minutes}m ${seconds}s`);
      if (solReceived) {
        console.log(`   Amount: ${solReceived.token_amount} SOL`);
      }
    } else {
      console.log(`   No funding from ${formatAddress(funder)} found in window`);
      console.log(`   Wallet may have been funded outside ${windowHours}hr window`);
    }

    // Find deployment transaction (near launch time)
    console.log(`   Looking for deployment transaction...`);
    const deployTx = transactions.find((tx) => {
      const txTime = new Date(tx.block_timestamp).getTime();
      // Within 5 minutes of launch time
      return Math.abs(txTime - launchTimestamp) < 5 * 60 * 1000;
    });

    if (deployTx) {
      result.deploymentTransaction = {
        timestamp: deployTx.block_timestamp,
        hash: deployTx.transaction_hash,
        method: deployTx.method,
      };
      console.log(`   Found deployment transaction`);
      console.log(`   Time: ${deployTx.block_timestamp}`);
      console.log(`   Method: ${deployTx.method || "Unknown"}`);
    }
  } catch (error) {
    console.error(`   Error analyzing launch window:`, error);
  }

  return result;
}

/**
 * Generate timing playbook from analyses
 */
function generatePlaybook(analyses: LaunchWindowAnalysis[]): TimingPlaybook {
  const validAnalyses = analyses.filter((a) => a.timeDelta);

  const timeDeltasMinutes = validAnalyses.map(
    (a) => a.timeDelta!.totalMinutes
  );

  const playbook: TimingPlaybook = {
    averageTimeDeltaMinutes:
      timeDeltasMinutes.length > 0
        ? Math.round(
            timeDeltasMinutes.reduce((a, b) => a + b, 0) / timeDeltasMinutes.length
          )
        : 0,
    minTimeDeltaMinutes:
      timeDeltasMinutes.length > 0 ? Math.min(...timeDeltasMinutes) : 0,
    maxTimeDeltaMinutes:
      timeDeltasMinutes.length > 0 ? Math.max(...timeDeltasMinutes) : 0,
    preFundingSignals: {},
    launches: validAnalyses.map((a) => ({
      deployerAddress: a.deployer,
      tokenTicker: a.ticker,
      tokenAddress: a.tokenAddress,
      launchDate: a.launchTime.split("T")[0],
      fundingTimestamp: a.fundingTransaction?.timestamp,
      deploymentTimestamp: a.deploymentTransaction?.timestamp,
      timeDeltaMinutes: a.timeDelta?.totalMinutes,
      timeDeltaHours: a.timeDelta
        ? Math.round((a.timeDelta.totalMinutes / 60) * 10) / 10
        : undefined,
      fundingAmount: a.fundingTransaction?.amount,
      funderAddress: a.fundingTransaction?.fromAddress,
    })),
    generatedAt: new Date().toISOString(),
  };

  // Extract typical launch hour (UTC)
  const deploymentHours = validAnalyses
    .filter((a) => a.deploymentTransaction)
    .map((a) => new Date(a.deploymentTransaction!.timestamp).getUTCHours());

  if (deploymentHours.length > 0) {
    playbook.typicalLaunchHourUTC = Math.round(
      deploymentHours.reduce((a, b) => a + b, 0) / deploymentHours.length
    );
  }

  // Extract typical day of week
  const deploymentDays = validAnalyses.map((a) =>
    new Date(a.launchTime).toLocaleDateString("en-US", { weekday: "long" })
  );

  if (deploymentDays.length > 0) {
    const dayCount: Record<string, number> = {};
    deploymentDays.forEach((day) => {
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    playbook.typicalLaunchDayOfWeek = Object.entries(dayCount).sort(
      (a, b) => b[1] - a[1]
    )[0][0];
  }

  return playbook;
}

/**
 * Calculate next launch prediction
 */
function calculatePrediction(analyses: LaunchWindowAnalysis[]): LaunchPrediction {
  // Sort by launch time
  const sorted = [...analyses].sort(
    (a, b) => new Date(a.launchTime).getTime() - new Date(b.launchTime).getTime()
  );

  const daysBetween: number[] = [];
  const tickers: string[] = sorted.map((a) => a.ticker);

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].launchTime);
    const curr = new Date(sorted[i].launchTime);
    const days = Math.floor(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    daysBetween.push(days);
  }

  const avgDays =
    daysBetween.length > 0
      ? Math.round(daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length)
      : 35; // Default to ~5 weeks if no data

  // Get most recent launch
  const mostRecent = sorted[sorted.length - 1];
  const mostRecentDate = new Date(mostRecent.launchTime);

  // Predict next launch
  const predictedDate = new Date(
    mostRecentDate.getTime() + avgDays * 24 * 60 * 60 * 1000
  );

  // Check day of week pattern
  const daysOfWeek = sorted.map((a) =>
    new Date(a.launchTime).toLocaleDateString("en-US", { weekday: "long" })
  );
  const uniqueDays = new Set(daysOfWeek);
  const dayOfWeekPattern =
    uniqueDays.size === 1 ? `Always ${Array.from(uniqueDays)[0]}` : undefined;

  // Adjust to nearest Sunday if pattern suggests Sundays
  if (dayOfWeekPattern?.includes("Sunday")) {
    const dayOfWeek = predictedDate.getDay();
    if (dayOfWeek !== 0) {
      // Not Sunday
      const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
      predictedDate.setDate(predictedDate.getDate() + daysUntilSunday);
    }
  }

  // Determine confidence
  let confidence: "high" | "medium" | "low";
  if (sorted.length >= 4 && dayOfWeekPattern) {
    confidence = "high";
  } else if (sorted.length >= 3) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    basedOn: tickers,
    daysBetweenLaunches: daysBetween,
    averageDaysBetween: avgDays,
    nextPredictedDate: predictedDate.toISOString(),
    nextPredictedDateLocal: predictedDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    dayOfWeekPattern,
    confidence,
  };
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  const options = parseArgs();

  console.log("=".repeat(60));
  console.log("TIMING ANALYSIS - Launch Pattern Analysis Tool");
  console.log("=".repeat(60));
  console.log(`\nWindow: ${options.windowHours} hours`);
  console.log(`Prediction: ${options.predict ? "enabled" : "disabled"}`);
  console.log(`Output: ${options.outputPath}\n`);

  // Get tokens sorted by launch date
  const tokenList = Object.entries(TOKENS)
    .map(([key, info]) => ({
      ...info,
      ticker: info.ticker || key, // Use info.ticker if available, else the key
    }))
    .sort((a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime());

  console.log(`Analyzing ${tokenList.length} token launches:\n`);
  for (const token of tokenList) {
    console.log(
      `   ${token.ticker}: ${new Date(token.launchDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`
    );
  }

  // Analyze each launch
  const launchAnalyses: LaunchWindowAnalysis[] = [];

  for (const token of tokenList) {
    const analysis = await analyzeLaunchWindow(
      token.ticker,
      token.address,
      token.launchDate,
      token.deployer,
      options.windowHours
    );
    launchAnalyses.push(analysis);
    await delay(2000);
  }

  // Generate playbook
  console.log("\n" + "=".repeat(60));
  console.log("GENERATING TIMING PLAYBOOK");
  console.log("=".repeat(60));

  const playbook = generatePlaybook(launchAnalyses);

  // Calculate prediction if requested
  let prediction: LaunchPrediction | undefined;

  if (options.predict) {
    console.log("\n" + "=".repeat(60));
    console.log("CALCULATING PREDICTION");
    console.log("=".repeat(60));

    prediction = calculatePrediction(launchAnalyses);

    console.log(`\nPrediction based on: ${prediction.basedOn.join(", ")}`);
    console.log(`Days between launches: ${prediction.daysBetweenLaunches.join(", ")}`);
    console.log(`Average days between: ${prediction.averageDaysBetween}`);
    console.log(`Next predicted date: ${prediction.nextPredictedDateLocal}`);
    if (prediction.dayOfWeekPattern) {
      console.log(`Day pattern: ${prediction.dayOfWeekPattern}`);
    }
    console.log(`Confidence: ${prediction.confidence}`);
  }

  // Determine patterns
  const daysOfWeek = launchAnalyses.map((a) =>
    new Date(a.launchTime).toLocaleDateString("en-US", { weekday: "long" })
  );
  const allSundays = daysOfWeek.every((d) => d === "Sunday");

  const validAnalyses = launchAnalyses.filter((a) => a.timeDelta);
  const avgFundingHours =
    validAnalyses.length > 0
      ? validAnalyses.reduce((sum, a) => sum + (a.timeDelta?.totalMinutes || 0), 0) /
        validAnalyses.length /
        60
      : undefined;

  // Build result
  const result: UnifiedTimingResult = {
    generatedAt: new Date().toISOString(),
    options,
    launchAnalyses,
    playbook,
    prediction,
    patterns: {
      typicalDayOfWeek: playbook.typicalLaunchDayOfWeek,
      typicalHourUTC: playbook.typicalLaunchHourUTC,
      avgFundingToDeployHours: avgFundingHours
        ? Math.round(avgFundingHours * 10) / 10
        : undefined,
      allSundays,
    },
  };

  // Save results
  const outputDir = options.outputPath.substring(0, options.outputPath.lastIndexOf("/"));
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(options.outputPath, JSON.stringify(result, null, 2));

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("TIMING PLAYBOOK SUMMARY");
  console.log("=".repeat(60));

  console.log(`\nLaunches analyzed: ${launchAnalyses.length}`);
  console.log(`With funding data: ${validAnalyses.length}`);

  console.log(`\nTiming Pattern:`);
  console.log(
    `   Average funding → deployment: ${playbook.averageTimeDeltaMinutes} minutes`
  );
  console.log(`   Min: ${playbook.minTimeDeltaMinutes} minutes`);
  console.log(`   Max: ${playbook.maxTimeDeltaMinutes} minutes`);

  console.log(`\nDay/Time Pattern:`);
  if (playbook.typicalLaunchDayOfWeek) {
    console.log(`   Typical day: ${playbook.typicalLaunchDayOfWeek}`);
  }
  if (playbook.typicalLaunchHourUTC !== undefined) {
    console.log(`   Typical hour (UTC): ${playbook.typicalLaunchHourUTC}:00`);
  }
  if (allSundays) {
    console.log(`   Pattern: ALL launches on Sundays`);
  }

  console.log(`\nPer-launch details:`);
  for (const analysis of launchAnalyses) {
    console.log(`   ${analysis.ticker}:`);
    console.log(`      Launch: ${analysis.launchTimeLocal}`);
    if (analysis.timeDelta) {
      console.log(
        `      Funding delta: ${analysis.timeDelta.hours}h ${analysis.timeDelta.minutes}m`
      );
    } else {
      console.log(`      Funding delta: N/A (outside window)`);
    }
  }

  if (prediction) {
    console.log(`\nNEXT LAUNCH PREDICTION:`);
    console.log(`   Date: ${prediction.nextPredictedDateLocal}`);
    console.log(`   Confidence: ${prediction.confidence.toUpperCase()}`);
  }

  console.log(`\nResults saved to: ${options.outputPath}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
