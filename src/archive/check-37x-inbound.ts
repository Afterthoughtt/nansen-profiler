import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not set");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  const TARGET = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

  console.log("🔍 CHECKING 37Xxihfs RECENT ACTIVITY");
  console.log("=".repeat(60));
  console.log(`Target: ${TARGET.slice(0, 16)}...`);
  console.log("");

  // Get recent transactions
  const txResp = await client.getTransactions({
    address: TARGET,
    chain: "solana",
    date: { from: "2025-11-28", to: "2025-11-30" },
    pagination: { page: 1, per_page: 100 },
  });

  console.log(`Found ${txResp.data?.length || 0} transactions (Nov 28-30)\n`);

  // Categorize transactions
  const inbound: Array<{ from: string; amount: number; timestamp: string }> = [];
  const outbound: Array<{ to: string; amount: number; timestamp: string }> = [];

  for (const tx of txResp.data || []) {
    // Check inbound SOL
    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        if (recv.token_symbol === "SOL" && recv.from_address && recv.from_address !== TARGET) {
          inbound.push({
            from: recv.from_address,
            amount: recv.token_amount || 0,
            timestamp: tx.block_timestamp,
          });
        }
      }
    }

    // Check outbound SOL
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        if (sent.token_symbol === "SOL" && sent.to_address && sent.to_address !== TARGET) {
          outbound.push({
            to: sent.to_address,
            amount: sent.token_amount || 0,
            timestamp: tx.block_timestamp,
          });
        }
      }
    }
  }

  // Sort by timestamp
  inbound.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  outbound.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Print inbound
  console.log("📥 INBOUND SOL (received):");
  console.log("-".repeat(60));
  if (inbound.length === 0) {
    console.log("  No inbound SOL found in date range");
  } else {
    for (const tx of inbound) {
      console.log(`  ${tx.timestamp}`);
      console.log(`    From: ${tx.from.slice(0, 16)}...`);
      console.log(`    Amount: ${tx.amount.toFixed(4)} SOL`);
      console.log("");
    }
    console.log(`  Total inbound: ${inbound.reduce((s, t) => s + t.amount, 0).toFixed(4)} SOL`);
  }

  // Print outbound
  console.log("\n📤 OUTBOUND SOL (sent):");
  console.log("-".repeat(60));
  if (outbound.length === 0) {
    console.log("  ✅ No outbound SOL found - 37Xxihfs is ACCUMULATING");
  } else {
    for (const tx of outbound) {
      console.log(`  ${tx.timestamp}`);
      console.log(`    To: ${tx.to.slice(0, 16)}...`);
      console.log(`    Amount: ${tx.amount.toFixed(4)} SOL`);
      console.log("");
    }
    console.log(`  Total outbound: ${outbound.reduce((s, t) => s + t.amount, 0).toFixed(4)} SOL`);
  }

  // Current balance
  console.log("\n\n📊 CURRENT STATUS");
  console.log("=".repeat(60));
  const balances = await client.getCurrentBalance({
    address: TARGET,
    chain: "solana",
  });
  const sol = balances.find((b) => b.token_symbol === "SOL");
  console.log(`Balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL`);

  // Investigate outbound recipients if any
  if (outbound.length > 0) {
    console.log("\n\n🎯 INVESTIGATING OUTBOUND RECIPIENTS");
    console.log("=".repeat(60));

    const uniqueRecipients = [...new Set(outbound.map((o) => o.to))];

    for (const recipient of uniqueRecipients) {
      console.log(`\n${recipient}`);

      await new Promise((r) => setTimeout(r, 1500));

      // Get First Funder
      try {
        const related = await client.getRelatedWallets({
          address: recipient,
          chain: "solana",
          pagination: { page: 1, per_page: 20 },
        });
        const ff = related.find((w) => w.relation === "First Funder");

        const is37xFirstFunder = ff?.address === TARGET;
        console.log(`  First Funder: ${ff?.address?.slice(0, 16) || "Unknown"}... ${is37xFirstFunder ? "⚠️ (37Xxihfs!)" : ""}`);
      } catch (e) {
        console.log("  First Funder: Error");
      }

      await new Promise((r) => setTimeout(r, 1500));

      // Get current balance
      try {
        const bal = await client.getCurrentBalance({
          address: recipient,
          chain: "solana",
        });
        const recipientSol = bal.find((b) => b.token_symbol === "SOL");
        const balance = recipientSol?.token_amount || 0;
        console.log(`  Current Balance: ${balance.toFixed(4)} SOL ${balance >= 5 ? "🚨 HIGH!" : ""}`);
      } catch (e) {
        console.log("  Current Balance: Error");
      }
    }
  }

  console.log("\n\n📋 SUMMARY");
  console.log("=".repeat(60));
  if (outbound.length === 0) {
    console.log("37Xxihfs has NOT sent SOL to any fresh wallet yet.");
    console.log("Either:");
    console.log("  1. Fresh wallet funding is IMMINENT (watch for new transfers)");
    console.log("  2. They're using 37Xxihfs directly as deployer");
    console.log("  3. Fresh wallet funded via different path (not 37X or v49j)");
  }
}

main().catch(console.error);
