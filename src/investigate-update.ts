/**
 * Investigation Update - Nov 30, 2025
 *
 * Check status of:
 * 1. Bz2yexdH - Fresh deployer (had 11.65 SOL)
 * 2. Bra1HUNK - New wallet to investigate
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const WALLETS_TO_CHECK = [
  {
    name: "Bz2yexdH",
    addr: "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y",
    role: "Fresh Deployer (from report)",
    lastKnownBalance: 11.65,
  },
  {
    name: "Bra1HUNK",
    addr: "Bra1HUNKj1tcM3iKnL3pHc2m1rXkXZ9JELq4ceivag34",
    role: "NEW - Unknown",
    lastKnownBalance: null,
  },
];

async function investigateWallet(wallet: typeof WALLETS_TO_CHECK[0]) {
  console.log("\n" + "=".repeat(70));
  console.log(` INVESTIGATING: ${wallet.name}`);
  console.log(` Address: ${wallet.addr}`);
  console.log(` Role: ${wallet.role}`);
  if (wallet.lastKnownBalance) {
    console.log(` Last Known Balance: ${wallet.lastKnownBalance} SOL`);
  }
  console.log("=".repeat(70));

  // 1. Get current balance
  console.log("\n[1] CURRENT BALANCE:");
  try {
    const balances = await client.getCurrentBalance({
      address: wallet.addr,
      chain: "solana",
    });

    let solBalance = 0;
    for (const bal of balances) {
      if (bal.token_symbol === "SOL") {
        solBalance = bal.token_amount;
        console.log(`    SOL: ${bal.token_amount.toFixed(4)} ($${bal.value_usd?.toFixed(2) || "?"})`);
      }
    }

    if (wallet.lastKnownBalance) {
      const change = solBalance - wallet.lastKnownBalance;
      console.log(`    Change: ${change > 0 ? "+" : ""}${change.toFixed(4)} SOL`);
    }

    // Show other tokens
    const otherTokens = balances.filter(b => b.token_symbol !== "SOL" && b.token_amount > 0);
    if (otherTokens.length > 0) {
      console.log(`    Other tokens: ${otherTokens.length}`);
      for (const t of otherTokens.slice(0, 5)) {
        console.log(`      - ${t.token_symbol || t.token_address?.slice(0, 8)}: ${t.token_amount}`);
      }
    }
  } catch (error) {
    console.log(`    Error: ${error}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 2. Get First Funder
  console.log("\n[2] FIRST FUNDER:");
  try {
    const firstFunder = await client.findFirstFunder(wallet.addr);
    if (firstFunder) {
      console.log(`    First Funder: ${firstFunder}`);

      // Check if it's one of our known wallets
      const knownFunders: Record<string, string> = {
        "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2": "37Xxihfs (Original Deployer)",
        "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5": "v49j (Primary Funder)",
        "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE": "Coinbase Hot Wallet 1",
        "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q": "Coinbase Hot Wallet 2",
        "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF": "ROOT",
      };

      if (knownFunders[firstFunder]) {
        console.log(`    Known as: ${knownFunders[firstFunder]} ✅`);
      } else {
        console.log(`    NOT a known funder - needs investigation`);
      }
    } else {
      console.log(`    No First Funder found`);
    }
  } catch (error) {
    console.log(`    Error: ${error}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 3. Get recent transactions
  console.log("\n[3] RECENT TRANSACTIONS (last 7 days):");
  try {
    const txResult = await client.getTransactions({
      address: wallet.addr,
      chain: "solana",
      date: { from: "2025-11-23", to: "2025-12-31" },
      pagination: { page: 1, per_page: 20 },
    });

    const transactions = txResult.data || [];
    console.log(`    Total: ${transactions.length} transactions`);

    if (transactions.length > 0) {
      // Sort by timestamp descending
      transactions.sort((a, b) =>
        new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
      );

      console.log("\n    Recent activity:");
      for (const tx of transactions.slice(0, 10)) {
        const date = new Date(tx.block_timestamp);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });

        // Determine transaction type
        let txType = tx.method || "unknown";
        let details = "";

        if (tx.tokens_received) {
          for (const recv of tx.tokens_received) {
            if (recv.token_symbol === "SOL" && recv.token_amount > 0.001) {
              details += ` +${recv.token_amount.toFixed(4)} SOL from ${recv.from_address?.slice(0, 8) || "?"}...`;
            }
          }
        }

        if (tx.tokens_sent) {
          for (const sent of tx.tokens_sent) {
            if (sent.token_symbol === "SOL" && sent.token_amount > 0.001) {
              details += ` -${sent.token_amount.toFixed(4)} SOL to ${sent.to_address?.slice(0, 8) || "?"}...`;
            }
          }
        }

        // Check for pump.fun interactions
        const isPumpFun = tx.transaction_hash && (
          tx.method?.toLowerCase().includes("pump") ||
          tx.method?.toLowerCase().includes("create") ||
          tx.method?.toLowerCase().includes("mint")
        );

        console.log(`    ${dateStr} | ${txType}${details}${isPumpFun ? " 🚀" : ""}`);
      }
    }
  } catch (error) {
    console.log(`    Error: ${error}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 4. Check for pump.fun deployment
  console.log("\n[4] PUMP.FUN DEPLOYMENT CHECK:");
  try {
    // Get all related wallets to check for "Deployed via" relationship
    const related = await client.getRelatedWallets({
      address: wallet.addr,
      chain: "solana",
      pagination: { page: 1, per_page: 50 },
    });

    const deployments = related.filter(r => r.relation === "Deployed via");
    if (deployments.length > 0) {
      console.log(`    DEPLOYED ${deployments.length} TOKEN(S):`);
      for (const d of deployments) {
        console.log(`      - ${d.address}`);
        console.log(`        Tx: ${d.transaction_hash}`);
        console.log(`        Time: ${d.block_timestamp}`);
      }
    } else {
      console.log(`    No token deployments found`);
    }

    // Also check for signers (pump.fun creates a signer relationship)
    const signers = related.filter(r => r.relation === "Signer");
    if (signers.length > 0) {
      console.log(`\n    Signers found: ${signers.length}`);
      // Signers can indicate pump.fun bonding curve relationships
    }
  } catch (error) {
    console.log(`    Error: ${error}`);
  }
}

async function run() {
  console.log("\n" + "=".repeat(70));
  console.log(" NANSEN PROFILER - INVESTIGATION UPDATE");
  console.log(" Date: " + new Date().toISOString());
  console.log("=".repeat(70));

  for (const wallet of WALLETS_TO_CHECK) {
    await investigateWallet(wallet);
  }

  console.log("\n" + "=".repeat(70));
  console.log(" INVESTIGATION COMPLETE");
  console.log("=".repeat(70) + "\n");
}

run().catch(console.error);
