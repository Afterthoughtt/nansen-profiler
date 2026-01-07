/**
 * Quick Status Check - Wallet Balance Comparison
 *
 * Checks balances of all key wallets to identify which ones
 * have sufficient funds for deployment.
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Key wallets to monitor
const WALLETS = [
  {
    name: "37Xxihfs",
    addr: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
    role: "Original Deployer",
    priority: true
  },
  {
    name: "v49j",
    addr: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
    role: "Primary Funder",
    priority: true
  },
  {
    name: "GUCX6xNe",
    addr: "GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb",
    role: "Pre-funded Deployer",
    priority: false
  },
  {
    name: "DBmx",
    addr: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
    role: "Known Deployer",
    priority: false
  },
  {
    name: "D7Ms",
    addr: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    role: "Known Deployer",
    priority: false
  },
  {
    name: "Bz2yexdH",
    addr: "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y",
    role: "Nov30 Deployer (RXRP)",
    priority: true
  },
];

// Deployment threshold (0.05 SOL minimum for pump.fun)
const DEPLOY_THRESHOLD = 0.05;

interface WalletStatus {
  name: string;
  address: string;
  role: string;
  balance: number;
  balanceUsd: number;
  lastActivity: string | null;
  risk: "HIGH" | "MEDIUM" | "LOW" | "FUNDER";
  canDeploy: boolean;
}

async function getWalletStatus(wallet: typeof WALLETS[0]): Promise<WalletStatus> {
  const status: WalletStatus = {
    name: wallet.name,
    address: wallet.addr,
    role: wallet.role,
    balance: 0,
    balanceUsd: 0,
    lastActivity: null,
    risk: "LOW",
    canDeploy: false,
  };

  try {
    // Get current balance
    const balances = await client.getCurrentBalance({
      address: wallet.addr,
      chain: "solana",
    });

    for (const bal of balances) {
      if (bal.token_symbol === "SOL") {
        status.balance = bal.token_amount;
        status.balanceUsd = bal.value_usd || 0;
      }
    }
  } catch (error) {
    console.error(`  Error getting balance for ${wallet.name}:`, error);
  }

  // Determine risk level
  if (wallet.role === "Primary Funder") {
    status.risk = "FUNDER";
  } else if (status.balance >= DEPLOY_THRESHOLD) {
    status.risk = "HIGH";
    status.canDeploy = true;
  } else if (status.balance >= 0.01) {
    status.risk = "MEDIUM";
  } else {
    status.risk = "LOW";
  }

  return status;
}

async function getRecentTransactions(address: string): Promise<{
  lastActivity: string | null;
  recentFunding: { date: string; amount: number; from: string } | null;
}> {
  try {
    const txResult = await client.getTransactions({
      address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: { page: 1, per_page: 20 },
    });

    const transactions = txResult.data || [];

    let lastActivity: string | null = null;
    let recentFunding: { date: string; amount: number; from: string } | null = null;

    if (transactions.length > 0) {
      // Sort by timestamp descending
      transactions.sort((a, b) =>
        new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
      );

      lastActivity = transactions[0].block_timestamp;

      // Find SOL received
      for (const tx of transactions) {
        if (tx.tokens_received) {
          for (const recv of tx.tokens_received) {
            if (recv.token_symbol === "SOL" && recv.token_amount > 0.01) {
              if (!recentFunding || new Date(tx.block_timestamp) > new Date(recentFunding.date)) {
                recentFunding = {
                  date: tx.block_timestamp,
                  amount: recv.token_amount,
                  from: recv.from_address || "Unknown",
                };
              }
            }
          }
        }
      }
    }

    return { lastActivity, recentFunding };
  } catch (error) {
    console.error(`  Error getting transactions:`, error);
    return { lastActivity: null, recentFunding: null };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getRiskEmoji(risk: string): string {
  switch (risk) {
    case "HIGH": return "\x1b[31mHIGH\x1b[0m";
    case "MEDIUM": return "\x1b[33mMED\x1b[0m";
    case "LOW": return "\x1b[32mLOW\x1b[0m";
    case "FUNDER": return "\x1b[34m---\x1b[0m";
    default: return risk;
  }
}

async function run() {
  console.log("\n" + "=".repeat(70));
  console.log(" WALLET STATUS CHECK - " + new Date().toISOString());
  console.log("=".repeat(70));

  const statuses: WalletStatus[] = [];

  // Check all wallets
  console.log("\nChecking wallet balances...\n");

  for (const wallet of WALLETS) {
    process.stdout.write(`  ${wallet.name}... `);
    const status = await getWalletStatus(wallet);
    statuses.push(status);
    console.log(`${status.balance.toFixed(4)} SOL`);

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  // Get recent transactions for 37Xxihfs
  console.log("\nChecking 37Xxihfs recent activity...");
  const { lastActivity, recentFunding } = await getRecentTransactions(WALLETS[0].addr);

  if (statuses[0]) {
    statuses[0].lastActivity = lastActivity;
  }

  // Output table
  console.log("\n" + "=".repeat(70));
  console.log(" RESULTS");
  console.log("=".repeat(70));
  console.log("\n┌────────────┬─────────────────────┬─────────────┬──────────────┬──────┐");
  console.log("│ Wallet     │ Role                │ Balance     │ Last Active  │ Risk │");
  console.log("├────────────┼─────────────────────┼─────────────┼──────────────┼──────┤");

  for (const s of statuses) {
    const name = s.name.padEnd(10);
    const role = s.role.slice(0, 19).padEnd(19);
    const balance = `${s.balance.toFixed(4)} SOL`.padEnd(11);
    const lastAct = formatDate(s.lastActivity).slice(0, 12).padEnd(12);
    const risk = getRiskEmoji(s.risk);

    console.log(`│ ${name} │ ${role} │ ${balance} │ ${lastAct} │ ${risk} │`);
  }

  console.log("└────────────┴─────────────────────┴─────────────┴──────────────┴──────┘");

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log(" ANALYSIS");
  console.log("=".repeat(70));

  const deployableWallets = statuses.filter(s => s.canDeploy && s.role !== "Primary Funder");

  if (deployableWallets.length === 0) {
    console.log("\n  No wallets have sufficient funds for deployment.");
  } else if (deployableWallets.length === 1) {
    const w = deployableWallets[0];
    console.log(`\n  ONLY ${w.name} has sufficient funds (${w.balance.toFixed(4)} SOL)`);
    console.log(`  Role: ${w.role}`);
    console.log(`  Address: ${w.address}`);
  } else {
    console.log(`\n  ${deployableWallets.length} wallets have sufficient funds:`);
    for (const w of deployableWallets) {
      console.log(`    - ${w.name}: ${w.balance.toFixed(4)} SOL`);
    }
  }

  if (recentFunding) {
    console.log("\n  37Xxihfs RECENT FUNDING:");
    console.log(`    Date: ${formatDate(recentFunding.date)}`);
    console.log(`    Amount: ${recentFunding.amount.toFixed(4)} SOL`);
    console.log(`    From: ${recentFunding.from.slice(0, 20)}...`);
  }

  // Recommendation
  console.log("\n" + "=".repeat(70));
  console.log(" RECOMMENDATION");
  console.log("=".repeat(70));

  if (deployableWallets.some(w => w.name === "37Xxihfs")) {
    console.log(`
  37Xxihfs is FUNDED and ACTIVE.

  This wallet:
  - Has ${statuses[0]?.balance.toFixed(4) || "?"} SOL (sufficient for deployment)
  - Is the ORIGINAL deployer (used Coinbase funding directly)
  - Last active: ${formatDate(lastActivity)}

  MONITOR: 37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2

  Watch for pump.fun deployment activity.
`);
  } else {
    const v49j = statuses.find(s => s.name === "v49j");
    console.log(`
  37Xxihfs does NOT have sufficient funds.

  Primary funder (v49j) balance: ${v49j?.balance.toFixed(4) || "?"} SOL

  Continue monitoring v49j for outbound SOL transfers.
`);
  }

  console.log("=".repeat(70) + "\n");
}

run().catch(console.error);
