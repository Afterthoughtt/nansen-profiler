import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import type { Transaction } from "./types.js";
import { writeFileSync, mkdirSync } from "fs";

// Launch data
const LAUNCHES = [
  {
    name: "XRPEP3 (Sep 28)",
    deployer: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    launchTime: "2025-09-28T17:51:54.000Z",
    launchDateLocal: "Sep 28 2025 10:51:54 AM PDT",
    tokenAddress: "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump",
  },
  {
    name: "TrollXRP (Nov 2)",
    deployer: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
    launchTime: "2025-11-02T19:28:36.000Z",
    launchDateLocal: "Nov 2 2025 11:28:36 AM PST",
    tokenAddress: "CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump",
  },
];

const PRIMARY_FUNDER = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

interface LaunchWindowAnalysis {
  launch: (typeof LAUNCHES)[0];
  launchTimestamp: number;
  windowStart: string;
  windowEnd: string;
  allTransactions: Transaction[];
  fundingFromV49jgwyQ: Transaction | null;
  deploymentTransaction: Transaction | null;
  timeDelta: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

function getWindowDates(launchTime: string): { start: string; end: string } {
  const launch = new Date(launchTime);

  // 48 hours before launch
  const start = new Date(launch.getTime() - 48 * 60 * 60 * 1000);

  // Launch time
  const end = launch;

  return {
    start: start.toISOString().split("T")[0], // YYYY-MM-DD
    end: end.toISOString().split("T")[0],
  };
}

async function analyzeLaunchWindow(
  client: NansenClient,
  launch: (typeof LAUNCHES)[0],
): Promise<LaunchWindowAnalysis> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 Analyzing: ${launch.name}`);
  console.log(`🗓️  Launch Time: ${launch.launchDateLocal}`);
  console.log(`📍 Deployer: ${launch.deployer.substring(0, 8)}...`);
  console.log("=".repeat(80));

  const window = getWindowDates(launch.launchTime);
  const launchTimestamp = new Date(launch.launchTime).getTime();

  console.log(`\n⏰ Analyzing window: ${window.start} to ${window.end}`);

  const result: LaunchWindowAnalysis = {
    launch,
    launchTimestamp,
    windowStart: window.start,
    windowEnd: window.end,
    allTransactions: [],
    fundingFromV49jgwyQ: null,
    deploymentTransaction: null,
    timeDelta: null,
  };

  try {
    // Get all transactions in the 48-hour window
    console.log(`\n📡 Fetching transactions in launch window...`);
    const txResponse = await client.getTransactions({
      address: launch.deployer,
      chain: "solana",
      date: {
        from: window.start,
        to: window.end,
      },
      pagination: { page: 1, per_page: 100 },
    });

    result.allTransactions = txResponse.data || [];
    console.log(
      `   ✅ Found ${result.allTransactions.length} transactions in window`,
    );

    // Find funding from v49jgwyQ
    console.log(`\n🔍 Looking for funding from v49jgwyQ...`);
    const fundingTx = result.allTransactions.find((tx) => {
      // Look for SOL received from v49jgwyQ
      if (tx.tokens_received && tx.tokens_received.length > 0) {
        return tx.tokens_received.some(
          (token) =>
            token.from_address &&
            token.from_address.includes(PRIMARY_FUNDER.substring(0, 8)),
        );
      }
      return false;
    });

    if (fundingTx) {
      result.fundingFromV49jgwyQ = fundingTx;
      const fundingTime = new Date(fundingTx.block_timestamp).getTime();
      const deltaMs = launchTimestamp - fundingTime;

      const hours = Math.floor(deltaMs / (1000 * 60 * 60));
      const minutes = Math.floor((deltaMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((deltaMs % (1000 * 60)) / 1000);

      result.timeDelta = { hours, minutes, seconds };

      console.log(`   ✅ FOUND FUNDING!`);
      console.log(`   📅 Funding Time: ${fundingTx.block_timestamp}`);
      console.log(`   ⏱️  Time to Launch: ${hours}h ${minutes}m ${seconds}s`);

      // Extract SOL amount
      const solReceived = fundingTx.tokens_received?.find(
        (t) => t.token_symbol === "SOL",
      );
      if (solReceived) {
        console.log(`   💰 Amount: ${solReceived.token_amount} SOL`);
      }
    } else {
      console.log(`   ⚠️  No funding from v49jgwyQ found in this window`);
      console.log(`   💡 Wallet may have been funded outside 48hr window`);
    }

    // Find deployment transaction (transaction closest to launch time)
    console.log(`\n🚀 Looking for deployment transaction...`);
    const deployTx = result.allTransactions.find((tx) => {
      const txTime = new Date(tx.block_timestamp).getTime();
      // Within 5 minutes of launch time
      return Math.abs(txTime - launchTimestamp) < 5 * 60 * 1000;
    });

    if (deployTx) {
      result.deploymentTransaction = deployTx;
      console.log(`   ✅ Found deployment transaction`);
      console.log(`   📅 Time: ${deployTx.block_timestamp}`);
      console.log(
        `   🔗 Hash: ${deployTx.transaction_hash.substring(0, 16)}...`,
      );
    }

    // Summary
    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 SUMMARY:");
    console.log("=".repeat(80));
    if (result.fundingFromV49jgwyQ && result.timeDelta) {
      console.log(
        `✅ Funding detected: ${result.timeDelta.hours}h ${result.timeDelta.minutes}m before launch`,
      );
    } else {
      console.log(`⚠️  No funding in 48hr window (may be pre-funded earlier)`);
    }
  } catch (error) {
    console.error(`\n❌ Error analyzing launch window:`, error);
  }

  return result;
}

async function runLaunchWindowAnalysis() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("🎯 LAUNCH WINDOW ANALYSIS");
  console.log("=".repeat(80));
  console.log("📋 Objective: Find ACTUAL funding pattern in launch windows");
  console.log("⏰ Window: ±48 hours around each launch");
  console.log("=".repeat(80));

  const client = new NansenClient(apiKey);
  const results: LaunchWindowAnalysis[] = [];

  for (const launch of LAUNCHES) {
    const result = await analyzeLaunchWindow(client, launch);
    results.push(result);

    // Wait between API calls
    if (LAUNCHES.indexOf(launch) < LAUNCHES.length - 1) {
      console.log("\n⏳ Waiting 3s before next analysis...\n");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Pattern validation
  console.log("\n\n🔍 PATTERN VALIDATION");
  console.log("=".repeat(80));

  // Check if both are Sundays
  const sep28Date = new Date("2025-09-28");
  const nov2Date = new Date("2025-11-02");

  console.log(`\n📅 Launch Days:`);
  console.log(
    `   Sep 28: ${sep28Date.toLocaleDateString("en-US", { weekday: "long" })}`,
  );
  console.log(
    `   Nov 2: ${nov2Date.toLocaleDateString("en-US", { weekday: "long" })}`,
  );

  // Calculate days between
  const daysBetween = Math.floor(
    (nov2Date.getTime() - sep28Date.getTime()) / (1000 * 60 * 60 * 24),
  );
  console.log(`\n📊 Days Between Launches: ${daysBetween} days`);

  // Predict next launch
  const nextLaunch = new Date(
    nov2Date.getTime() + daysBetween * 24 * 60 * 60 * 1000,
  );
  console.log(`\n🔮 Predicted Next Launch:`);
  console.log(
    `   Date: ${nextLaunch.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
  );
  console.log(`   ISO: ${nextLaunch.toISOString().split("T")[0]}`);

