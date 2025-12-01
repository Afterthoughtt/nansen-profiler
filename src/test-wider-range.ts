import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not set");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  const TARGET = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

  console.log("🔍 Testing wider date range and counterparties...\n");

  // Try wider date range
  const txResp = await client.getTransactions({
    address: TARGET,
    chain: "solana",
    date: { from: "2025-11-01", to: "2025-12-01" },
    pagination: { page: 1, per_page: 100 },
  });

  console.log("Nov 1 - Dec 1 transactions:", txResp.data?.length || 0);

  if (txResp.data && txResp.data.length > 0) {
    console.log("\nLast 5 transactions:");
    for (const tx of txResp.data.slice(0, 5)) {
      console.log(`  ${tx.block_timestamp} - ${tx.method}`);
      if (tx.tokens_sent) {
        for (const s of tx.tokens_sent) {
          console.log(`    SENT: ${s.token_amount?.toFixed(4)} ${s.token_symbol} → ${s.to_address?.slice(0, 12)}...`);
        }
      }
      if (tx.tokens_received) {
        for (const r of tx.tokens_received) {
          console.log(`    RECV: ${r.token_amount?.toFixed(4)} ${r.token_symbol} ← ${r.from_address?.slice(0, 12)}...`);
        }
      }
    }
  }

  await new Promise((r) => setTimeout(r, 2000));

  // Try counterparties
  console.log("\n\n📊 Counterparties (Nov 2025):");
  console.log("-".repeat(60));

  const counterparties = await client.getCounterparties({
    address: TARGET,
    chain: "solana",
    date: { from: "2025-11-01", to: "2025-11-30" },
    group_by: "wallet",
    source_input: "Combined",
    pagination: { page: 1, per_page: 50 },
  });

  console.log(`Found ${counterparties.length} counterparties\n`);

  for (const cp of counterparties.slice(0, 15)) {
    const label = cp.counterparty_address_label?.join(", ") || "";
    console.log(`${cp.counterparty_address.slice(0, 20)}... | ${cp.interaction_count} txns | $${(cp.total_volume_usd || 0).toFixed(2)} ${label ? `| ${label}` : ""}`);
  }

  // If we found counterparties, check which ones might have received SOL
  if (counterparties.length > 0) {
    console.log("\n\n🔍 Checking counterparties with outbound volume...");

    const outboundPartners = counterparties.filter((cp) => (cp.volume_out_usd || 0) > 0);
    console.log(`Found ${outboundPartners.length} with outbound volume\n`);

    for (const cp of outboundPartners.slice(0, 10)) {
      console.log(`${cp.counterparty_address.slice(0, 16)}...`);
      console.log(`  Volume OUT: $${(cp.volume_out_usd || 0).toFixed(2)}`);
      console.log(`  Volume IN: $${(cp.volume_in_usd || 0).toFixed(2)}`);

      await new Promise((r) => setTimeout(r, 1500));

      // Check First Funder
      try {
        const related = await client.getRelatedWallets({
          address: cp.counterparty_address,
          chain: "solana",
          pagination: { page: 1, per_page: 20 },
        });
        const ff = related.find((w) => w.relation === "First Funder");
        const is37x = ff?.address === TARGET;
        console.log(`  First Funder: ${ff?.address?.slice(0, 12) || "Unknown"}... ${is37x ? "🚨 (37Xxihfs!)" : ""}`);
      } catch (e) {
        console.log("  First Funder: Error");
      }

      await new Promise((r) => setTimeout(r, 1500));

      // Check current balance
      try {
        const bal = await client.getCurrentBalance({
          address: cp.counterparty_address,
          chain: "solana",
        });
        const sol = bal.find((b) => b.token_symbol === "SOL");
        const balance = sol?.token_amount || 0;
        console.log(`  Current Balance: ${balance.toFixed(4)} SOL ${balance >= 5 ? "🚨 HIGH!" : ""}`);
      } catch (e) {
        console.log("  Current Balance: Error");
      }

      console.log("");
    }
  }
}

main().catch(console.error);
