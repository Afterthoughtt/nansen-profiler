import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

async function findFunding() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ No API key");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);

  console.log("🔍 Finding funding transactions from v49jgwyQ to deployers\n");

  // Get transactions from v49jgwyQ for Sept-Nov period
  console.log("📡 Fetching v49jgwyQ transactions (Sept-Nov 2025)...");

  const txs = await client.getTransactions({
    address: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
    chain: "solana",
    date: {
      from: "2025-09-01",
      to: "2025-11-30",
    },
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txs.data || [];
  console.log(`✅ Got ${transactions.length} transactions\n`);

  const deployers = {
    sep28: {
      addr: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
      launch: "2025-09-28T17:51:54.000Z",
    },
    nov2: {
      addr: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
      launch: "2025-11-02T19:28:36.000Z",
    },
  };

  for (const [name, deployer] of Object.entries(deployers)) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`${name.toUpperCase()} Deployer`);
    console.log(`=".repeat(60)}`);
    console.log(`Address: ${deployer.addr.substring(0, 16)}...`);
    console.log(`Launch: ${deployer.launch}\n`);

    const fundingTxs = transactions.filter((tx) => {
      if (tx.tokens_sent && tx.tokens_sent.length > 0) {
        return tx.tokens_sent.some(
          (token) =>
            token.to_address &&
            token.to_address.startsWith(deployer.addr.substring(0, 10)),
        );
      }
      return false;
    });

    console.log(`Found ${fundingTxs.length} funding transaction(s):\n`);

    const launchTime = new Date(deployer.launch).getTime();

    fundingTxs.forEach((tx) => {
      const txTime = new Date(tx.block_timestamp).getTime();
      const deltaMs = launchTime - txTime;
      const hours = Math.floor(Math.abs(deltaMs) / (1000 * 60 * 60));
      const minutes = Math.floor(
        (Math.abs(deltaMs) % (1000 * 60 * 60)) / (1000 * 60),
      );
      const beforeAfter = deltaMs > 0 ? "BEFORE" : "AFTER";

      const solSent = tx.tokens_sent?.find((t) => t.token_symbol === "SOL");

      console.log(`  Time: ${tx.block_timestamp}`);
      console.log(`  Amount: ${Math.abs(solSent?.token_amount || 0)} SOL`);
      console.log(`  Timing: ${hours}h ${minutes}m ${beforeAfter} launch`);
      console.log();
    });
  }
}

findFunding();
