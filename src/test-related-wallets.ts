import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

// Test with original deployer only
const TEST_WALLET = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

async function testRelatedWallets() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("🧪 Testing Related Wallets Endpoint\n");
  console.log(`Test Wallet: ${TEST_WALLET}\n`);
  console.log("=".repeat(80));

  const client = new NansenClient(apiKey);

  try {
    console.log("\n📡 Calling /api/v1/profiler/address/related-wallets...\n");

    const relatedWallets = await client.getRelatedWallets({
      address: TEST_WALLET,
      chain: "solana",
      pagination: {
        page: 1,
        per_page: 20,
      },
    });

    console.log(`✅ Success! Found ${relatedWallets.length} related wallets\n`);

    if (relatedWallets.length === 0) {
      console.log("⚠️  No related wallets found for this address");
      return;
    }

    // Display all related wallets
    console.log("📋 Related Wallets:");
    console.log("=".repeat(80));
    relatedWallets.forEach((rw, idx) => {
      console.log(`\n${idx + 1}. Relation: ${rw.relation}`);
      console.log(`   Address: ${rw.address}`);
      console.log(`   Label: ${rw.address_label || "N/A"}`);
      console.log(`   Chain: ${rw.chain}`);
      console.log(`   Transaction: ${rw.transaction_hash.substring(0, 16)}...`);
      console.log(`   Timestamp: ${rw.block_timestamp}`);
      console.log(`   Order: ${rw.order}`);
    });

    // Look for First Funder specifically
    console.log("\n" + "=".repeat(80));
    const firstFunder = relatedWallets.find(
      (rw) => rw.relation === "First Funder",
    );

    if (firstFunder) {
      console.log("🎯 FIRST FUNDER FOUND!");
      console.log("=".repeat(80));
      console.log(`Address: ${firstFunder.address}`);
      console.log(`Label: ${firstFunder.address_label || "N/A"}`);
      console.log(`Transaction: ${firstFunder.transaction_hash}`);
      console.log(`Timestamp: ${firstFunder.block_timestamp}`);
    } else {
      console.log("⚠️  No 'First Funder' relationship found");
      console.log("\nAvailable Relations:");
      const relations = new Set(relatedWallets.map((rw) => rw.relation));
      relations.forEach((rel) => console.log(`  - ${rel}`));
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Test completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testRelatedWallets();
