/**
 * Deep Investigation - Fill all blind spots before Jan 18
 * CRITICAL: Cannot miss this launch
 */
import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Critical wallets
const FSBV = "FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE"; // CONNECTED insider
const WHALE_2NUA = "2NuAgVk3hcb7s4YvP4GjV5fD8eDvZQv5wuN6ZC8igRfV"; // 350 SOL whale
const PROFIT_4YWA = "4yWaU1QrwteHi1gixoFehknRP9a61T5PhAfM6ED3U2bs"; // Profit extraction
const PROFIT_HDTN = "HDTncsSnBmJWNRXd641Xuh8tYjKXx1xcJq8ACuCZQz52"; // Profit extraction
const ROOT = "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF";

// Chain wallets for connection checking
const CHAIN_WALLETS = [
  WALLETS.PRIMARY_FUNDER,      // v49j
  WALLETS.ORIGINAL_DEPLOYER,   // 37Xxihfs
  ROOT,
  "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", // Coinbase Hot Wallet
];

async function investigateFSbvLdrK() {
  console.log("\n" + "=".repeat(70));
  console.log("INVESTIGATION 1: FSbvLdrK (CONNECTED Insider)");
  console.log("=".repeat(70));
  console.log("Why: This insider traces to Coinbase - same origin as deployers");
  console.log("Goal: Understand their full network, find early warning signals\n");

  // 1. Full funding chain
  console.log("--- Funding Chain (5 levels) ---");
  const chain = await client.traceFundingChain(FSBV, 5);

  for (let i = 0; i < chain.length; i++) {
    const indent = "  ".repeat(i);
    const wallet = chain[i];
    const isChain = CHAIN_WALLETS.some(cw => wallet.includes(cw.slice(0, 8)));
    console.log(`${indent}↓ ${wallet}${isChain ? " 🔗" : ""}`);
  }

  await delay(2000);

  // 2. Current balance and status
  console.log("\n--- Current Status ---");
  const balances = await client.getCurrentBalance({ address: FSBV, chain: "solana" });

  let solBalance = 0;
  for (const bal of balances) {
    if (bal.token_symbol === "SOL") {
      solBalance = bal.token_amount;
      console.log(`Balance: ${bal.token_amount.toFixed(4)} SOL ($${bal.value_usd?.toFixed(2)})`);
    }
  }

  await delay(2000);

  // 3. Recent transactions
  console.log("\n--- Recent Transactions (Jan 2026) ---");
  const txResult = await client.getTransactions({
    address: FSBV,
    chain: "solana",
    date: { from: "2026-01-01", to: "2026-01-16" },
    pagination: { page: 1, per_page: 20 },
  });

  const txns = txResult.data || [];
  console.log(`January transactions: ${txns.length}`);

  if (txns.length > 0) {
    for (const tx of txns.slice(0, 5)) {
      console.log(`  ${tx.block_timestamp}: $${tx.volume_usd?.toFixed(2) || "?"}`);
    }
  }

  await delay(2000);

  // 4. Counterparties - who do they interact with?
  console.log("\n--- Counterparties (last 90 days) ---");
  const counterparties = await client.getCounterparties({
    address: FSBV,
    chain: "solana",
    date: { from: "2025-10-01", to: "2026-01-16" },
    group_by: "wallet",
    source_input: "Combined",
  });

  // Check for chain wallet connections
  let foundChainConnection = false;
  for (const cp of counterparties) {
    const isChain = CHAIN_WALLETS.some(cw => cp.counterparty_address.includes(cw.slice(0, 8)));
    if (isChain) {
      foundChainConnection = true;
      console.log(`  🔗 CHAIN CONNECTION: ${cp.counterparty_address.slice(0, 12)}...`);
      console.log(`     IN: $${cp.volume_in_usd?.toFixed(2)}, OUT: $${cp.volume_out_usd?.toFixed(2)}`);
    }
  }

  if (!foundChainConnection) {
    console.log("  No direct counterparty connection to chain wallets");
    console.log("  (Connection is via funding chain, not direct interaction)");
  }

  // Top counterparties
  console.log("\n  Top 5 counterparties:");
  const sorted = counterparties.sort((a, b) =>
    ((b.volume_in_usd || 0) + (b.volume_out_usd || 0)) -
    ((a.volume_in_usd || 0) + (a.volume_out_usd || 0))
  );

  for (const cp of sorted.slice(0, 5)) {
    const labels = cp.counterparty_address_label?.join(", ") || "No label";
    console.log(`    ${cp.counterparty_address.slice(0, 12)}... - ${labels}`);
    console.log(`      Volume: $${((cp.volume_in_usd || 0) + (cp.volume_out_usd || 0)).toFixed(2)}`);
  }

  console.log("\n📊 VERDICT: FSbvLdrK");
  console.log(`   Balance: ${solBalance.toFixed(4)} SOL`);
  console.log(`   Jan Activity: ${txns.length} transactions`);
  console.log(`   Signal: ${solBalance > 3 ? "⚠️ FUNDED - may buy soon" : "Low balance - not yet preparing"}`);

  return { balance: solBalance, janTxns: txns.length };
}

