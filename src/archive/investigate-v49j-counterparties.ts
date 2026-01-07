/**
 * Investigate v49j's unknown counterparties
 * These 8 wallets have significant interactions with v49j but aren't deployers
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const V49J = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

// Unknown wallets from exclusivity check
const UNKNOWN_WALLETS = [
  "GTCu7wSx28ASVSvzZWhW3x1wALGnwxH6vrzoXR4UvvSK",
  "Fr6DCor29R1XNoxYaVsfSCRW65ht5F7BXJCv3wXzeeCQ",
  "E9BDLui4MJteoTbchecgTgMpwsTMiXm43TeJTfj8WiTA",
  "BR1HiYtcYv5L9oB9aydMS9G9nYSjVZcMB51AxBFUkQ8T",
  "D1XcKeSSiZNX9bE56meS8hcR3ZEeoBU3GAejDdm3sTVQ",
  "B8aWJoDqZPSZkHQL7BuURR95ujox4oubgFR8g1q3kpzW",
  "6M2Pp3vkmNaoq9idYsU8fcNZKUJnVqHuhtx8D5e6maB"
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function investigate() {
  console.log("\n🔍 INVESTIGATING v49j's UNKNOWN COUNTERPARTIES");
  console.log("=".repeat(60));
  console.log("These wallets have significant volume with v49j but aren't known deployers.");
  console.log("Question: Are any of them POTENTIAL FUTURE deployers or alternative paths?\n");

  const results: any[] = [];

  for (const wallet of UNKNOWN_WALLETS) {
    console.log(`\n--- ${wallet.slice(0, 12)}... ---`);

    try {
      // 1. Get First Funder
      const related = await client.getRelatedWallets({
        address: wallet,
        chain: "solana",
        pagination: { page: 1, per_page: 20 }
      });
      await delay(2000);

      const firstFunder = related.find(r => r.relation === "First Funder");
      const deployedVia = related.find(r => r.relation === "Deployed via");

      console.log("First Funder:", firstFunder?.address?.slice(0, 12) || "None");

      // Is v49j the first funder?
      const isV49jFirstFunder = firstFunder?.address === V49J;
      if (isV49jFirstFunder) {
        console.log("⚠️ v49j IS the First Funder - THIS IS A POTENTIAL DEPLOYER");
      }

      // Has it deployed tokens?
      if (deployedVia) {
        console.log("🎯 HAS DEPLOYED TOKENS via", deployedVia.address.slice(0, 12));
      }

      // 2. Check if fresh
      const isFresh = await client.isWalletFresh(wallet, 30);
      await delay(2000);
      console.log("Is Fresh (< 30 interactions):", isFresh ? "YES" : "NO");

      // 3. Get balance
      const balance = await client.getCurrentBalance({
        address: wallet,
        chain: "solana"
      });
      await delay(2000);

      const solBalance = balance.find(b => b.token_symbol === "SOL");
      console.log("SOL Balance:", solBalance?.token_amount?.toFixed(4) || 0);

      results.push({
        wallet,
        firstFunder: firstFunder?.address || null,
        isV49jFirstFunder,
        hasDeployed: !!deployedVia,
        isFresh,
        solBalance: solBalance?.token_amount || 0
      });

    } catch (e: any) {
      console.log("Error:", e.message);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 SUMMARY: v49j UNKNOWN COUNTERPARTIES");
  console.log("=".repeat(60));

  const potentialDeployers = results.filter(r => r.isV49jFirstFunder);
  const hasDeployed = results.filter(r => r.hasDeployed);
  const fresh = results.filter(r => r.isFresh);

  console.log("\nPotential Deployers (v49j is First Funder):", potentialDeployers.length);
  potentialDeployers.forEach(r => console.log("  -", r.wallet));

  console.log("\nHave Deployed Tokens:", hasDeployed.length);
  hasDeployed.forEach(r => console.log("  -", r.wallet));

  console.log("\nFresh Wallets:", fresh.length);
  fresh.forEach(r => console.log("  -", r.wallet));

  console.log("\n📊 CONCLUSION:");
  if (potentialDeployers.length > 0 || hasDeployed.length > 0) {
    console.log("⚠️ FOUND ADDITIONAL DEPLOYERS FUNDED BY v49j!");
    console.log("These should be added to the known deployers list.");
  } else {
    console.log("✅ No additional deployers found in v49j's counterparties.");
    console.log("Unknown interactions are likely trading activity, not deployer funding.");
  }

  // Check: What are these wallets used for?
  console.log("\n\n🔎 WALLET CLASSIFICATION:");
  for (const r of results) {
    let classification = "Unknown";
    if (r.isV49jFirstFunder && r.isFresh) {
      classification = "🎯 DEPLOYER CANDIDATE";
    } else if (r.hasDeployed) {
      classification = "🎯 CONFIRMED DEPLOYER";
    } else if (r.firstFunder && r.firstFunder.includes("Coinbase")) {
      classification = "🏦 CEX-originated";
    } else if (r.solBalance > 10) {
      classification = "💰 Active trading wallet";
    } else {
      classification = "❓ Unclear purpose";
    }
    console.log(`  ${r.wallet.slice(0, 12)}... → ${classification}`);
  }
}

investigate().catch(console.error);
