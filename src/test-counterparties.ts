import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

// Test with original deployer only
const TEST_WALLET = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

async function testCounterparties() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("🧪 Testing Counterparties Endpoint\n");
  console.log(`Test Wallet: ${TEST_WALLET}\n`);
  console.log("=".repeat(80));

  const client = new NansenClient(apiKey);

  try {
    console.log("\n📡 Calling /api/v1/profiler/address/counterparties...\n");

    const counterparties = await client.getCounterparties({
      address: TEST_WALLET,
      chain: "solana",
      group_by: "wallet",
      source_input: "Combined",
      date: {
        from: "2025-01-01",
        to: "2025-12-31",
      },
      filters: {
        total_volume_usd: { min: 100 },
      },
      order_by: [{ field: "total_volume_usd", direction: "DESC" }],
    });

    console.log(`✅ Success! Found ${counterparties.length} counterparties\n`);

    if (counterparties.length === 0) {
      console.log("⚠️  No counterparties found for this address");
      return;
    }

    // Display top 10 counterparties
    console.log("📋 Top Counterparties:");
    console.log("=".repeat(80));
    counterparties.slice(0, 10).forEach((cp, idx) => {
      console.log(
        `\n${idx + 1}. ${cp.counterparty_address.substring(0, 8)}...`,
      );
      console.log(
        `   Labels: ${cp.counterparty_address_label?.join(", ") || "N/A"}`,
      );
      console.log(`   Interactions: ${cp.interaction_count}`);
      console.log(`   Total Volume: $${cp.total_volume_usd?.toFixed(2) || 0}`);
      console.log(`   Volume In: $${cp.volume_in_usd?.toFixed(2) || 0}`);
      console.log(`   Volume Out: $${cp.volume_out_usd?.toFixed(2) || 0}`);
    });

    // Find top funding sources
    console.log("\n" + "=".repeat(80));
    const fundingSources = counterparties
      .filter((cp) => (cp.volume_in_usd || 0) > 0)
      .sort((a, b) => (b.volume_in_usd || 0) - (a.volume_in_usd || 0))
      .slice(0, 5);

    console.log("🎯 TOP 5 FUNDING SOURCES:");
    console.log("=".repeat(80));
    fundingSources.forEach((cp, idx) => {
      console.log(
        `${idx + 1}. ${cp.counterparty_address} - $${cp.volume_in_usd?.toFixed(2)}`,
      );
      if (
        cp.counterparty_address_label &&
        cp.counterparty_address_label.length > 0
      ) {
        console.log(`   [${cp.counterparty_address_label.join(", ")}]`);
      }
    });

    console.log("\n" + "=".repeat(80));
    console.log("✅ Test completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testCounterparties();
