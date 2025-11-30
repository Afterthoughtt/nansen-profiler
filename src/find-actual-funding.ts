import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import type { Transaction } from "./types.js";

// Launch data
const LAUNCHES = [
  {
    name: "XRPEP3 (Sep 28)",
    deployer: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    launchTime: "2025-09-28T17:51:54.000Z",
    launchDateLocal: "Sep 28 2025 10:51:54 AM PDT",
  },
  {
    name: "TrollXRP (Nov 2)",
    deployer: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
    launchTime: "2025-11-02T19:28:36.000Z",
    launchDateLocal: "Nov 2 2025 11:28:36 AM PST",
  },
];

const PRIMARY_FUNDER = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

async function findActualFunding() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("🔍 FINDING ACTUAL FUNDING TIME");
  console.log("=".repeat(80));
  console.log(
    "📋 Strategy: Get ALL transactions and find first funding from v49jgwyQ",
  );
  console.log("=".repeat(80));

  const client = new NansenClient(apiKey);

  for (const launch of LAUNCHES) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📊 Analyzing: ${launch.name}`);
    console.log(`🗓️  Launch Time: ${launch.launchDateLocal}`);
    console.log(`📍 Deployer: ${launch.deployer.substring(0, 8)}...`);
    console.log("=".repeat(80));

    const launchTimestamp = new Date(launch.launchTime).getTime();

    try {
      // Get ALL transactions for the deployer in 2025
      console.log(`\n📡 Fetching ALL 2025 transactions...`);
      const txResponse = await client.getTransactions({
        address: launch.deployer,
        chain: "solana",
        date: {
          from: "2025-01-01",
          to: "2025-12-31",
        },
        pagination: { page: 1, per_page: 100 },
      });

      const allTxs = txResponse.data || [];
      console.log(`   ✅ Found ${allTxs.length} total transactions`);

      // Find ALL funding from v49jgwyQ (there might be multiple)
      const fundingTxs = allTxs.filter((tx) => {
        if (tx.tokens_received && tx.tokens_received.length > 0) {
          return tx.tokens_received.some(
            (token) =>
              token.from_address &&
              token.from_address.startsWith(PRIMARY_FUNDER.substring(0, 10)),
          );
        }
        return false;
      });

      console.log(
        `\n🔍 Found ${fundingTxs.length} funding transaction(s) from v49jgwyQ`,
      );

      if (fundingTxs.length > 0) {
        // Sort by timestamp (oldest first)
        fundingTxs.sort(
          (a, b) =>
            new Date(a.block_timestamp).getTime() -
            new Date(b.block_timestamp).getTime(),
        );

        console.log(`\n📋 All Funding Transactions:\n`);

        fundingTxs.forEach((tx, idx) => {
          const txTime = new Date(tx.block_timestamp).getTime();
          const deltaMs = launchTimestamp - txTime;
          const hours = Math.floor(deltaMs / (1000 * 60 * 60));
          const days = Math.floor(hours / 24);

          const solReceived = tx.tokens_received?.find(
            (t) => t.token_symbol === "SOL",
          );
          const amount = solReceived?.token_amount || 0;

          console.log(
            `${idx + 1}. ${tx.block_timestamp} (${days} days, ${hours % 24} hours before launch)`,
          );
          console.log(`   Amount: ${amount} SOL`);
          console.log(`   Hash: ${tx.transaction_hash.substring(0, 16)}...`);

          // Check if this is BEFORE the launch
          if (deltaMs > 0) {
            console.log(`   ✅ BEFORE launch`);
          } else {
            console.log(`   ⚠️  AFTER launch`);
          }
          console.log();
        });

        // Find the funding closest to (but before) launch
        const beforeLaunchFunding = fundingTxs.filter((tx) => {
          const txTime = new Date(tx.block_timestamp).getTime();
          return txTime < launchTimestamp;
        });

        if (beforeLaunchFunding.length > 0) {
          const closestFunding =
            beforeLaunchFunding[beforeLaunchFunding.length - 1];
          const txTime = new Date(closestFunding.block_timestamp).getTime();
          const deltaMs = launchTimestamp - txTime;

          const totalHours = Math.floor(deltaMs / (1000 * 60 * 60));
          const days = Math.floor(totalHours / 24);
          const hours = totalHours % 24;
          const minutes = Math.floor(
            (deltaMs % (1000 * 60 * 60)) / (1000 * 60),
          );

          console.log(`\n🎯 FUNDING CLOSEST TO LAUNCH:`);
          console.log(`   Time: ${closestFunding.block_timestamp}`);
          console.log(
            `   Time Delta: ${days} days, ${hours} hours, ${minutes} minutes`,
          );
          console.log(`   Total Hours: ${totalHours} hours`);

          const solReceived = closestFunding.tokens_received?.find(
            (t) => t.token_symbol === "SOL",
          );
          if (solReceived) {
            console.log(`   Amount: ${solReceived.token_amount} SOL`);
          }
        }
      } else {
        console.log(`   ⚠️  No funding from v49jgwyQ found in all of 2025!`);
        console.log(
          `   💡 Checking related wallets to confirm First Funder...`,
        );

        // Double-check with related wallets
        const related = await client.getRelatedWallets({
          address: launch.deployer,
          chain: "solana",
          pagination: { page: 1, per_page: 20 },
        });

        const firstFunder = related.find(
          (rw) => rw.relation === "First Funder",
        );
        if (firstFunder) {
          console.log(`   🔗 First Funder: ${firstFunder.address}`);
          console.log(`   📅 First Funding: ${firstFunder.block_timestamp}`);
        }
      }
    } catch (error) {
      console.error(`\n❌ Error:`, error);
    }

    if (LAUNCHES.indexOf(launch) < LAUNCHES.length - 1) {
      console.log("\n⏳ Waiting 3s before next analysis...\n");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ ANALYSIS COMPLETE!");
  console.log("=".repeat(80));
}

findActualFunding();
