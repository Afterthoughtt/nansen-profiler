import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

// Test with original deployer only
const TEST_WALLET = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

async function testTransactions() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("🧪 Testing Transactions Endpoint\n");
  console.log(`Test Wallet: ${TEST_WALLET}\n`);
  console.log("=".repeat(80));

  const client = new NansenClient(apiKey);

  try {
    console.log("\n📡 Calling /api/v1/profiler/address/transactions...\n");

    const transactions = await client.getEarlyTransactions(TEST_WALLET, 50);

    console.log(`✅ Success! Found ${transactions.length} transactions\n`);

    if (transactions.length === 0) {
      console.log("⚠️  No transactions found for this address");
      return;
    }

    // Display first 10 transactions
    console.log("📋 First 10 Transactions:");
    console.log("=".repeat(80));
    transactions.slice(0, 10).forEach((tx, idx) => {
      console.log(
        `\n${idx + 1}. Hash: ${tx.transaction_hash.substring(0, 16)}...`,
      );
      console.log(`   Method: ${tx.method}`);
      console.log(`   Source Type: ${tx.source_type}`);
      console.log(`   Timestamp: ${tx.block_timestamp}`);
      if (tx.volume_usd) {
        console.log(`   Volume USD: $${tx.volume_usd.toFixed(2)}`);
      }
      if (tx.tokens_sent && tx.tokens_sent.length > 0) {
        console.log(
          `   Tokens Sent: ${tx.tokens_sent.map((t) => t.token_symbol).join(", ")}`,
        );
      }
      if (tx.tokens_received && tx.tokens_received.length > 0) {
        console.log(
          `   Tokens Received: ${tx.tokens_received.map((t) => t.token_symbol).join(", ")}`,
        );
      }
    });

    console.log("\n" + "=".repeat(80));
    console.log("✅ Test completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testTransactions();
