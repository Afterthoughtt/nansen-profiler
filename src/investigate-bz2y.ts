import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not set");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  const TARGET = "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y";

  console.log("🔍 INVESTIGATING POTENTIAL FRESH DEPLOYER");
  console.log("=".repeat(60));
  console.log(`Target: ${TARGET}`);
  console.log("");

  // 1. Get current balance
  console.log("📊 CURRENT BALANCE");
  console.log("-".repeat(60));
  const balances = await client.getCurrentBalance({
    address: TARGET,
    chain: "solana",
  });
  for (const b of balances) {
    if (b.token_amount > 0) {
      console.log(`  ${b.token_symbol}: ${b.token_amount.toFixed(4)} ($${(b.value_usd || 0).toFixed(2)})`);
    }
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 2. Get related wallets
  console.log("\n\n📊 RELATED WALLETS");
  console.log("-".repeat(60));
  const related = await client.getRelatedWallets({
    address: TARGET,
    chain: "solana",
    pagination: { page: 1, per_page: 50 },
  });

  for (const rw of related) {
    console.log(`  ${rw.relation}: ${rw.address.slice(0, 20)}... ${rw.address_label ? `(${rw.address_label})` : ""}`);
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 3. Get recent transactions
  console.log("\n\n📊 RECENT TRANSACTIONS");
  console.log("-".repeat(60));
  const txResp = await client.getTransactions({
    address: TARGET,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    pagination: { page: 1, per_page: 50 },
  });

  console.log(`Total transactions: ${txResp.data?.length || 0}\n`);

  for (const tx of (txResp.data || []).slice(0, 15)) {
    console.log(`${tx.block_timestamp} - ${tx.method}`);
    if (tx.tokens_received) {
      for (const r of tx.tokens_received) {
        console.log(`  RECV: ${r.token_amount?.toFixed(4)} ${r.token_symbol} ← ${r.from_address?.slice(0, 12)}...`);
      }
    }
    if (tx.tokens_sent) {
      for (const s of tx.tokens_sent) {
        console.log(`  SENT: ${s.token_amount?.toFixed(4)} ${s.token_symbol} → ${s.to_address?.slice(0, 12)}...`);
      }
    }
    console.log("");
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 4. Get counterparties
  console.log("\n\n📊 COUNTERPARTIES");
  console.log("-".repeat(60));
  const counterparties = await client.getCounterparties({
    address: TARGET,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    group_by: "wallet",
    source_input: "Combined",
    pagination: { page: 1, per_page: 30 },
  });

  console.log(`Total counterparties: ${counterparties.length}\n`);

  for (const cp of counterparties.slice(0, 15)) {
    const label = cp.counterparty_address_label?.join(", ") || "";
    console.log(`${cp.counterparty_address.slice(0, 20)}...`);
    console.log(`  Interactions: ${cp.interaction_count} | Volume: $${(cp.total_volume_usd || 0).toFixed(2)}`);
    if (label) console.log(`  Label: ${label}`);
    console.log("");
  }

  // 5. Check for pump.fun interactions
  console.log("\n\n📊 PUMP.FUN CHECK");
  console.log("-".repeat(60));

  const pumpFunCounterparties = counterparties.filter((cp) => {
    const label = cp.counterparty_address_label?.join(" ").toLowerCase() || "";
    return label.includes("pump.fun") || label.includes("bonding curve");
  });

  if (pumpFunCounterparties.length > 0) {
    console.log(`🚨 Found ${pumpFunCounterparties.length} pump.fun interactions!`);
    for (const cp of pumpFunCounterparties) {
      console.log(`  ${cp.counterparty_address.slice(0, 20)}...`);
      console.log(`  Label: ${cp.counterparty_address_label?.join(", ")}`);
    }
  } else {
    console.log("  ✅ No pump.fun interactions found yet");
    console.log("  This wallet has NOT deployed any tokens (yet)");
  }

  // 6. Summary
  console.log("\n\n📋 SUMMARY");
  console.log("=".repeat(60));

  const sol = balances.find((b) => b.token_symbol === "SOL");
  const balance = sol?.token_amount || 0;

  const firstFunder = related.find((r) => r.relation === "First Funder");
  const is37xChild = firstFunder?.address === "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

  console.log(`Address: ${TARGET}`);
  console.log(`Balance: ${balance.toFixed(4)} SOL`);
  console.log(`First Funder: ${firstFunder?.address?.slice(0, 16) || "Unknown"}... ${is37xChild ? "(37Xxihfs ✅)" : ""}`);
  console.log(`Total Transactions: ${txResp.data?.length || 0}`);
  console.log(`Has deployed tokens: ${pumpFunCounterparties.length > 0 ? "YES" : "NO"}`);

  if (is37xChild && balance >= 5 && pumpFunCounterparties.length === 0) {
    console.log("\n🚨 HIGH PROBABILITY FRESH DEPLOYER!");
    console.log("   - Funded by 37Xxihfs");
    console.log("   - Has deployment-sized balance");
    console.log("   - Has NOT deployed any tokens yet");
    console.log("\n   👀 MONITOR THIS WALLET FOR pump.fun ACTIVITY");
  }
}

main().catch(console.error);
