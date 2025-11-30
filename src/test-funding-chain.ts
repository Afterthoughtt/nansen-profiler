import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

// Test with fresh deployer #2 (Nov 2, 2025 - TrollXRP - MOST RECENT!)
const TEST_WALLET = "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy";

async function testFundingChain() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("🧪 Testing Multi-Level Funding Chain Tracing\n");
  console.log(`Test Wallet: ${TEST_WALLET}\n`);
  console.log("=".repeat(80));

  const client = new NansenClient(apiKey);

  try {
    console.log("\n📡 Tracing funding chain (max 2 levels)...\n");

    const chain: string[] = [TEST_WALLET];

    for (let level = 0; level < 2; level++) {
      const currentWallet = chain[chain.length - 1];
      console.log(
        `\nLevel ${level}: Analyzing ${currentWallet.substring(0, 8)}...`,
      );

      const firstFunder = await client.findFirstFunder(currentWallet);

      if (firstFunder && !chain.includes(firstFunder)) {
        chain.push(firstFunder);
        console.log(
          `  ✅ Found First Funder: ${firstFunder.substring(0, 8)}...`,
        );
      } else if (!firstFunder) {
        console.log("  ⛔ No First Funder found - end of chain");
        break;
      } else {
        console.log("  ⛔ Circular reference detected - stopping");
        break;
      }

      // Wait a bit to respect rate limits
      if (level < 1) {
        console.log("  ⏳ Waiting 2s before next call...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Reverse to show root first
    const reversedChain = [...chain].reverse();

    console.log("\n" + "=".repeat(80));
    console.log("🎯 COMPLETE FUNDING CHAIN:");
    console.log("=".repeat(80));
    console.log(`\nChain Length: ${reversedChain.length} levels\n`);

    reversedChain.forEach((wallet, idx) => {
      const label =
        idx === 0
          ? "ROOT"
          : idx === reversedChain.length - 1
            ? "DEPLOYER"
            : `LEVEL ${idx}`;
      console.log(`${idx + 1}. [${label}] ${wallet}`);
      if (idx < reversedChain.length - 1) {
        console.log("   ↓ funds ↓");
      }
    });

    console.log("\n" + "=".repeat(80));
    console.log("✅ Test completed successfully!\n");

    console.log("💡 RECOMMENDATION:");
    if (reversedChain.length > 1) {
      console.log(`   Monitor ROOT wallet: ${reversedChain[0]}`);
      console.log(
        "   This is the ultimate funding source for this deployer.\n",
      );
    } else {
      console.log("   Unable to trace beyond deployer wallet.\n");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testFundingChain();
