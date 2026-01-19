/**
 * Trace unexplored wallets - HVRcXaCF, Ed4UGBWK, Hqf4TZxp
 */
import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { TOKENS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Wallets to investigate
const WALLETS = {
  HVRcXaCF: "HVRcXaCFyUFG7iZLm3T1Qn8ZGDMHj3P3BpezUfWfRf2x", // v49j's funder
  Ed4UGBWK: "Ed4UGBWKgQBrPPgfMVejG5uLTK7qcLvMM2WgmrHvroLL", // Bz2yexdH's largest funder
  Hqf4TZxp: "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT", // Downgraded insider
};

// Known chain wallets for connection check
const CHAIN_WALLETS = [
  "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",   // v49j
  "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2", // 37Xxihfs
  "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF", // ROOT
  "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", // Coinbase Hot Wallet
  "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y", // Bz2yexdH
];

async function traceWallet(name: string, address: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TRACING: ${name}`);
  console.log(`Address: ${address}`);
  console.log("=".repeat(60));

  // 1. Get First Funder
  console.log("\n--- First Funder Chain (3 levels) ---");
  const chain = await client.traceFundingChain(address, 3);

  for (let i = 0; i < chain.length; i++) {
    const indent = "  ".repeat(i);
    const wallet = chain[i];
    const isChainWallet = CHAIN_WALLETS.includes(wallet);
    const marker = isChainWallet ? " 🔗 CONNECTED!" : "";
    console.log(`${indent}↓ ${wallet.slice(0, 12)}...${marker}`);
  }

  await delay(2000);

  // 2. Get current balance
  console.log("\n--- Current Balance ---");
  const balances = await client.getCurrentBalance({
    address,
    chain: "solana",
  });

  let solBalance = 0;
  for (const bal of balances) {
    if (bal.token_symbol === "SOL") {
      solBalance = bal.token_amount;
      console.log(`SOL: ${bal.token_amount.toFixed(4)} ($${bal.value_usd?.toFixed(2) || "?"})`);
    }
  }

  await delay(2000);

  // 3. Check connection to chain wallets
  console.log("\n--- Chain Connection Check ---");
  let connected = false;
  for (const chainWallet of chain) {
    if (CHAIN_WALLETS.includes(chainWallet)) {
      connected = true;
      console.log(`✅ CONNECTED via: ${chainWallet.slice(0, 12)}...`);
    }
  }

  if (!connected) {
    console.log("❌ No direct chain connection found in funding chain");
  }

  return { name, address, chain, solBalance, connected };
}

async function checkHqf4TZxpRXRP() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("CHECKING: Hqf4TZxp RXRP Purchase");
  console.log("=".repeat(60));

  // Check if Hqf4TZxp bought RXRP at all
  const RXRP_CA = TOKENS.RXRP;
  console.log(`\nRXRP Token: ${RXRP_CA}`);

  await delay(2000);

  // Get trades for RXRP by this wallet
  const trades = await client.getTGMDexTrades({
    chain: "solana",
    token_address: RXRP_CA,
    date: { from: "2025-11-30", to: "2025-12-01" },
    filters: {
      action: "BUY",
    },
    pagination: { page: 1, per_page: 100 },
  });

  console.log(`\nTotal RXRP buys on Nov 30: ${trades.length}`);

  // Find Hqf4TZxp
  const hqfTrades = trades.filter(t =>
    t.trader_address === WALLETS.Hqf4TZxp
  );

  if (hqfTrades.length > 0) {
    console.log(`\n✅ Hqf4TZxp DID buy RXRP!`);
    for (const trade of hqfTrades) {
      console.log(`  Time: ${trade.block_timestamp}`);
      console.log(`  Amount: ${trade.token_amount?.toFixed(2)} tokens`);
      console.log(`  Value: $${trade.estimated_value_usd?.toFixed(2)}`);
    }
  } else {
    console.log(`\n❌ Hqf4TZxp did NOT buy RXRP on Nov 30`);
  }

  return hqfTrades;
}

async function checkOldDeployers() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("CHECKING: Old Deployers (D7Ms, DBmx) Recent Activity");
  console.log("=".repeat(60));

  const deployers = [
    { name: "D7Ms", addr: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb" },
    { name: "DBmx", addr: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy" },
  ];

  for (const d of deployers) {
    console.log(`\n--- ${d.name} ---`);

    await delay(2000);

    // Get recent transactions
    const txResult = await client.getTransactions({
      address: d.addr,
      chain: "solana",
      date: { from: "2025-12-01", to: "2026-01-16" },
      pagination: { page: 1, per_page: 10 },
    });

    const txns = txResult.data || [];
    console.log(`Transactions since Dec 1: ${txns.length}`);

    if (txns.length > 0) {
      // Sort by date
      txns.sort((a, b) =>
        new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
      );

      console.log(`Last activity: ${txns[0].block_timestamp}`);

      // Check for any SOL received
      for (const tx of txns.slice(0, 3)) {
        if (tx.tokens_received) {
          for (const recv of tx.tokens_received) {
            if (recv.token_symbol === "SOL" && recv.token_amount > 0.01) {
              console.log(`  ⚠️ Received ${recv.token_amount.toFixed(4)} SOL on ${tx.block_timestamp}`);
            }
          }
        }
      }
    } else {
      console.log("No recent activity");
    }
  }
}

async function checkV49jNewCounterparties() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("CHECKING: v49j New Counterparties (Jan 8-16)");
  console.log("=".repeat(60));

  await delay(2000);

  const counterparties = await client.getCounterparties({
    address: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
    chain: "solana",
    date: { from: "2026-01-08", to: "2026-01-16" },
    group_by: "wallet",
    source_input: "Combined",
  });

  console.log(`\nCounterparties since Jan 8: ${counterparties.length}`);

  // Look for any outbound that could be deployer funding
  const outbound = counterparties.filter(cp => (cp.volume_out_usd || 0) > 100);

  console.log(`\n--- Significant Outbound (>$100) ---`);
  if (outbound.length === 0) {
    console.log("No significant outbound found - v49j has NOT funded a deployer yet!");
  } else {
    for (const cp of outbound) {
      console.log(`  ${cp.counterparty_address.slice(0, 12)}...`);
      console.log(`    OUT: $${cp.volume_out_usd?.toFixed(2)}`);
      console.log(`    Labels: ${cp.counterparty_address_label?.join(", ") || "None"}`);
    }
  }

  // Look for significant inbound
  const inbound = counterparties
    .filter(cp => (cp.volume_in_usd || 0) > 100)
    .sort((a, b) => (b.volume_in_usd || 0) - (a.volume_in_usd || 0));

  console.log(`\n--- Top Inbound (funding sources) ---`);
  for (const cp of inbound.slice(0, 5)) {
    console.log(`  ${cp.counterparty_address.slice(0, 12)}...`);
    console.log(`    IN: $${cp.volume_in_usd?.toFixed(2)}`);
    console.log(`    Labels: ${cp.counterparty_address_label?.join(", ") || "None"}`);
  }
}

async function main() {
  console.log("🔍 UNEXPLORED LEADS INVESTIGATION");
  console.log("=".repeat(60));
  console.log("Date:", new Date().toISOString());

  // 1. Trace HVRcXaCF (v49j's funder)
  const hvrc = await traceWallet("HVRcXaCF (v49j funder)", WALLETS.HVRcXaCF);

  await delay(2000);

  // 2. Trace Ed4UGBWK (Bz2yexdH's largest funder)
  const ed4u = await traceWallet("Ed4UGBWK (Bz2y funder)", WALLETS.Ed4UGBWK);

  await delay(2000);

  // 3. Check Hqf4TZxp RXRP purchase
  await checkHqf4TZxpRXRP();

  await delay(2000);

  // 4. Check old deployers
  await checkOldDeployers();

  await delay(2000);

  // 5. Check v49j new counterparties
  await checkV49jNewCounterparties();

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("INVESTIGATION SUMMARY");
  console.log("=".repeat(60));

  console.log(`\nHVRcXaCF (v49j funder): ${hvrc.connected ? "🔗 CONNECTED" : "❌ NOT CONNECTED"}`);
  console.log(`Ed4UGBWK (Bz2y funder): ${ed4u.connected ? "🔗 CONNECTED" : "❌ NOT CONNECTED"}`);
}

main().catch(console.error);
