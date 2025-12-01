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

  console.log("🔍 FINDING ALL WALLETS WHERE 37Xxihfs IS FIRST FUNDER");
  console.log("=".repeat(60));
  console.log(`Looking for wallets funded by: ${TARGET.slice(0, 16)}...`);
  console.log("");

  // Get all counterparties with outbound volume (wallets 37Xxihfs sent to)
  const counterparties = await client.getCounterparties({
    address: TARGET,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    group_by: "wallet",
    source_input: "Combined",
    pagination: { page: 1, per_page: 100 },
  });

  console.log(`Found ${counterparties.length} total counterparties\n`);

  // Filter to outbound only (wallets 37Xxihfs sent SOL to)
  const outboundPartners = counterparties.filter((cp) => (cp.volume_out_usd || 0) > 0);
  console.log(`${outboundPartners.length} have outbound volume from 37Xxihfs\n`);

  const children: Array<{
    address: string;
    label?: string;
    firstFunder: string | null;
    is37xChild: boolean;
    balance: number;
    volumeOut: number;
  }> = [];

  for (const cp of outboundPartners) {
    const addr = cp.counterparty_address;

    await new Promise((r) => setTimeout(r, 1500));

    // Check First Funder
    let firstFunder: string | null = null;
    try {
      const related = await client.getRelatedWallets({
        address: addr,
        chain: "solana",
        pagination: { page: 1, per_page: 20 },
      });
      const ff = related.find((w) => w.relation === "First Funder");
      firstFunder = ff?.address || null;
    } catch (e) {
      // ignore
    }

    const is37xChild = firstFunder === TARGET;

    await new Promise((r) => setTimeout(r, 1500));

    // Get balance
    let balance = 0;
    try {
      const bal = await client.getCurrentBalance({
        address: addr,
        chain: "solana",
      });
      const sol = bal.find((b) => b.token_symbol === "SOL");
      balance = sol?.token_amount || 0;
    } catch (e) {
      // ignore
    }

    children.push({
      address: addr,
      label: cp.counterparty_address_label?.join(", "),
      firstFunder,
      is37xChild,
      balance,
      volumeOut: cp.volume_out_usd || 0,
    });

    // Print progress
    if (is37xChild) {
      console.log(`🎯 FOUND: ${addr.slice(0, 16)}... - 37Xxihfs IS First Funder!`);
      console.log(`   Balance: ${balance.toFixed(4)} SOL ${balance >= 5 ? "🚨 HIGH!" : ""}`);
      console.log(`   Label: ${cp.counterparty_address_label?.join(", ") || "None"}`);
    }
  }

  // Summary
  console.log("\n\n📊 SUMMARY: WALLETS WHERE 37Xxihfs IS FIRST FUNDER");
  console.log("=".repeat(60));

  const firstFundedBy37x = children.filter((c) => c.is37xChild);

  if (firstFundedBy37x.length === 0) {
    console.log("❌ No wallets found where 37Xxihfs is First Funder");
    console.log("\nThis means 37Xxihfs has NOT funded any fresh wallets directly.");
    console.log("Fresh wallet either:");
    console.log("  1. Not funded yet");
    console.log("  2. Funded via v49j chain (not directly by 37X)");
    console.log("  3. Funded via completely different path");
  } else {
    console.log(`Found ${firstFundedBy37x.length} wallets:\n`);

    // Sort by balance descending
    firstFundedBy37x.sort((a, b) => b.balance - a.balance);

    for (const c of firstFundedBy37x) {
      console.log(`${c.address}`);
      console.log(`  Balance: ${c.balance.toFixed(4)} SOL ${c.balance >= 5 ? "🚨 DEPLOYMENT READY" : ""}`);
      console.log(`  Label: ${c.label || "None"}`);
      console.log("");
    }
  }

  // Also check v49j children (wallets v49j is First Funder for)
  console.log("\n\n📊 CHECKING v49j CHILDREN (for comparison)");
  console.log("=".repeat(60));

  const v49j = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

  const v49jCounterparties = await client.getCounterparties({
    address: v49j,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    group_by: "wallet",
    source_input: "Combined",
    pagination: { page: 1, per_page: 100 },
  });

  const v49jOutbound = v49jCounterparties.filter((cp) => (cp.volume_out_usd || 0) > 0);
  console.log(`v49j has ${v49jOutbound.length} outbound counterparties\n`);

  for (const cp of v49jOutbound) {
    const addr = cp.counterparty_address;

    await new Promise((r) => setTimeout(r, 1500));

    // Check First Funder
    let firstFunder: string | null = null;
    try {
      const related = await client.getRelatedWallets({
        address: addr,
        chain: "solana",
        pagination: { page: 1, per_page: 20 },
      });
      const ff = related.find((w) => w.relation === "First Funder");
      firstFunder = ff?.address || null;
    } catch (e) {
      // ignore
    }

    const isV49jChild = firstFunder === v49j;

    if (isV49jChild) {
      await new Promise((r) => setTimeout(r, 1500));

      let balance = 0;
      try {
        const bal = await client.getCurrentBalance({
          address: addr,
          chain: "solana",
        });
        const sol = bal.find((b) => b.token_symbol === "SOL");
        balance = sol?.token_amount || 0;
      } catch (e) {
        // ignore
      }

      console.log(`🎯 v49j Child: ${addr.slice(0, 16)}...`);
      console.log(`   Balance: ${balance.toFixed(4)} SOL ${balance >= 5 ? "🚨 HIGH!" : ""}`);
      console.log(`   Label: ${cp.counterparty_address_label?.join(", ") || "None"}`);
      console.log("");
    }
  }
}

main().catch(console.error);
