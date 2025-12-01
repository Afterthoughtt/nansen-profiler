/**
 * Check Insider Wallets for Recent Activity
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const INSIDER_WALLETS = [
  {
    name: "H3qSndFC",
    addr: "H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot",
    note: "Cross-token buyer (XRPEP3 + TrollXRP), First Funder: CHOCO deployer",
    lastKnownBalance: 2.43,
  },
  {
    name: "Hqf4TZxp",
    addr: "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT",
    note: "Cross-token buyer, avg position #11.5",
    lastKnownBalance: 0.002,
  },
];

async function run() {
  console.log("\n" + "=".repeat(70));
  console.log(" INSIDER WALLET CHECK - " + new Date().toISOString());
  console.log("=".repeat(70));

  for (const wallet of INSIDER_WALLETS) {
    console.log(`\n--- ${wallet.name} ---`);
    console.log(`Address: ${wallet.addr}`);
    console.log(`Note: ${wallet.note}`);

    // Get balance
    try {
      const balances = await client.getCurrentBalance({
        address: wallet.addr,
        chain: "solana",
      });

      for (const bal of balances) {
        if (bal.token_symbol === "SOL") {
          const change = bal.token_amount - wallet.lastKnownBalance;
          console.log(`Balance: ${bal.token_amount.toFixed(4)} SOL (was ${wallet.lastKnownBalance}, change: ${change > 0 ? "+" : ""}${change.toFixed(4)})`);
        }
      }
    } catch (error) {
      console.log(`Error getting balance: ${error}`);
    }

    await new Promise(r => setTimeout(r, 2000));

    // Get recent transactions
    try {
      const txResult = await client.getTransactions({
        address: wallet.addr,
        chain: "solana",
        date: { from: "2025-11-28", to: "2025-12-31" },
        pagination: { page: 1, per_page: 10 },
      });

      const transactions = txResult.data || [];
      console.log(`Recent transactions: ${transactions.length}`);

      if (transactions.length > 0) {
        transactions.sort((a, b) =>
          new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
        );

        for (const tx of transactions.slice(0, 5)) {
          const date = new Date(tx.block_timestamp);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          });

          let details = tx.method || "";

          // Check for pump.fun buys
          if (tx.tokens_received) {
            for (const recv of tx.tokens_received) {
              if (recv.token_symbol && recv.token_symbol !== "SOL") {
                details += ` BUY ${recv.token_symbol}`;
              }
            }
          }
          if (tx.tokens_sent) {
            for (const sent of tx.tokens_sent) {
              if (sent.token_symbol === "SOL" && sent.token_amount > 0.01) {
                details += ` -${sent.token_amount.toFixed(2)} SOL`;
              }
            }
          }

          console.log(`  ${dateStr}: ${details}`);
        }
      }
    } catch (error) {
      console.log(`Error getting transactions: ${error}`);
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

run().catch(console.error);
