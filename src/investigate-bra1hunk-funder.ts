/**
 * Investigate Bra1HUNK's First Funder
 * Check if there's any connection to our chain
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const BRA1HUNK_FIRST_FUNDER = "5g7yNHyGLJ7fiQ9SN9mf47opDnMjc585kqXWt6d7aBWs";

async function run() {
  console.log("\n" + "=".repeat(70));
  console.log(" INVESTIGATING BRA1HUNK's FIRST FUNDER");
  console.log(" Address: " + BRA1HUNK_FIRST_FUNDER);
  console.log("=".repeat(70));

  // 1. Get current balance
  console.log("\n[1] CURRENT BALANCE:");
  try {
    const balances = await client.getCurrentBalance({
      address: BRA1HUNK_FIRST_FUNDER,
      chain: "solana",
    });

    for (const bal of balances) {
      if (bal.token_symbol === "SOL") {
        console.log(`    SOL: ${bal.token_amount.toFixed(4)} ($${bal.value_usd?.toFixed(2) || "?"})`);
      }
    }
  } catch (error) {
    console.log(`    Error: ${error}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 2. Trace funding chain (3 levels)
  console.log("\n[2] FUNDING CHAIN (3 levels):");
  try {
    const chain = await client.traceFundingChain(BRA1HUNK_FIRST_FUNDER, 3);
    console.log("    Chain:");
    for (let i = 0; i < chain.length; i++) {
      const indent = "    " + "  ".repeat(i);
      const label = i === 0 ? " (ROOT)" : i === chain.length - 1 ? " (CURRENT)" : "";
      console.log(`${indent}→ ${chain[i]}${label}`);
    }

    // Check if any wallet in chain is known
    const knownWallets: Record<string, string> = {
      "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2": "37Xxihfs (Original Deployer)",
      "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5": "v49j (Primary Funder)",
      "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE": "Coinbase Hot Wallet 1",
      "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q": "Coinbase Hot Wallet 2",
      "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF": "ROOT",
    };

    console.log("\n    Known wallets in chain:");
    let foundKnown = false;
    for (const addr of chain) {
      if (knownWallets[addr]) {
        console.log(`      ✅ ${addr.slice(0, 8)}... = ${knownWallets[addr]}`);
        foundKnown = true;
      }
    }
    if (!foundKnown) {
      console.log("      ❌ No known wallets found - DIFFERENT chain");
    }
  } catch (error) {
    console.log(`    Error: ${error}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 3. Get recent transactions
  console.log("\n[3] RECENT TRANSACTIONS:");
  try {
    const txResult = await client.getTransactions({
      address: BRA1HUNK_FIRST_FUNDER,
      chain: "solana",
      date: { from: "2025-11-01", to: "2025-12-31" },
      pagination: { page: 1, per_page: 20 },
    });

    const transactions = txResult.data || [];
    console.log(`    Total: ${transactions.length} transactions in November`);

    if (transactions.length > 0) {
      transactions.sort((a, b) =>
        new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
      );

      console.log("\n    Recent activity:");
      for (const tx of transactions.slice(0, 10)) {
        const date = new Date(tx.block_timestamp);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });

        let details = "";
        if (tx.tokens_received) {
          for (const recv of tx.tokens_received) {
            if (recv.token_symbol === "SOL" && recv.token_amount > 0.01) {
              details += ` +${recv.token_amount.toFixed(2)} SOL`;
            }
          }
        }
        if (tx.tokens_sent) {
          for (const sent of tx.tokens_sent) {
            if (sent.token_symbol === "SOL" && sent.token_amount > 0.01) {
              details += ` -${sent.token_amount.toFixed(2)} SOL to ${sent.to_address?.slice(0, 8) || "?"}...`;
            }
          }
        }

        console.log(`    ${dateStr} | ${tx.method || "?"}${details}`);
      }
    }
  } catch (error) {
    console.log(`    Error: ${error}`);
  }

  console.log("\n" + "=".repeat(70));

  // Now check 37Xxihfs outbound transactions
  console.log("\n" + "=".repeat(70));
  console.log(" CHECKING 37Xxihfs OUTBOUND TRANSACTIONS");
  console.log("=".repeat(70));

  try {
    const txResult = await client.getTransactions({
      address: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
      chain: "solana",
      date: { from: "2025-11-29", to: "2025-12-31" },
      pagination: { page: 1, per_page: 30 },
    });

    const transactions = txResult.data || [];
    console.log(`\n    Total: ${transactions.length} transactions since Nov 29`);

    if (transactions.length > 0) {
      transactions.sort((a, b) =>
        new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
      );

      console.log("\n    SOL movements:");
      for (const tx of transactions) {
        const date = new Date(tx.block_timestamp);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });

        if (tx.tokens_sent) {
          for (const sent of tx.tokens_sent) {
            if (sent.token_symbol === "SOL" && sent.token_amount > 0.01) {
              console.log(`    ${dateStr} | SENT ${sent.token_amount.toFixed(4)} SOL → ${sent.to_address || "?"}`);
            }
          }
        }
        if (tx.tokens_received) {
          for (const recv of tx.tokens_received) {
            if (recv.token_symbol === "SOL" && recv.token_amount > 0.01) {
              console.log(`    ${dateStr} | RECV ${recv.token_amount.toFixed(4)} SOL ← ${recv.from_address || "?"}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`    Error: ${error}`);
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

run().catch(console.error);
