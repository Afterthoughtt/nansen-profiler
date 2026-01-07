/**
 * Investigate 37Xxihfs recent activity
 * CRITICAL: This wallet was supposed to be dormant but has recent activity!
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const ORIGINAL = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

async function investigate() {
  console.log("\n" + "=".repeat(60));
  console.log("🚨 CRITICAL: 37Xxihfs RECENT ACTIVITY INVESTIGATION");
  console.log("=".repeat(60));

  // Get recent transactions
  console.log("\n📍 Getting transactions since September 2025...");
  const txResult = await client.getTransactions({
    address: ORIGINAL,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    pagination: { page: 1, per_page: 50 },
  });

  const transactions = txResult.data || [];
  console.log(`   Found ${transactions.length} transactions\n`);

  console.log("Recent transactions:");
  for (const tx of transactions.slice(0, 20)) {
    console.log(`\n  ${tx.block_timestamp}`);
    console.log(`  TX: ${tx.transaction_hash?.slice(0, 20)}...`);

    if (tx.tokens_sent && tx.tokens_sent.length > 0) {
      for (const sent of tx.tokens_sent) {
        const amount = sent.token_amount?.toFixed(4) || "?";
        const symbol = sent.token_symbol || "unknown";
        const to = sent.to_address?.slice(0, 12) || "unknown";
        console.log(`    SENT: ${amount} ${symbol} → ${to}...`);
      }
    }

    if (tx.tokens_received && tx.tokens_received.length > 0) {
      for (const recv of tx.tokens_received) {
        const amount = recv.token_amount?.toFixed(4) || "?";
        const symbol = recv.token_symbol || "unknown";
        const from = recv.from_address?.slice(0, 12) || "unknown";
        console.log(`    RECV: ${amount} ${symbol} ← ${from}...`);
      }
    }

    // Check for pump.fun programs
    if (tx.program_ids) {
      const pumpPrograms = tx.program_ids.filter(p =>
        p.toLowerCase().includes("pump")
      );
      if (pumpPrograms.length > 0) {
        console.log(`    ⚠️ PUMP.FUN PROGRAM: ${pumpPrograms[0].slice(0, 20)}...`);
      }
    }
  }

  // Get counterparties
  console.log("\n" + "=".repeat(60));
  console.log("📍 Counterparties (Sep-Nov 2025)");
  console.log("=".repeat(60));

  await new Promise(r => setTimeout(r, 2000));

  const counterparties = await client.getCounterparties({
    address: ORIGINAL,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    group_by: "wallet",
    source_input: "Combined",
  });

  console.log(`\nFound ${counterparties.length} counterparties:\n`);

  for (const cp of counterparties.slice(0, 15)) {
    const labels = cp.labels?.join(", ") || "No label";
    const addr = cp.counterparty_address.slice(0, 16);
    console.log(`  ${addr}... | ${cp.interaction_count} interactions`);
    console.log(`    Volume: $${cp.volume_usd?.toFixed(2) || "?"}`);
    console.log(`    Labels: ${labels}`);
  }

  // Check First Funder
  console.log("\n" + "=".repeat(60));
  console.log("📍 First Funder Check");
  console.log("=".repeat(60));

  await new Promise(r => setTimeout(r, 2000));

  const firstFunder = await client.findFirstFunder(ORIGINAL);
  console.log(`\nFirst Funder: ${firstFunder || "Unknown"}`);

  // Get related wallets
  const related = await client.getRelatedWallets({
    address: ORIGINAL,
    chain: "solana",
    pagination: { page: 1, per_page: 20 },
  });

  console.log("\nRelated Wallets:");
  for (const rw of related) {
    const labels = rw.labels?.join(", ") || "No label";
    console.log(`  ${rw.relation}: ${rw.address.slice(0, 16)}...`);
    console.log(`    Labels: ${labels}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 SUMMARY");
  console.log("=".repeat(60));
  console.log(`
Address: ${ORIGINAL}
First Funder: ${firstFunder || "Unknown"}
Transactions since Sep: ${transactions.length}
Counterparties: ${counterparties.length}

⚠️ ALERT: This wallet was assumed dormant but has recent activity!
   Investigate whether it's still being used for deployments.
`);
}

investigate().catch(console.error);
