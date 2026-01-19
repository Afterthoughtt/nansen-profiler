/**
 * Check ALL v49j outbound in last 7 days - what did we miss?
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const V49J = WALLETS.PRIMARY_FUNDER;

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  v49j ALL OUTBOUND (Last 7 days) - What did we miss?");
  console.log("=".repeat(70));

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const txResult = await client.getTransactions({
    address: V49J,
    chain: "solana",
    date: {
      from: weekAgo.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txResult.data || [];
  console.log(`\n  Found ${transactions.length} transactions\n`);

  const recipients: Map<string, { sol: number; usdc: number; count: number; lastDate: string }> = new Map();

  for (const tx of transactions) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        if (sent.to_address && sent.token_amount) {
          const to = sent.to_address;
          if (!recipients.has(to)) {
            recipients.set(to, { sol: 0, usdc: 0, count: 0, lastDate: "" });
          }
          const r = recipients.get(to)!;
          r.count++;
          r.lastDate = tx.block_timestamp || "";

          if (sent.token_symbol === "SOL") {
            r.sol += Math.abs(sent.token_amount);
          } else if (sent.token_symbol === "USDC") {
            r.usdc += Math.abs(sent.token_amount);
          }
        }
      }
    }
  }

  // Sort by SOL amount
  const sorted = [...recipients.entries()]
    .filter(([_, data]) => data.sol > 0.1 || data.usdc > 10)
    .sort((a, b) => b[1].sol - a[1].sol);

  console.log("  SOL RECIPIENTS:");
  console.log("  " + "-".repeat(60));

  for (const [wallet, data] of sorted.filter(([_, d]) => d.sol > 0.1)) {
    console.log(`\n  ${wallet}`);
    console.log(`    SOL sent: ${data.sol.toFixed(4)}`);
    console.log(`    Last: ${data.lastDate}`);
  }

  console.log("\n\n  USDC RECIPIENTS:");
  console.log("  " + "-".repeat(60));

  for (const [wallet, data] of sorted.filter(([_, d]) => d.usdc > 10)) {
    console.log(`\n  ${wallet}`);
    console.log(`    USDC sent: $${data.usdc.toFixed(2)}`);
    console.log(`    Last: ${data.lastDate}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("  KEY QUESTION: Any SOL recipient we haven't investigated?");
  console.log("=".repeat(70));
}

main().catch(console.error);
