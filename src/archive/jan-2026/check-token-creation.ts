/**
 * Check when QuantumCore and b2FK tokens were first created
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const TOKENS = [
  { name: "QuantumCore", address: "7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho" },
  { name: "b2FK", address: "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs" },
];

async function checkToken(name: string, address: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`  ${address}`);
  console.log("=".repeat(60));

  // Get transactions for the token address to find first activity
  console.log("\n📍 First transactions (creation date)...");

  try {
    const txResult = await client.getTransactions({
      address: address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: { page: 1, per_page: 20 },
    });

    const transactions = txResult.data || [];
    console.log(`  Found ${transactions.length} transactions`);

    if (transactions.length > 0) {
      // Sort by timestamp to find earliest
      const sorted = transactions.sort(
        (a, b) =>
          new Date(a.block_timestamp || 0).getTime() -
          new Date(b.block_timestamp || 0).getTime()
      );

      console.log("\n  Earliest transactions:");
      for (const tx of sorted.slice(0, 5)) {
        console.log(`    ${tx.block_timestamp}`);
        console.log(`      Hash: ${tx.transaction_hash?.slice(0, 20)}...`);
      }

      console.log("\n  Latest transactions:");
      for (const tx of sorted.slice(-3)) {
        console.log(`    ${tx.block_timestamp}`);
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message}`);
  }

  // Also check related wallets for deployer info
  console.log("\n📍 Deployer info...");
  try {
    const related = await client.getRelatedWallets({
      address: address,
      chain: "solana",
      pagination: { page: 1, per_page: 10 },
    });

    for (const rw of related) {
      console.log(`  ${rw.relation}: ${rw.address}`);
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message}`);
  }
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  TOKEN CREATION DATE INVESTIGATION");
  console.log("  When were QuantumCore and b2FK first minted?");
  console.log("=".repeat(60));

  for (const token of TOKENS) {
    await checkToken(token.name, token.address);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n" + "=".repeat(60));
  console.log("  POSSIBLE EXPLANATIONS");
  console.log("=".repeat(60));
  console.log(`
  Why would these tokens exist if launching via pump.fun?

  1. TEST TOKENS - Testing the minting/distribution process
  2. AIRDROPS - Pre-distributing to insiders before pump.fun launch
  3. DIFFERENT PROJECT - Unrelated to Quantum X
  4. BACKUP PLAN - Custom SPL as fallback if pump.fun fails
  5. UTILITY TOKENS - Separate from main launch token
  6. REWARDS/POINTS - Internal tracking system
`);
}

main().catch(console.error);
