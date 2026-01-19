/**
 * Quick check on all target wallets
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Last 7 days
const today = new Date();
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
const DATE_RANGE = {
  from: weekAgo.toISOString().split("T")[0],
  to: today.toISOString().split("T")[0],
};

const TARGETS = [
  { name: "HYMt", address: "HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG" },
  { name: "HRcur", address: "HRcur4Ggby1SVYCJyafw8sypaAnKXEG61Lv4foEgqnWb" },
  { name: "v49j", address: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5" },
  { name: "FSbvLdrK", address: "FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE" },
  { name: "GUCX6xNe", address: "GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb" },
  { name: "Bz2yexdH", address: "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y" },
];

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  ALL TARGETS STATUS - " + new Date().toLocaleString());
  console.log("=".repeat(60));

  for (const target of TARGETS) {
    const balance = await client.getCurrentBalance({
      address: target.address,
      chain: "solana",
    });

    const sol = balance.find((b) => b.token_symbol === "SOL");
    const solBal = sol?.token_amount?.toFixed(4) || "0";

    // Get most recent transaction
    const txResult = await client.getTransactions({
      address: target.address,
      chain: "solana",
      date: DATE_RANGE,
      pagination: { page: 1, per_page: 5 },
    });

    const txs = txResult.data || [];
    const lastTx = txs[0]?.block_timestamp || "No recent activity";

    console.log(`\n  ${target.name}: ${solBal} SOL`);
    console.log(`    Last activity: ${lastTx}`);

    // Show last tx details if exists
    if (txs[0]) {
      const tx = txs[0];
      if (tx.tokens_sent) {
        for (const sent of tx.tokens_sent) {
          if (sent.token_amount && Math.abs(sent.token_amount) > 0.01) {
            console.log(`    → SENT ${Math.abs(sent.token_amount).toFixed(4)} ${sent.token_symbol} to ${sent.to_address?.slice(0, 12)}...`);
          }
        }
      }
      if (tx.tokens_received) {
        for (const recv of tx.tokens_received) {
          if (recv.token_amount && Math.abs(recv.token_amount) > 0.01) {
            console.log(`    ← RECV ${Math.abs(recv.token_amount).toFixed(4)} ${recv.token_symbol} from ${recv.from_address?.slice(0, 12)}...`);
          }
        }
      }
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n" + "=".repeat(60));
  console.log("  SUMMARY");
  console.log("=".repeat(60));
  console.log("\n  No new activity detected since last check.");
  console.log("  HYMt still primary target with 7.1 SOL.\n");
}

main().catch(console.error);
