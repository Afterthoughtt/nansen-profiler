/**
 * URGENT: Trace new wallet activity
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const TARGETS = [
  { name: "6M2Pp (HYMt sent 0.6)", address: "6M2Pp3vkmNaoq9idYsU8fcNZKUJnVqHuhtx8D5e6maB" },
  { name: "HVR (sent 2 SOL to FSbvLdrK)", address: "HVRcXaCFyUFG7iZLm3T1Qn8ZGDMHj3P3BpezUfWfRf2x" },
  { name: "FSbvLdrK (received 2 SOL)", address: "FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE" },
  { name: "HYMt", address: "HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG" },
];

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  🚨 URGENT TRACE - COORDINATED MOVEMENT");
  console.log("=".repeat(70));

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const target of TARGETS) {
    console.log(`\n📍 ${target.name}`);
    console.log(`   ${target.address}`);

    // Balance
    const balance = await client.getCurrentBalance({
      address: target.address,
      chain: "solana",
    });

    const sol = balance.find((b) => b.token_symbol === "SOL");
    console.log(`   Balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL`);

    await new Promise((r) => setTimeout(r, 1000));

    // Interaction count
    const counterparties = await client.getCounterparties({
      address: target.address,
      chain: "solana",
      date: {
        from: weekAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      },
      group_by: "wallet",
      source_input: "Combined",
    });

    const interactions = counterparties.reduce((sum, cp) => sum + cp.interaction_count, 0);
    console.log(`   Interactions (7d): ${interactions}`);

    if (interactions < 20) {
      console.log(`   ⚠️ FRESH WALLET`);
    }

    await new Promise((r) => setTimeout(r, 1000));

    // First Funder for new wallets
    if (target.name.includes("6M2Pp") || target.name.includes("HVR")) {
      const related = await client.getRelatedWallets({
        address: target.address,
        chain: "solana",
        pagination: { page: 1, per_page: 10 },
      });

      const ff = related.find((r) => r.relation === "First Funder");
      if (ff) {
        console.log(`   First Funder: ${ff.address.slice(0, 16)}...`);
        if (ff.labels?.length) {
          console.log(`   Labels: ${ff.labels.join(", ")}`);
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  ASSESSMENT");
  console.log("=".repeat(70));
  console.log(`
  WHAT'S HAPPENING:
  - HYMt sent 0.6 SOL to 6M2Pp
  - HVR sent 2 SOL to FSbvLdrK
  - FSbvLdrK now has SOL (was on Tier 3 watchlist)

  POSSIBLE SCENARIOS:
  1. BUNDLE WALLET FUNDING - Multiple wallets getting funded for launch
  2. 6M2Pp could be deployer (if fresh with enough SOL)
  3. FSbvLdrK reactivated as bundle wallet

  WATCH ALL THREE:
  - 6M2Pp3vkmNaoq9idYsU8fcNZKUJnVqHuhtx8D5e6maB
  - HVRcXaCFyUFG7iZLm3T1Qn8ZGDMHj3P3BpezUfWfRf2x
  - FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE
`);
}

main().catch(console.error);
