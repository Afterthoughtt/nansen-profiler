import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";
import type { LaunchTimingData, TimingPlaybook, Transaction } from "./types.js";
import * as fs from "fs";
import * as path from "path";

// Known deployers with launch data
const DEPLOYERS = [
  {
    address: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    ticker: "XRPEP3",
    launchDate: "2025-09-28",
    funder: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  },
  {
    address: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
    ticker: "TrollXRP",
    launchDate: "2025-11-02",
    funder: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  },
];

const PRIMARY_FUNDER = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
const ROOT_WALLET = "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF";

async function analyzeTimingForLaunch(
  client: NansenClient,
  deployer: (typeof DEPLOYERS)[0],
): Promise<LaunchTimingData> {
  console.log(`\n📊 Analyzing timing for ${deployer.ticker} launch...`);
  console.log(`   Deployer: ${deployer.address}`);

  // Get transactions around the launch date
  const launchDate = new Date(deployer.launchDate);
  const dateFrom = new Date(launchDate);
  dateFrom.setDate(dateFrom.getDate() - 7); // 7 days before
  const dateTo = new Date(launchDate);
  dateTo.setDate(dateTo.getDate() + 1); // 1 day after

  const result: LaunchTimingData = {
    deployerAddress: deployer.address,
    tokenTicker: deployer.ticker,
    launchDate: deployer.launchDate,
    funderAddress: deployer.funder,
  };

  // Get deployer's transaction history
  console.log("   Fetching deployer transactions...");
  const deployerTxs = await client.getTransactions({
    address: deployer.address,
    chain: "solana",
    date: {
      from: dateFrom.toISOString().split("T")[0],
      to: dateTo.toISOString().split("T")[0],
    },
    pagination: { page: 1, per_page: 100 },
  });

  // Find the funding transaction (from funder to deployer)
  const fundingTx = deployerTxs.data?.find((tx) => {
    if (!tx.tokens_received) return false;
    return tx.tokens_received.some(
      (token) =>
        token.from_address === deployer.funder ||
        token.from_address?.toLowerCase() === deployer.funder.toLowerCase(),
    );
  });

  if (fundingTx) {
    result.fundingTimestamp = fundingTx.block_timestamp;
    console.log(
      `   ✅ Found funding transaction: ${fundingTx.block_timestamp}`,
    );

    // Calculate funding amount
    const solReceived = fundingTx.tokens_received?.find(
      (t) => t.token_symbol === "SOL" || t.token_symbol === "WSOL",
    );
    if (solReceived) {
      result.fundingAmount = solReceived.token_amount;
      console.log(`   💰 Funding amount: ${result.fundingAmount} SOL`);
    }
  } else {
    console.log("   ⚠️ Could not find funding transaction");
  }

  // Find the deployment transaction (pump.fun interaction)
  const deploymentTx = deployerTxs.data?.find((tx) => {
    return (
      tx.method?.toLowerCase().includes("create") ||
      tx.method?.toLowerCase().includes("deploy") ||
      tx.method?.toLowerCase().includes("initialize") ||
      tx.source_type?.toLowerCase().includes("pump")
    );
  });

  if (deploymentTx) {
    result.deploymentTimestamp = deploymentTx.block_timestamp;
    console.log(
      `   ✅ Found deployment transaction: ${deploymentTx.block_timestamp}`,
    );
  } else {
    // Use first transaction after funding as proxy for deployment
    if (fundingTx && deployerTxs.data) {
      const txsAfterFunding = deployerTxs.data.filter(
        (tx) =>
          new Date(tx.block_timestamp) > new Date(fundingTx.block_timestamp),
      );
      if (txsAfterFunding.length > 0) {
        result.deploymentTimestamp = txsAfterFunding[0].block_timestamp;
        console.log(
          `   ℹ️ Using first tx after funding as deployment: ${result.deploymentTimestamp}`,
        );
      }
    }
  }

  // Calculate time delta
  if (result.fundingTimestamp && result.deploymentTimestamp) {
    const fundingTime = new Date(result.fundingTimestamp).getTime();
    const deploymentTime = new Date(result.deploymentTimestamp).getTime();
    const deltaMs = deploymentTime - fundingTime;
    result.timeDeltaMinutes = Math.round(deltaMs / (1000 * 60));
    result.timeDeltaHours = Math.round((deltaMs / (1000 * 60 * 60)) * 10) / 10;
    console.log(
      `   ⏱️ Time delta: ${result.timeDeltaMinutes} minutes (${result.timeDeltaHours} hours)`,
    );
  }

  return result;
}

