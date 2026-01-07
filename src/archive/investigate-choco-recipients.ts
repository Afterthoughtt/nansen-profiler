/**
 * Investigate CHOCO Deployer's recent SOL recipients
 * These wallets received 2 SOL each about 7 hours ago
 */

import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Recipients of 2 SOL from CHOCO deployer
const RECIPIENTS = [
  { address: "JAfv6AiNzsAbGzvsSNpJz4qXvc3xuybDTxB9y3uLcxeG", amount: "2 SOL" },
  { address: "6yjqK7VWTiDFN2gfyLDTde63jCUmqZcp16SCgq9bNjov", amount: "2 SOL" },
  { address: "CJVEFdRSSPp9788dJ2zQZrL6GFWERsYaaYkTKqFxUPf6", amount: "2 SOL" },
  { address: "9J9VHoLWgTRxuc6DtNYxRMi2jVqAFAPshUSMeWQ7wz3Y", amount: "2 SOL" },
  { address: "ARu4n5mFdZogZAravu7CcizaojWnS6oqka37gdLT5SZn", amount: "600 USDC" },
];

// Known deployer chain
const DEPLOYER_CHAIN = [
  "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
  "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q",
  "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
  "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
  "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
  "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
];

const CHOCO_DEPLOYER = "BDVgXauNbs7AQEqgPich2hUANu6oLf9VQEuXqL2q3Q5a";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function investigateRecipient(address: string, amount: string) {
  console.log("\n" + "-".repeat(60));
  console.log(`📍 ${address.slice(0, 16)}... (received ${amount})`);
  console.log("-".repeat(60));

  // 1. Current Balance
  const balance = await client.getCurrentBalance({
    address,
    chain: "solana"
  });
  await delay(2000);

  const solBalance = balance.find(b => b.token_symbol === "SOL");
  console.log("   SOL Balance:", (solBalance?.token_amount || 0).toFixed(4), "SOL");

  // Check if they still have the SOL (or spent it)
  if ((solBalance?.token_amount || 0) < 1) {
    console.log("   ⚠️  SOL largely spent!");
  }

  // 2. First Funder
  const related = await client.getRelatedWallets({
    address,
    chain: "solana",
    pagination: { page: 1, per_page: 50 }
  });
  await delay(2000);

  const firstFunder = related.find(r => r.relation === "First Funder");
  if (firstFunder) {
    const isChoco = firstFunder.address === CHOCO_DEPLOYER;
    const isDeployerChain = DEPLOYER_CHAIN.includes(firstFunder.address);
    console.log("   First Funder:", firstFunder.address.slice(0, 16) + "...", firstFunder.address_label || "");
    if (isChoco) console.log("   ✅ First Funder is CHOCO Deployer");
    if (isDeployerChain) console.log("   ⚠️  Connected to deployer chain!");
  } else {
    console.log("   First Funder: Unknown");
  }

  // 3. Transaction count / activity
  const txResult = await client.getTransactions({
    address,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    pagination: { page: 1, per_page: 100 }
  });
  await delay(2000);

  const txCount = (txResult.data || []).length;
  console.log("   Transaction count (2025):", txCount);

  // Check if it's a fresh wallet
  if (txCount < 10) {
    console.log("   🚨 FRESH WALLET - Low transaction count!");
  }

  // 4. Check for pump.fun activity
  const txs = txResult.data || [];
  const pumpTxs = txs.filter(tx => {
    const hasPump = (tx.tokens_sent || []).some(s =>
      s.to_address_label?.toLowerCase().includes("pump") ||
      s.token_address?.includes("pump")
    ) || (tx.tokens_received || []).some(r =>
      r.from_address_label?.toLowerCase().includes("pump") ||
      r.token_address?.includes("pump")
    );
    return hasPump;
  });

  if (pumpTxs.length > 0) {
    console.log("   🚨 PUMP.FUN ACTIVITY DETECTED:", pumpTxs.length, "transactions");
  }

  // 5. Recent activity
  if (txs.length > 0) {
    txs.sort((a, b) => new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime());
    const lastTx = txs[0];
    const minutesAgo = Math.round((Date.now() - new Date(lastTx.block_timestamp).getTime()) / 60000);
    console.log("   Last activity:", minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.round(minutesAgo/60)}h ago`);

    // Show last few transactions
    console.log("\n   Recent transactions:");
    for (const tx of txs.slice(0, 5)) {
      const time = new Date(tx.block_timestamp);
      const minAgo = Math.round((Date.now() - time.getTime()) / 60000);
      const timeStr = minAgo < 60 ? `${minAgo}m ago` : `${Math.round(minAgo/60)}h ago`;

      let action = "?";
      let details = "";

      if (tx.tokens_sent && tx.tokens_sent.length > 0) {
        const sent = tx.tokens_sent[0];
        action = "SENT";
        details = `${sent.token_amount?.toFixed(4)} ${sent.token_symbol} → ${sent.to_address?.slice(0,8)}...`;
        if (sent.to_address_label) details += ` (${sent.to_address_label})`;
      }
      if (tx.tokens_received && tx.tokens_received.length > 0) {
        const recv = tx.tokens_received[0];
        if (action === "SENT") action = "SWAP";
        else {
          action = "RECV";
          details = `${recv.token_amount?.toFixed(4)} ${recv.token_symbol} ← ${recv.from_address?.slice(0,8)}...`;
          if (recv.from_address_label) details += ` (${recv.from_address_label})`;
        }
      }

      console.log(`      [${timeStr.padEnd(7)}] ${action.padEnd(5)} ${details}`);
    }
  }

  // 6. Counterparties
  const counterparties = await client.getCounterparties({
    address,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    group_by: "wallet",
    source_input: "Combined"
  });
  await delay(2000);

  console.log("\n   Counterparties:", counterparties.length);

  // Check for deployer chain in counterparties
  const deployerCps = counterparties.filter(cp => DEPLOYER_CHAIN.includes(cp.counterparty_address));
  if (deployerCps.length > 0) {
    console.log("   ⚠️  DEPLOYER CHAIN IN COUNTERPARTIES!");
    for (const cp of deployerCps) {
      console.log(`      ${cp.counterparty_address.slice(0, 16)}... $${(cp.total_volume_usd || 0).toFixed(2)}`);
    }
  }

  // Return summary
  return {
    address,
    solBalance: solBalance?.token_amount || 0,
    firstFunder: firstFunder?.address || null,
    isChocoFunded: firstFunder?.address === CHOCO_DEPLOYER,
    txCount,
    isFresh: txCount < 10,
    hasPumpActivity: pumpTxs.length > 0,
    counterpartyCount: counterparties.length,
  };
}

async function main() {
  console.log("═".repeat(60));
  console.log("🔍 INVESTIGATING CHOCO DEPLOYER'S RECENT RECIPIENTS");
  console.log("   These wallets received SOL/USDC about 7 hours ago");
  console.log("═".repeat(60));

  const results = [];

  for (const recipient of RECIPIENTS) {
    const result = await investigateRecipient(recipient.address, recipient.amount);
    results.push(result);
  }

  // Summary
  console.log("\n\n" + "═".repeat(60));
  console.log("SUMMARY");
  console.log("═".repeat(60));

  console.log("\n┌──────────────────────────────────┬──────────┬──────────┬──────────┬──────────┐");
  console.log("│ Address                          │ SOL      │ Txs      │ Fresh?   │ Pump.fun │");
  console.log("├──────────────────────────────────┼──────────┼──────────┼──────────┼──────────┤");

  for (const r of results) {
    const addr = r.address.slice(0, 12) + "...";
    const sol = r.solBalance.toFixed(2).padStart(8);
    const txs = String(r.txCount).padStart(8);
    const fresh = r.isFresh ? "🚨 YES" : "No";
    const pump = r.hasPumpActivity ? "🚨 YES" : "No";
    console.log(`│ ${addr.padEnd(32)} │ ${sol} │ ${txs} │ ${fresh.padEnd(8)} │ ${pump.padEnd(8)} │`);
  }

  console.log("└──────────────────────────────────┴──────────┴──────────┴──────────┴──────────┘");

  // Flag potential deployer wallets
  const potentialDeployers = results.filter(r => r.isFresh && r.isChocoFunded);
  if (potentialDeployers.length > 0) {
    console.log("\n🚨 POTENTIAL DEPLOYER WALLETS (Fresh + CHOCO funded):");
    for (const r of potentialDeployers) {
      console.log(`   ${r.address}`);
    }
  }

  console.log("\n" + "═".repeat(60));
}

main().catch(console.error);