async function investigateWhale2NuA() {
  console.log("\n" + "=".repeat(70));
  console.log("INVESTIGATION 2: 2NuAgVk3 (350 SOL Whale)");
  console.log("=".repeat(70));
  console.log("Why: Whale with 350 SOL who bought TrollXRP + RXRP early");
  console.log("Goal: Understand their January activity - are they preparing?\n");

  // 1. Current balance
  console.log("--- Current Balance ---");
  const balances = await client.getCurrentBalance({ address: WHALE_2NUA, chain: "solana" });

  let solBalance = 0;
  for (const bal of balances) {
    if (bal.token_symbol === "SOL") {
      solBalance = bal.token_amount;
      console.log(`SOL: ${bal.token_amount.toFixed(4)} ($${bal.value_usd?.toFixed(2)})`);
    }
  }

  await delay(2000);

  // 2. January transactions
  console.log("\n--- January 2026 Transactions ---");
  const txResult = await client.getTransactions({
    address: WHALE_2NUA,
    chain: "solana",
    date: { from: "2026-01-01", to: "2026-01-16" },
    pagination: { page: 1, per_page: 30 },
  });

  const txns = txResult.data || [];
  console.log(`Total January transactions: ${txns.length}`);

  // Analyze what they're doing
  let totalIn = 0;
  let totalOut = 0;

  for (const tx of txns) {
    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        if (recv.token_symbol === "SOL") {
          totalIn += recv.token_amount;
        }
      }
    }
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        if (sent.token_symbol === "SOL") {
          totalOut += sent.token_amount;
        }
      }
    }
  }

  console.log(`\n  SOL flow in January:`);
  console.log(`    IN:  ${totalIn.toFixed(4)} SOL`);
  console.log(`    OUT: ${totalOut.toFixed(4)} SOL`);
  console.log(`    Net: ${(totalIn - totalOut).toFixed(4)} SOL`);

  // Recent activity
  if (txns.length > 0) {
    console.log(`\n  Recent activity:`);
    for (const tx of txns.slice(0, 5)) {
      console.log(`    ${tx.block_timestamp}`);
    }
  }

  console.log("\n📊 VERDICT: 2NuAgVk3 Whale");
  console.log(`   Balance: ${solBalance.toFixed(2)} SOL`);
  console.log(`   Jan Transactions: ${txns.length}`);
  console.log(`   Status: ${txns.length > 10 ? "⚠️ ACTIVE - may have intel" : "Normal activity"}`);

  return { balance: solBalance, janTxns: txns.length };
}

async function checkProfitExtractionWallets() {
  console.log("\n" + "=".repeat(70));
  console.log("INVESTIGATION 3: Profit Extraction Wallets");
  console.log("=".repeat(70));
  console.log("Why: 4yWaU1Qr and HDTncsSn received $68K from Bz2yexdH");
  console.log("Goal: Any recent activity = entity is active\n");

  const wallets = [
    { name: "4yWaU1Qr", addr: PROFIT_4YWA },
    { name: "HDTncsSn", addr: PROFIT_HDTN },
  ];

  for (const w of wallets) {
    console.log(`\n--- ${w.name} ---`);

    // Balance
    const balances = await client.getCurrentBalance({ address: w.addr, chain: "solana" });

    for (const bal of balances) {
      if (bal.token_symbol === "SOL") {
        console.log(`Balance: ${bal.token_amount.toFixed(4)} SOL`);
      }
    }

    await delay(2000);

    // Recent transactions
    const txResult = await client.getTransactions({
      address: w.addr,
      chain: "solana",
      date: { from: "2025-12-01", to: "2026-01-16" },
      pagination: { page: 1, per_page: 10 },
    });

    const txns = txResult.data || [];
    console.log(`Transactions since Dec 1: ${txns.length}`);

    if (txns.length > 0) {
      console.log(`Last activity: ${txns[0].block_timestamp}`);
    }

    await delay(2000);
  }
}

