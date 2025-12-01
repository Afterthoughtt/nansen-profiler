import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not set");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);

  const TARGETS = [
    { label: "37Xxihfs", address: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2" },
    { label: "v49j", address: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5" },
  ];

  console.log("🔍 DIRECT CHILDREN CHECK - Using Related Wallets API");
  console.log("=".repeat(60));
  console.log("Looking for wallets where our targets are First Funder\n");

  for (const target of TARGETS) {
    console.log(`\n📊 ${target.label}`);
    console.log("-".repeat(60));

    // The related-wallets API shows relationships FROM the queried wallet
    // So we need to check wallets that interacted with our target

    // Get counterparties with outbound (wallets we sent SOL to)
    const counterparties = await client.getCounterparties({
      address: target.address,
      chain: "solana",
      date: { from: "2025-01-01", to: "2025-12-01" },
      group_by: "wallet",
      source_input: "Combined",
      pagination: { page: 1, per_page: 100 },
      filters: {
        volume_out_usd: { min: 1 }, // Only wallets we sent $ to
      },
    });

    // Filter to exclude known things
    const potentialChildren = counterparties.filter((cp) => {
      const label = cp.counterparty_address_label?.join(" ").toLowerCase() || "";
      // Exclude bonding curves, exchanges, pools
      if (label.includes("bonding curve")) return false;
      if (label.includes("liquidity pool")) return false;
      if (label.includes("okx")) return false;
      if (label.includes("bitget")) return false;
      if (label.includes("coinbase")) return false;
      if (label.includes("meteora")) return false;
      if (label.includes("orca")) return false;
      if (label.includes("raydium")) return false;
      return true;
    });

    console.log(`Found ${potentialChildren.length} potential children (excluding bonding curves/exchanges)\n`);

    // Check First Funder for each
    const confirmedChildren: Array<{
      address: string;
      label?: string;
      balance: number;
      volumeOut: number;
    }> = [];

    for (const cp of potentialChildren.slice(0, 30)) {
      // Limit to 30 for speed
      await new Promise((r) => setTimeout(r, 1000));

      try {
        const related = await client.getRelatedWallets({
          address: cp.counterparty_address,
          chain: "solana",
          pagination: { page: 1, per_page: 20 },
        });

        const ff = related.find((w) => w.relation === "First Funder");
        if (ff?.address === target.address) {
          // This is a child!
          await new Promise((r) => setTimeout(r, 1000));

          let balance = 0;
          try {
            const bal = await client.getCurrentBalance({
              address: cp.counterparty_address,
              chain: "solana",
            });
            const sol = bal.find((b) => b.token_symbol === "SOL");
            balance = sol?.token_amount || 0;
          } catch (e) {
            // ignore
          }

          confirmedChildren.push({
            address: cp.counterparty_address,
            label: cp.counterparty_address_label?.join(", "),
            balance,
            volumeOut: cp.volume_out_usd || 0,
          });

          const isHighBalance = balance >= 5;
          console.log(`  🎯 CHILD: ${cp.counterparty_address.slice(0, 20)}...`);
          console.log(`     Balance: ${balance.toFixed(4)} SOL ${isHighBalance ? "🚨 HIGH!" : ""}`);
          console.log(`     Label: ${cp.counterparty_address_label?.join(", ") || "None"}`);
          console.log("");
        }
      } catch (e) {
        // ignore
      }
    }

    if (confirmedChildren.length === 0) {
      console.log(`  ❌ No children found (excluding bonding curves/exchanges)`);
    } else {
      console.log(`\n  Total children found: ${confirmedChildren.length}`);

      // Highlight any with high balance
      const highBalance = confirmedChildren.filter((c) => c.balance >= 5);
      if (highBalance.length > 0) {
        console.log(`\n  🚨 HIGH BALANCE CHILDREN (potential deployers):`);
        for (const c of highBalance) {
          console.log(`     ${c.address}`);
          console.log(`     Balance: ${c.balance.toFixed(4)} SOL`);
        }
      }
    }
  }

  // Final summary
  console.log("\n\n📋 INVESTIGATION COMPLETE");
  console.log("=".repeat(60));
  console.log("If no fresh deployer found:");
  console.log("  1. Fresh wallet not funded yet - keep monitoring");
  console.log("  2. Different funding path entirely");
  console.log("  3. 37Xxihfs IS the deployer (they may have lied)");
}

main().catch(console.error);
