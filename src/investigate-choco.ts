/**
 * Quick Investigation: CHOCO Token Deployer
 * BDVgXauNbs7AQEqgPich2hUANu6oLf9VQEuXqL2q3Q5a
 */

import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const TARGET = "BDVgXauNbs7AQEqgPich2hUANu6oLf9VQEuXqL2q3Q5a";

// Known deployer chain addresses
const DEPLOYER_CHAIN = [
  "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", // Coinbase 1
  "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q", // Coinbase 2
  "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF", // ROOT
  "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",  // v49j
  "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2", // Original deployer
  "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb", // D7Ms deployer
  "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy", // DBmx deployer
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function investigate() {
  console.log("═".repeat(70));
  console.log("🔍 INVESTIGATING: CHOCO Token Deployer");
  console.log("   Address:", TARGET);
  console.log("   Time:", new Date().toISOString());
  console.log("═".repeat(70));

  // 1. Current Balance
  console.log("\n📍 CURRENT BALANCE");
  console.log("-".repeat(50));

  const balance = await client.getCurrentBalance({
    address: TARGET,
    chain: "solana"
  });

  const solBalance = balance.find(b => b.token_symbol === "SOL");
  console.log("   SOL Balance:", solBalance?.token_amount?.toFixed(4) || 0, "SOL");
  console.log("   USD Value: $" + balance.reduce((sum, b) => sum + (b.value_usd || 0), 0).toFixed(2));

  if (balance.length > 1) {
    console.log("\n   Other tokens:");
    for (const b of balance.filter(x => x.token_symbol !== "SOL").slice(0, 10)) {
      console.log("      ", b.token_symbol?.padEnd(15), b.token_amount?.toFixed(2), "(~$" + (b.value_usd || 0).toFixed(2) + ")");
    }
  }

  await delay(2000);

  // 2. Recent Transactions - check multiple date ranges
  console.log("\n📍 RECENT TRANSACTIONS");
  console.log("-".repeat(50));

  // Check last 30 days
  const txResult = await client.getTransactions({
    address: TARGET,
    chain: "solana",
    date: {
      from: "2025-11-01",
      to: "2025-12-01"
    },
    pagination: { page: 1, per_page: 100 }
  });

  console.log("   November 2025 transactions:", (txResult.data || []).length);

  // Also check October
  await delay(2000);
  const octResult = await client.getTransactions({
    address: TARGET,
    chain: "solana",
    date: {
      from: "2025-10-01",
      to: "2025-11-01"
    },
    pagination: { page: 1, per_page: 100 }
  });

  console.log("   October 2025 transactions:", (octResult.data || []).length);

  // Combine and sort
  const txs = [...(txResult.data || []), ...(octResult.data || [])];
  console.log("   Total transactions (Oct-Nov):", txs.length);

  if (txs.length > 0) {
    // Sort by timestamp descending (most recent first)
    txs.sort((a, b) => new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime());

    console.log("\n   Most recent 20 transactions:");
    console.log("   " + "-".repeat(90));

    for (const tx of txs.slice(0, 20)) {
      const time = new Date(tx.block_timestamp);
      const now = new Date();
      const minutesAgo = Math.round((now.getTime() - time.getTime()) / 60000);
      const timeStr = minutesAgo < 60
        ? `${minutesAgo}m ago`
        : minutesAgo < 1440
          ? `${Math.round(minutesAgo/60)}h ago`
          : `${Math.round(minutesAgo/1440)}d ago`;

      // Analyze transaction
      let action = "?";
      let details = "";
      let flagged = "";

      if (tx.tokens_sent && tx.tokens_sent.length > 0) {
        for (const sent of tx.tokens_sent) {
          action = "SENT";
          const amt = sent.token_amount?.toFixed(4) || "?";
          const sym = sent.token_symbol || "?";
          const to = sent.to_address?.slice(0, 12) || "?";
          const toLabel = sent.to_address_label ? ` (${sent.to_address_label})` : "";
          details = `${amt} ${sym} → ${to}...${toLabel}`;

          // Check if recipient is in deployer chain
          if (sent.to_address && DEPLOYER_CHAIN.includes(sent.to_address)) {
            flagged = " ⚠️ DEPLOYER CHAIN!";
          }
        }
      }

      if (tx.tokens_received && tx.tokens_received.length > 0) {
        for (const recv of tx.tokens_received) {
          if (action === "SENT") {
            action = "SWAP";
          } else {
            action = "RECV";
            const amt = recv.token_amount?.toFixed(4) || "?";
            const sym = recv.token_symbol || "?";
            const from = recv.from_address?.slice(0, 12) || "?";
            const fromLabel = recv.from_address_label ? ` (${recv.from_address_label})` : "";
            details = `${amt} ${sym} ← ${from}...${fromLabel}`;

            // Check if sender is in deployer chain
            if (recv.from_address && DEPLOYER_CHAIN.includes(recv.from_address)) {
              flagged = " ⚠️ DEPLOYER CHAIN!";
            }
          }
        }
      }

      console.log(`   [${timeStr.padEnd(7)}] ${action.padEnd(5)} | ${details}${flagged}`);
    }
  }

  await delay(2000);

  // 3. Funding Chain (trace upwards)
  console.log("\n📍 FUNDING CHAIN (Who funded this wallet?)");
  console.log("-".repeat(50));

  let currentAddr = TARGET;
  const chain: string[] = [];

  for (let level = 1; level <= 10; level++) {
    const related = await client.getRelatedWallets({
      address: currentAddr,
      chain: "solana",
      pagination: { page: 1, per_page: 50 }
    });

    const funder = related.find(r => r.relation === "First Funder");
    if (!funder) {
      console.log(`   L${level}: [END - No First Funder found]`);
      break;
    }

    chain.push(funder.address);
    const isDeployerChain = DEPLOYER_CHAIN.includes(funder.address);
    const flag = isDeployerChain ? " ⚠️ OUR DEPLOYER CHAIN!" : "";

    console.log(`   L${level}: ${funder.address.slice(0, 16)}... ${funder.address_label || ""}${flag}`);

    if (isDeployerChain) {
      console.log("\n   🚨 CRITICAL: This wallet traces back to our deployer chain!");
      break;
    }

    // Stop at CEX
    if (funder.address_label?.toLowerCase().includes("coinbase") ||
        funder.address_label?.toLowerCase().includes("binance") ||
        funder.address_label?.toLowerCase().includes("crypto.com") ||
        funder.address_label?.toLowerCase().includes("kraken") ||
        funder.address_label?.toLowerCase().includes("htx")) {
      console.log("   [CEX REACHED]");
      break;
    }

    currentAddr = funder.address;
    await delay(2000);
  }

  await delay(2000);

  // 4. Wallets funded BY this address
  console.log("\n📍 WALLETS FUNDED BY THIS ADDRESS");
  console.log("-".repeat(50));

  const allTxs = await client.getTransactions({
    address: TARGET,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    pagination: { page: 1, per_page: 100 }
  });

  const fundedWallets = new Map<string, { amount: number; label?: string; lastTime: string }>();

  for (const tx of allTxs.data || []) {
    for (const sent of tx.tokens_sent || []) {
      if (sent.to_address && sent.token_symbol === "SOL" && (sent.token_amount || 0) > 0.01) {
        const existing = fundedWallets.get(sent.to_address);
        if (existing) {
          existing.amount += sent.token_amount || 0;
          if (tx.block_timestamp > existing.lastTime) {
            existing.lastTime = tx.block_timestamp;
          }
        } else {
          fundedWallets.set(sent.to_address, {
            amount: sent.token_amount || 0,
            label: sent.to_address_label,
            lastTime: tx.block_timestamp
          });
        }
      }
    }
  }

  console.log("   Total wallets funded with SOL:", fundedWallets.size);

  // Sort by amount descending
  const sorted = [...fundedWallets.entries()].sort((a, b) => b[1].amount - a[1].amount);

  console.log("\n   Top 15 recipients:");
  for (const [addr, data] of sorted.slice(0, 15)) {
    const isDeployerChain = DEPLOYER_CHAIN.includes(addr);
    const flag = isDeployerChain ? " ⚠️ DEPLOYER!" : "";
    const label = data.label ? ` (${data.label})` : "";
    console.log(`      ${addr.slice(0, 16)}... ${data.amount.toFixed(4)} SOL${label}${flag}`);
  }

  // Check for any deployer chain connections
  const deployerConnections = sorted.filter(([addr]) => DEPLOYER_CHAIN.includes(addr));
  if (deployerConnections.length > 0) {
    console.log("\n   🚨 DEPLOYER CHAIN CONNECTIONS FOUND:");
    for (const [addr, data] of deployerConnections) {
      console.log(`      ${addr} - ${data.amount.toFixed(4)} SOL`);
    }
  }

  await delay(2000);

  // 5. Top Counterparties
  console.log("\n📍 TOP COUNTERPARTIES");
  console.log("-".repeat(50));

  const counterparties = await client.getCounterparties({
    address: TARGET,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    group_by: "wallet",
    source_input: "Combined"
  });

  console.log("   Total counterparties:", counterparties.length);
  console.log("   Total volume: $" + counterparties.reduce((sum, cp) => sum + (cp.total_volume_usd || 0), 0).toLocaleString());

  const topCps = counterparties.sort((a, b) => (b.total_volume_usd || 0) - (a.total_volume_usd || 0)).slice(0, 15);

  console.log("\n   Top 15 by volume:");
  for (const cp of topCps) {
    const label = cp.counterparty_address_label?.join(", ") || "";
    const isDeployerChain = DEPLOYER_CHAIN.includes(cp.counterparty_address);
    const flag = isDeployerChain ? " ⚠️ DEPLOYER!" : "";
    console.log(`      ${cp.counterparty_address.slice(0, 16)}... $${(cp.total_volume_usd || 0).toFixed(2)} ${label}${flag}`);
  }

  // Check for deployer chain in counterparties
  const deployerCps = counterparties.filter(cp => DEPLOYER_CHAIN.includes(cp.counterparty_address));
  if (deployerCps.length > 0) {
    console.log("\n   🚨 DEPLOYER CHAIN IN COUNTERPARTIES:");
    for (const cp of deployerCps) {
      console.log(`      ${cp.counterparty_address} - $${(cp.total_volume_usd || 0).toFixed(2)}`);
    }
  }

  console.log("\n" + "═".repeat(70));
  console.log("INVESTIGATION COMPLETE");
  console.log("═".repeat(70));
}

investigate().catch(console.error);