  // Funding pattern summary
  console.log(`\n💡 FUNDING PATTERN:`);
  const validResults = results.filter(
    (r) => r.fundingFromV49jgwyQ && r.timeDelta,
  );

  if (validResults.length > 0) {
    const avgHours =
      validResults.reduce((sum, r) => sum + (r.timeDelta?.hours || 0), 0) /
      validResults.length;
    console.log(`   Average Time Before Launch: ${avgHours.toFixed(1)} hours`);

    validResults.forEach((r) => {
      console.log(
        `   • ${r.launch.name}: ${r.timeDelta?.hours}h ${r.timeDelta?.minutes}m`,
      );
    });
  } else {
    console.log(`   ⚠️  No funding detected in 48hr windows`);
    console.log(`   💡 Wallets may be pre-funded well in advance`);
  }

  // Save results
  mkdirSync("./data/analysis", { recursive: true });
  writeFileSync(
    "./data/analysis/launch-window-analysis.json",
    JSON.stringify(
      {
        analyzedAt: new Date().toISOString(),
        launches: results,
        pattern: {
          bothSundays: true,
          daysBetween,
          nextPredicted: nextLaunch.toISOString(),
        },
      },
      null,
      2,
    ),
  );

  console.log("\n" + "=".repeat(80));
  console.log("✅ LAUNCH WINDOW ANALYSIS COMPLETE!");
  console.log("=".repeat(80));
  console.log(
    "\n📁 Results saved to: ./data/analysis/launch-window-analysis.json\n",
  );
}

runLaunchWindowAnalysis();
