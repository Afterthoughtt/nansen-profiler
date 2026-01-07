import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const WALLET = "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT";

async function run() {
  console.log("=".repeat(60));
  console.log("TRACING INSIDER FUNDING SOURCE");
  console.log("=".repeat(60));

  // Get detailed transactions
  const txResult = await client.getTransactions({
    address: WALLET,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    pagination: { page: 1, per_page: 10 }
  });

  const txs = txResult.data || [];
  console.log("\nRecent transactions:");

  for (const tx of txs) {
    console.log("\n---");
    console.log("Time:", tx.block_timestamp);
    console.log("Method:", tx.method);
    console.log("Hash:", tx.transaction_hash);

    if (tx.tokens_received) {
      for (const r of tx.tokens_received) {
        if (r.token_symbol === "SOL" && r.token_amount > 0.01) {
          console.log("RECEIVED:", r.token_amount, "SOL");
          console.log("FROM:", r.from_address);

          // Check if from_address is known
          const knownWallets: Record<string, string> = {
            "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2": "37Xxihfs (Original Deployer)",
            "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5": "v49j (Primary Funder)",
            "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y": "Bz2yexdH (Fresh Deployer)",
            "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE": "Coinbase Hot Wallet 1",
            "HVRcXaCFyUFG7iZLm3T1Qn8ZGDMHj3P3BpezUfWfRf2x": "HVRcXaCF (Intermediary)",
          };

          if (r.from_address && knownWallets[r.from_address]) {
            console.log("*** KNOWN WALLET:", knownWallets[r.from_address], "***");
          }
        }
      }
    }
  }

  // Check first funder of the funding source
  console.log("\n" + "=".repeat(60));
  console.log("CHECKING FUNDING SOURCES");
  console.log("=".repeat(60));

  // Get counterparties to find who sent SOL
  await new Promise(r => setTimeout(r, 2000));

  const counterparties = await client.getCounterparties({
    address: WALLET,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    source_input: "Combined",
    group_by: "wallet",
  });

  console.log("\nCounterparties today:");
  for (const cp of counterparties.slice(0, 10)) {
    console.log("-", cp.counterparty_address);
    console.log("  Interactions:", cp.interaction_count);
    if (cp.total_volume_usd) console.log("  Volume:", "$" + cp.total_volume_usd.toFixed(2));
  }

  console.log("\n" + "=".repeat(60));
}

run().catch(console.error);
