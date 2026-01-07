import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const NOV2_DEPLOYER = "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy";
const NOV2_LAUNCH_TIME = "2025-11-02T19:28:36.000Z"; // 11:28 AM PST
const PRIMARY_FUNDER = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

async function checkNov2Funding() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found");
    process.exit(1);
  }

  console.log("🔍 CHECKING NOV 2 FUNDING");
  console.log("=".repeat(80));
  console.log(`Deployer: ${NOV2_DEPLOYER}`);
  console.log(`Launch Time: Nov 2 2025 11:28 AM PST`);
  console.log("=".repeat(80));

  const client = new NansenClient(apiKey);

  // Get transactions on Nov 2
  console.log("\n📡 Fetching Nov 2 transactions...");
  const txs = await client.getTransactions({
    address: NOV2_DEPLOYER,
    chain: "solana",
    date: {
      from: "2025-11-02",
      to: "2025-11-02",
    },
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txs.data || [];
  console.log(`✅ Found ${transactions.length} transactions on Nov 2\n`);

  // Find funding from v49jgwyQ
  const fundingTxs = transactions.filter((tx) => {
    if (tx.tokens_received && tx.tokens_received.length > 0) {
      return tx.tokens_received.some(
        (token) =>
          token.from_address &&
          token.from_address.includes(PRIMARY_FUNDER.substring(0, 10)),
      );
    }
    return false;
  });

  console.log(
    `🔍 Found ${fundingTxs.length} funding transaction(s) from v49jgwyQ\n`,
  );

  const launchTimestamp = new Date(NOV2_LAUNCH_TIME).getTime();

  fundingTxs.forEach((tx, idx) => {
    const txTime = new Date(tx.block_timestamp).getTime();
    const deltaMs = launchTimestamp - txTime;
    const hours = Math.floor(deltaMs / (1000 * 60 * 60));
    const minutes = Math.floor((deltaMs % (1000 * 60 * 60)) / (1000 * 60));

    const solReceived = tx.tokens_received?.find(
      (t) => t.token_symbol === "SOL",
    );

    console.log(`${idx + 1}. Funding Transaction:`);
    console.log(`   Time: ${tx.block_timestamp}`);
    console.log(`   Amount: ${solReceived?.token_amount || 0} SOL`);
    console.log(`   Hash: ${tx.transaction_hash.substring(0, 16)}...`);
    console.log(`   ⏱️  Time to Launch: ${hours}h ${minutes}m\n`);
  });

  if (fundingTxs.length === 0) {
    console.log("⚠️  No funding from v49jgwyQ found on Nov 2");
    console.log("Checking nearby dates...\n");

    // Check Nov 1
    const nov1Txs = await client.getTransactions({
      address: NOV2_DEPLOYER,
      chain: "solana",
      date: {
        from: "2025-11-01",
        to: "2025-11-01",
      },
      pagination: { page: 1, per_page: 100 },
    });

    console.log(`Nov 1: ${nov1Txs.data?.length || 0} transactions`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ DONE");
  console.log("=".repeat(80));
}

checkNov2Funding();
