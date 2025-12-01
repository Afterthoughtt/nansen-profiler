import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const V49J = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
const D7MS = "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb";
const DBMX = "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy";

async function check() {
  console.log("=".repeat(50));
  console.log("🔍 VERIFYING DEPLOYER DETECTION");
  console.log("=".repeat(50));

  // Check D7Ms first funder
  console.log("\n1. Checking D7Ms First Funder:");
  const d7msRelated = await client.getRelatedWallets({
    address: D7MS,
    chain: "solana",
    pagination: { page: 1, per_page: 20 }
  });

  const d7msFirstFunder = d7msRelated.find(r => r.relation === "First Funder");
  console.log("   D7Ms First Funder:", d7msFirstFunder?.address);
  console.log("   Is v49j?", d7msFirstFunder?.address === V49J ? "✅ YES" : "❌ NO");

  // Check DBmx first funder
  console.log("\n2. Checking DBmx First Funder:");
  const dbmxRelated = await client.getRelatedWallets({
    address: DBMX,
    chain: "solana",
    pagination: { page: 1, per_page: 20 }
  });

  const dbmxFirstFunder = dbmxRelated.find(r => r.relation === "First Funder");
  console.log("   DBmx First Funder:", dbmxFirstFunder?.address);
  console.log("   Is v49j?", dbmxFirstFunder?.address === V49J ? "✅ YES" : "❌ NO");

  // Check v49j's First Funder relationships (reverse lookup)
  console.log("\n3. Checking who v49j has funded (First Funder relationships):");

  // Use a different approach - check transactions where v49j sent SOL
  const v49jTxs = await client.getTransactions({
    address: V49J,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-31" },
    pagination: { page: 1, per_page: 100 }
  });

  // Find transactions where v49j sent SOL to D7Ms or DBmx
  const solSentToDeployers = v49jTxs.data?.filter(tx => {
    return tx.tokens_sent?.some(t =>
      t.token_symbol === "SOL" &&
      (t.to_address === D7MS || t.to_address === DBMX)
    );
  }) || [];

  console.log("   Transactions where v49j sent SOL to deployers:", solSentToDeployers.length);

  solSentToDeployers.forEach(tx => {
    tx.tokens_sent?.forEach(t => {
      if (t.token_symbol === "SOL" && (t.to_address === D7MS || t.to_address === DBMX)) {
        console.log(`   - ${tx.block_timestamp.split("T")[0]}: ${t.token_amount.toFixed(4)} SOL to ${t.to_address?.slice(0, 8)}...`);
      }
    });
  });

  console.log("\n" + "=".repeat(50));
  console.log("📋 CONCLUSION");
  console.log("=".repeat(50));

  if (d7msFirstFunder?.address === V49J && dbmxFirstFunder?.address === V49J) {
    console.log("\n✅ CONFIRMED: v49j is the First Funder for both D7Ms and DBmx");
    console.log("   The funding chain is verified:");
    console.log("   ROOT → v49j → Deployer (D7Ms/DBmx) → pump.fun token");
    console.log("\n🎯 MONITORING STRATEGY:");
    console.log("   When v49j sends SOL to a NEW fresh wallet, that's the deployer.");
    console.log("   Expect token launch ~2.5 hours after funding.");
  } else {
    console.log("\n⚠️ ISSUE: First Funder relationship not as expected");
  }
}

check().catch(console.error);
