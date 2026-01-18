/**
 * Investigate fresh wallet candidate: AyKGqBppiGDR
 * Could this be the January deployer?
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const CANDIDATE = "AyKGqBppiGDRhRB91gb7qLvZYVTWmXWuUGCYL4GScrTp";

async function main() {
  console.log("=== FRESH WALLET CANDIDATE INVESTIGATION ===\n");
  console.log(`Address: ${CANDIDATE}\n`);

  // 1. Check current balance
  console.log("--- Current Balance ---");
  const balance = await client.getCurrentBalance({
    address: CANDIDATE,
    chain: "solana"
  });

  const solBalance = balance.find(b => b.token_symbol === "SOL");
  const solAmt = solBalance ? Number(solBalance.token_amount) : 0;
  console.log(`SOL Balance: ${solAmt.toFixed(4)} SOL`);

  if (solAmt >= 5) {
    console.log("🚨 DEPLOYER THRESHOLD BALANCE!");
  } else if (solAmt >= 1) {
    console.log("⚠️ Moderate balance - worth monitoring");
  } else {
    console.log("✓ Low balance - unlikely to be deployer");
  }

  await delay(2000);

  // 2. Check First Funder
  console.log("\n--- First Funder Chain ---");
  const related = await client.getRelatedWallets({
    address: CANDIDATE,
    chain: "solana"
  });

  const firstFunder = related.find(w => w.relation === "First Funder");
  if (firstFunder) {
    console.log(`First Funder: ${firstFunder.address}`);
    console.log(`Label: ${firstFunder.address_label || "Unknown"}`);

    // Check if First Funder is in our chain
    const chainWallets = [
      "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5", // v49j
      "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2", // 37Xxihfs
    ];

    if (chainWallets.includes(firstFunder.address)) {
      console.log("🚨🚨🚨 FIRST FUNDER IS IN DEPLOYER CHAIN!");
    } else {
      console.log("✗ First Funder is NOT in deployer chain");
    }
  } else {
    console.log("Could not determine First Funder");
  }

  await delay(2000);

  // 3. Check all transactions
  console.log("\n--- All Transactions ---");
  const txns = await client.getTransactions({
    address: CANDIDATE,
    chain: "solana",
    date: { from: "2025-01-01T00:00:00Z", to: "2026-12-31T23:59:59Z" }
  });

  const txList = txns.data || [];
  console.log(`Total transactions: ${txList.length}`);

  for (const tx of txList) {
    console.log(`\n  ${tx.block_timestamp}`);
    console.log(`  Method: ${tx.method || "transfer"}`);

    const received = tx.tokens_received || [];
    const sent = tx.tokens_sent || [];

    for (const r of received) {
      if (r.token_symbol === "SOL" && Number(r.token_amount) > 0.001) {
        console.log(`    IN: ${Number(r.token_amount).toFixed(4)} SOL from ${r.from_address?.slice(0, 12)}...`);
      }
    }

    for (const s of sent) {
      if (s.token_symbol === "SOL" && Number(s.token_amount) > 0.001) {
        console.log(`    OUT: ${Number(s.token_amount).toFixed(4)} SOL to ${s.to_address?.slice(0, 12)}...`);
      }
    }
  }

  // 4. Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYER ASSESSMENT:");

  if (solAmt >= 8 && firstFunder?.address &&
      ["v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
       "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2"].includes(firstFunder.address)) {
    console.log("🚨🚨🚨 HIGH PROBABILITY DEPLOYER!");
    console.log("First Funder is in chain + Deployer threshold balance");
  } else if (solAmt < 1) {
    console.log("❌ LOW probability - insufficient balance");
  } else {
    console.log("⚠️ MEDIUM - Monitor but not confirmed deployer");
  }
  console.log("=".repeat(60));
}

main().catch(console.error);
