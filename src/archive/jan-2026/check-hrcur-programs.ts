/**
 * Check what programs HRcur has deployed
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const TARGET = "HRcur4Ggby1SVYCJyafw8sypaAnKXEG61Lv4foEgqnWb";

// Programs from related wallets
const PROGRAMS = [
  "6EECgwdaEaza3Hse",
  "Asnue24BrzvcoV55",
];

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  HRcur DEPLOYED PROGRAMS");
  console.log("=".repeat(70));

  // Get full related wallets with full addresses
  console.log("\n📍 Getting full program addresses...");
  const related = await client.getRelatedWallets({
    address: TARGET,
    chain: "solana",
    pagination: { page: 1, per_page: 20 },
  });

  for (const rw of related) {
    if (rw.relation === "Deployed Program") {
      console.log(`\n  Program: ${rw.address}`);

      // Check if it's pump.fun program
      if (rw.address === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") {
        console.log("  🚨 THIS IS PUMP.FUN PROGRAM!");
      }
    }
  }

  // Also check HRcur's First Funder chain
  console.log("\n📍 TRACING FIRST FUNDER CHAIN...");
  let currentAddress = TARGET;
  const chain: string[] = [];

  for (let level = 0; level < 5; level++) {
    const shortAddr = currentAddress.slice(0, 16);
    console.log(`  Level ${level}: ${shortAddr}...`);
    chain.push(shortAddr);

    await new Promise((r) => setTimeout(r, 1500));

    const ff = await client.findFirstFunder(currentAddress);
    if (!ff) {
      console.log(`  Level ${level + 1}: (chain ends)`);
      break;
    }
    currentAddress = ff;
  }

  console.log(`\n  Chain: ${chain.join(" → ")}`);

  // Summary comparison
  console.log("\n" + "=".repeat(70));
  console.log("  v49j USDC RECIPIENTS COMPARISON");
  console.log("=".repeat(70));
  console.log(`
  E41i:
    - Balance: 1.04 SOL + $100 USDC
    - Interactions: 1,550 (very active)
    - Programs deployed: None
    - USDC from v49j: ~$200

  HRcur:
    - Balance: 3.62 SOL + $800 USDC + $1666 USDT
    - Interactions: 40 (low activity)
    - Programs deployed: YES (2 programs)
    - USDC from v49j: ~$200

  Assessment:
    - E41i is likely a trading wallet (too active)
    - HRcur is more interesting - has deployed before, low activity
    - BUT neither has enough SOL for pump.fun deploy (needs 8-15 SOL)
    - These may be dev's personal wallets getting USDC payments
`);
}

main().catch(console.error);
