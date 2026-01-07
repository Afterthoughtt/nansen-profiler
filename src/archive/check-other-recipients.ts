import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not set");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);

  console.log("🔍 CHECKING FOR OTHER RECIPIENTS TODAY");
  console.log("=".repeat(60));

  // Check both 37Xxihfs and v49j for ALL SOL outbound today
  const wallets = [
    { label: "37Xxihfs", address: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2" },
    { label: "v49j", address: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5" },
  ];

  const allRecipients = new Map<string, { amount: number; from: string; timestamp: string }>();

  for (const wallet of wallets) {
    console.log(`\n${wallet.label}:`);

    const txResp = await client.getTransactions({
      address: wallet.address,
      chain: "solana",
      date: { from: "2025-11-30", to: "2025-12-01" },
      pagination: { page: 1, per_page: 100 },
    });

    console.log(`  Transactions today: ${txResp.data?.length || 0}`);

    for (const tx of txResp.data || []) {
      if (tx.tokens_sent) {
        for (const s of tx.tokens_sent) {
          if (s.token_symbol === "SOL" && s.token_amount && s.token_amount > 0.01 && s.to_address) {
            const existing = allRecipients.get(s.to_address);
            if (existing) {
              existing.amount += s.token_amount;
            } else {
              allRecipients.set(s.to_address, {
                amount: s.token_amount,
                from: wallet.label,
                timestamp: tx.block_timestamp,
              });
            }
            console.log(`  ${tx.block_timestamp}: ${s.token_amount.toFixed(4)} SOL → ${s.to_address.slice(0, 16)}...`);
          }
        }
      }
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n\n📊 ALL SOL RECIPIENTS TODAY");
  console.log("=".repeat(60));

  if (allRecipients.size === 0) {
    console.log("❌ No SOL recipients found today");
  } else {
    // Sort by amount
    const sorted = [...allRecipients.entries()].sort((a, b) => b[1].amount - a[1].amount);

    for (const [addr, info] of sorted) {
      console.log(`\n${addr}`);
      console.log(`  Amount: ${info.amount.toFixed(4)} SOL`);
      console.log(`  From: ${info.from}`);
      console.log(`  Time: ${info.timestamp}`);

      // Quick check First Funder
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const related = await client.getRelatedWallets({
          address: addr,
          chain: "solana",
          pagination: { page: 1, per_page: 10 },
        });
        const ff = related.find((r) => r.relation === "First Funder");
        const is37x = ff?.address === "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";
        const isV49j = ff?.address === "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
        console.log(`  First Funder: ${ff?.address?.slice(0, 16) || "Unknown"}... ${is37x || isV49j ? "✅ CONNECTED" : ""}`);
      } catch (e) {
        console.log("  First Funder: Error");
      }
    }
  }

  console.log("\n\n📋 CONCLUSION");
  console.log("=".repeat(60));
  console.log("The only significant SOL recipient from 37X/v49j today should be Bz2yexdH");
}

main().catch(console.error);