async function checkROOT() {
  console.log("\n" + "=".repeat(70));
  console.log("INVESTIGATION 4: ROOT Wallet");
  console.log("=".repeat(70));
  console.log("Why: ROOT funded v49j originally. If it reactivates = new pattern");
  console.log("Goal: Confirm still dormant\n");

  // Balance
  const balances = await client.getCurrentBalance({ address: ROOT, chain: "solana" });

  console.log("--- Current Balance ---");
  for (const bal of balances) {
    if (bal.token_symbol === "SOL") {
      console.log(`SOL: ${bal.token_amount.toFixed(4)} ($${bal.value_usd?.toFixed(2)})`);
    }
  }

  await delay(2000);

  // Any transactions in 2025-2026?
  console.log("\n--- Activity Check (last 6 months) ---");
  const txResult = await client.getTransactions({
    address: ROOT,
    chain: "solana",
    date: { from: "2025-07-01", to: "2026-01-16" },
    pagination: { page: 1, per_page: 10 },
  });

  const txns = txResult.data || [];
  console.log(`Transactions since July 2025: ${txns.length}`);

  if (txns.length > 0) {
    console.log(`\n⚠️ ROOT HAS ACTIVITY!`);
    for (const tx of txns) {
      console.log(`  ${tx.block_timestamp}`);
    }
  } else {
    console.log(`\n✅ ROOT is DORMANT - no activity since June 2025`);
  }
}

async function verifySleeperInventory() {
  console.log("\n" + "=".repeat(70));
  console.log("INVESTIGATION 5: Verify Sleeper Inventory");
  console.log("=".repeat(70));
  console.log("Why: Make sure we haven't missed any chain-funded wallets");
  console.log("Goal: Find ALL wallets where v49j or 37Xxihfs is First Funder\n");

  // Get v49j's First Funder relationships
  console.log("--- Wallets funded by v49j (via related-wallets) ---");
  const v49jRelated = await client.getRelatedWallets({
    address: WALLETS.PRIMARY_FUNDER,
    chain: "solana",
    pagination: { page: 1, per_page: 50 },
  });

  const v49jFunded = v49jRelated.filter(rw => rw.relation === "First Funder of");
  console.log(`v49j is First Funder of: ${v49jFunded.length} wallets`);

  for (const rw of v49jFunded) {
    console.log(`  ${rw.address.slice(0, 12)}... (${rw.relation})`);
  }

  await delay(2000);

  // Get 37Xxihfs's First Funder relationships
  console.log("\n--- Wallets funded by 37Xxihfs (via related-wallets) ---");
  const orig37Related = await client.getRelatedWallets({
    address: WALLETS.ORIGINAL_DEPLOYER,
    chain: "solana",
    pagination: { page: 1, per_page: 50 },
  });

  const orig37Funded = orig37Related.filter(rw => rw.relation === "First Funder of");
  console.log(`37Xxihfs is First Funder of: ${orig37Funded.length} wallets`);

  for (const rw of orig37Funded) {
    console.log(`  ${rw.address.slice(0, 12)}... (${rw.relation})`);
  }

  // Check for unknown wallets
  const knownDeployers = [
    WALLETS.DEPLOYER_D7MS,
    WALLETS.DEPLOYER_DBMX,
    WALLETS.DEPLOYER_BZ2Y,
    WALLETS.DEPLOYER_GUCX,
  ];

  console.log("\n--- Unknown First Funder Recipients ---");
  const allFunded = [...v49jFunded, ...orig37Funded];
  const unknown = allFunded.filter(rw => !knownDeployers.includes(rw.address));

  if (unknown.length > 0) {
    console.log("⚠️ Found wallets not in our known deployer list:");
    for (const rw of unknown) {
      console.log(`  ${rw.address}`);

      // Check their balance
      await delay(1500);
      const bal = await client.getCurrentBalance({ address: rw.address, chain: "solana" });
      const sol = bal.find(b => b.token_symbol === "SOL");
      if (sol) {
        console.log(`    Balance: ${sol.token_amount.toFixed(4)} SOL`);
        if (sol.token_amount > 1) {
          console.log(`    ⚠️ HIGH BALANCE - potential deployer!`);
        }
      }
    }
  } else {
    console.log("✅ All First Funder recipients are known deployers");
  }
}

async function main() {
  console.log("🔴 CRITICAL DEEP INVESTIGATION - JAN 18 LAUNCH");
  console.log("=".repeat(70));
  console.log("Date:", new Date().toISOString());
  console.log("Goal: Fill all blind spots, leave nothing to chance\n");

  await investigateFSbvLdrK();
  await delay(2000);

  await investigateWhale2NuA();
  await delay(2000);

  await checkProfitExtractionWallets();
  await delay(2000);

  await checkROOT();
  await delay(2000);

  await verifySleeperInventory();

  console.log("\n" + "=".repeat(70));
  console.log("DEEP INVESTIGATION COMPLETE");
  console.log("=".repeat(70));
}

main().catch(console.error);
