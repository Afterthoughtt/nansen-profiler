/**
 * Investigate ROOT wallet
 * 9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF
 */

import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const ROOT = "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF";
const V49J = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function investigate() {
  console.log("=".repeat(60));
  console.log("🔍 ROOT WALLET INVESTIGATION");
  console.log("9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF");
  console.log("=".repeat(60));

  // 1. Related wallets
  console.log("\n1. RELATED WALLETS");
  console.log("-".repeat(40));

  const related = await client.getRelatedWallets({
    address: ROOT,
    chain: "solana",
    pagination: { page: 1, per_page: 50 }
  });
  await delay(2000);

  console.log("All relationships:");
  related.forEach(r => {
    console.log(`   ${r.relation}: ${r.address}`);
  });

  const firstFunder = related.find(r => r.relation === "First Funder");
  console.log("\nFirst Funder:", firstFunder?.address || "None");

  // 2. Current balance
  console.log("\n2. CURRENT BALANCE");
  console.log("-".repeat(40));

  const balance = await client.getCurrentBalance({
    address: ROOT,
    chain: "solana"
  });
  await delay(2000);

  if (balance.length === 0) {
    console.log("   No balance (wallet may be empty)");
  } else {
    balance.forEach(b => {
      console.log(`   ${b.token_symbol}: ${b.token_amount?.toFixed(6)} (~$${b.value_usd?.toFixed(2) || 0})`);
    });
  }

  // 3. Transaction history
  console.log("\n3. TRANSACTION HISTORY");
  console.log("-".repeat(40));

  const txs = await client.getTransactions({
    address: ROOT,
    chain: "solana",
    date: { from: "2024-01-01", to: "2025-12-31" },
    pagination: { page: 1, per_page: 100 }
  });
  await delay(2000);

  console.log(`Total transactions found: ${txs.data?.length || 0}`);

  if (txs.data && txs.data.length > 0) {
    // Sort by date
    const sorted = txs.data.sort((a, b) =>
      new Date(a.block_timestamp).getTime() - new Date(b.block_timestamp).getTime()
    );

    console.log("\nFirst transaction:");
    const first = sorted[0];
    console.log(`   Date: ${first.block_timestamp}`);
    console.log(`   Method: ${first.method}`);

    console.log("\nLast transaction:");
    const last = sorted[sorted.length - 1];
    console.log(`   Date: ${last.block_timestamp}`);
    console.log(`   Method: ${last.method}`);

    console.log("\nAll transactions:");
    sorted.forEach(tx => {
      const sent = tx.tokens_sent?.map(t =>
        `SENT ${t.token_amount?.toFixed(4)} ${t.token_symbol} to ${t.to_address?.slice(0, 12)}`
      ).join(", ") || "";
      const received = tx.tokens_received?.map(t =>
        `RECV ${t.token_amount?.toFixed(4)} ${t.token_symbol} from ${t.from_address?.slice(0, 12)}`
      ).join(", ") || "";

      console.log(`   ${tx.block_timestamp.split("T")[0]} | ${tx.method?.slice(0, 15)} | ${sent || received || "(no data)"}`);

      // Flag v49j interactions
      tx.tokens_sent?.forEach(t => {
        if (t.to_address === V49J) console.log("      ^ SENT TO v49j");
      });
      tx.tokens_received?.forEach(t => {
        if (t.from_address === V49J) console.log("      ^ RECEIVED FROM v49j");
      });
    });
  }

  // 4. Counterparties
  console.log("\n4. COUNTERPARTIES");
  console.log("-".repeat(40));

  const counterparties = await client.getCounterparties({
    address: ROOT,
    chain: "solana",
    date: { from: "2024-01-01", to: "2025-12-31" },
    group_by: "wallet",
    source_input: "Combined"
  });
  await delay(2000);

  console.log(`Total counterparties: ${counterparties.length}`);

  counterparties.forEach(cp => {
    const labels = cp.counterparty_address_label?.join(", ") || "";
    let note = "";
    if (cp.counterparty_address === V49J) note = " ← v49j (LEVEL 1)";

    console.log(`   ${cp.counterparty_address.slice(0, 16)}...`);
    console.log(`      Volume IN: $${cp.volume_in_usd?.toFixed(2) || 0} | Volume OUT: $${cp.volume_out_usd?.toFixed(2) || 0}`);
    console.log(`      Interactions: ${cp.interaction_count}`);
    if (labels) console.log(`      Labels: ${labels}`);
    if (note) console.log(`      ${note}`);
    console.log("");
  });

  // 5. Conclusion
  console.log("=".repeat(60));
  console.log("📋 CONCLUSION: What is ROOT?");
  console.log("=".repeat(60));
}

investigate().catch(console.error);
