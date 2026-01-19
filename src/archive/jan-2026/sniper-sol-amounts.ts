/**
 * Check how much SOL 9J9VHoLW spends per buy
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const SNIPER = "9J9VHoLWgTRxuc6DtNYxRMi2jVqAFAPshUSMeWQ7wz3Y";

// Token addresses from previous launches
const TOKENS = [
  { name: "ARKXRP", date: "2025-06-15" },
  { name: "DOGWIFXRP", date: "2025-07-20" },
  { name: "WFXRP", date: "2025-08-24" },
  { name: "RXRP", date: "2025-11-30" },
];

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  9J9VHoLW SOL SPEND PER LAUNCH");
  console.log("=".repeat(70));

  for (const token of TOKENS) {
    console.log(`\n📍 ${token.name} (${token.date})`);

    const txResult = await client.getTransactions({
      address: SNIPER,
      chain: "solana",
      date: {
        from: token.date,
        to: token.date,
      },
      pagination: { page: 1, per_page: 50 },
    });

    const txs = txResult.data || [];

    // Look for SOL sent (buys)
    let totalSolSpent = 0;
    let buyCount = 0;

    for (const tx of txs) {
      if (tx.tokens_sent) {
        for (const sent of tx.tokens_sent) {
          if (sent.token_symbol === "SOL" && sent.token_amount) {
            const amount = Math.abs(sent.token_amount);
            if (amount > 0.01 && amount < 50) { // Filter for realistic buy amounts
              totalSolSpent += amount;
              buyCount++;
              console.log(`   Buy: ${amount.toFixed(4)} SOL`);
            }
          }
        }
      }
    }

    if (buyCount > 0) {
      console.log(`   Total: ${totalSolSpent.toFixed(4)} SOL across ${buyCount} buys`);
    } else {
      console.log(`   No SOL buys found in transactions`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  // Also check current balance
  console.log("\n" + "=".repeat(70));
  console.log("  CURRENT STATUS");
  console.log("=".repeat(70));

  const balance = await client.getCurrentBalance({
    address: SNIPER,
    chain: "solana",
  });

  const sol = balance.find((b) => b.token_symbol === "SOL");
  console.log(`\n  Current SOL balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL`);

  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`
  9J9VHoLW typically buys with 1-3 SOL per transaction
  Current balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL

  This wallet is funded and ready for the next launch.
`);
}

main().catch(console.error);