async function analyzeRootToLevel1Timing(
  client: NansenClient,
): Promise<number | undefined> {
  console.log("\n📊 Analyzing ROOT → LEVEL 1 timing...");

  // Get ROOT wallet transactions
  const rootTxs = await client.getTransactions({
    address: ROOT_WALLET,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    pagination: { page: 1, per_page: 100 },
  });

  // Find transactions to PRIMARY_FUNDER
  const fundingTxs = rootTxs.data?.filter((tx) => {
    if (!tx.tokens_sent) return false;
    return tx.tokens_sent.some(
      (token) =>
        token.to_address === PRIMARY_FUNDER ||
        token.to_address?.toLowerCase() === PRIMARY_FUNDER.toLowerCase(),
    );
  });

  if (fundingTxs && fundingTxs.length > 0) {
    console.log(
      `   Found ${fundingTxs.length} funding txs from ROOT → LEVEL 1`,
    );
    // Return the most recent one's timestamp for now
    // In practice, you'd correlate this with launch dates
  }

  return undefined;
}

async function generateTimingPlaybook(
  launches: LaunchTimingData[],
): Promise<TimingPlaybook> {
  const validLaunches = launches.filter(
    (l) => l.timeDeltaMinutes !== undefined,
  );

  const timeDeltasMinutes = validLaunches.map((l) => l.timeDeltaMinutes!);

  const playbook: TimingPlaybook = {
    averageTimeDeltaMinutes:
      timeDeltasMinutes.length > 0
        ? Math.round(
            timeDeltasMinutes.reduce((a, b) => a + b, 0) /
              timeDeltasMinutes.length,
          )
        : 0,
    minTimeDeltaMinutes:
      timeDeltasMinutes.length > 0 ? Math.min(...timeDeltasMinutes) : 0,
    maxTimeDeltaMinutes:
      timeDeltasMinutes.length > 0 ? Math.max(...timeDeltasMinutes) : 0,
    preFundingSignals: {},
    launches: launches,
    generatedAt: new Date().toISOString(),
  };

  // Extract typical launch hour (UTC)
  const deploymentHours = validLaunches
    .filter((l) => l.deploymentTimestamp)
    .map((l) => new Date(l.deploymentTimestamp!).getUTCHours());

  if (deploymentHours.length > 0) {
    playbook.typicalLaunchHourUTC = Math.round(
      deploymentHours.reduce((a, b) => a + b, 0) / deploymentHours.length,
    );
  }

  // Extract typical day of week
  const deploymentDays = validLaunches
    .filter((l) => l.deploymentTimestamp)
    .map((l) =>
      new Date(l.deploymentTimestamp!).toLocaleDateString("en-US", {
        weekday: "long",
      }),
    );

  if (deploymentDays.length > 0) {
    const dayCount: Record<string, number> = {};
    deploymentDays.forEach((day) => {
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    playbook.typicalLaunchDayOfWeek = Object.entries(dayCount).sort(
      (a, b) => b[1] - a[1],
    )[0][0];
  }

  return playbook;
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  console.log("🚀 Starting Timing Analysis");
  console.log("═".repeat(50));

  const launches: LaunchTimingData[] = [];

  // Analyze each known launch
  for (const deployer of DEPLOYERS) {
    const timingData = await analyzeTimingForLaunch(client, deployer);
    launches.push(timingData);

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Analyze ROOT → LEVEL 1 timing
  await analyzeRootToLevel1Timing(client);

  // Generate playbook
  console.log("\n📋 Generating Timing Playbook...");
  const playbook = await generateTimingPlaybook(launches);

  // Save results
  const outputDir = path.join(process.cwd(), "data", "analysis");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "timing-playbook.json");
  fs.writeFileSync(outputPath, JSON.stringify(playbook, null, 2));
  console.log(`\n✅ Timing playbook saved to: ${outputPath}`);

  // Print summary
  console.log("\n" + "═".repeat(50));
  console.log("📊 TIMING PLAYBOOK SUMMARY");
  console.log("═".repeat(50));
  console.log(
    `Average time (funding → deployment): ${playbook.averageTimeDeltaMinutes} minutes`,
  );
  console.log(`Min time: ${playbook.minTimeDeltaMinutes} minutes`);
  console.log(`Max time: ${playbook.maxTimeDeltaMinutes} minutes`);
  if (playbook.typicalLaunchHourUTC !== undefined) {
    console.log(
      `Typical launch hour (UTC): ${playbook.typicalLaunchHourUTC}:00`,
    );
  }
  if (playbook.typicalLaunchDayOfWeek) {
    console.log(`Typical launch day: ${playbook.typicalLaunchDayOfWeek}`);
  }
  console.log("\nLaunch Details:");
  for (const launch of playbook.launches) {
    console.log(`  ${launch.tokenTicker}:`);
    console.log(`    Funding: ${launch.fundingTimestamp || "N/A"}`);
    console.log(`    Deployment: ${launch.deploymentTimestamp || "N/A"}`);
    console.log(`    Delta: ${launch.timeDeltaMinutes || "N/A"} minutes`);
  }
}

main().catch(console.error);
