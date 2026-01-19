/**
 * Full Pre-Launch Check - Jan 16, 2026
 * Check ALL key wallets for recent activity
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

interface WalletCheck {
  name: string;
  address: string;
  tier: string;
}

const WALLETS_TO_CHECK: WalletCheck[] = [
  // Tier 1 - Critical
  { name: "v49j (Primary Funder)", address: WALLETS.PRIMARY_FUNDER, tier: "1" },
  { name: "37Xxihfs (Original Deployer)", address: WALLETS.ORIGINAL_DEPLOYER, tier: "1" },
  { name: "GUCX6xNe (Pre-funded Sleeper)", address: WALLETS.DEPLOYER_GUCX, tier: "1" },

  // Tier 2 - High
  { name: "Bz2yexdH (Nov30 Deployer)", address: WALLETS.DEPLOYER_BZ2Y, tier: "2" },
  { name: "FSbvLdrK (Connected Insider)", address: WALLETS.INSIDER_FSBV, tier: "2" },
  { name: "4yWaU1Qr (Profit Extraction)", address: "4yWaU1QrwteHi1gixoFehknRP9a61T5PhAfM6ED3U2bs", tier: "2" },

  // Tier 3 - Intel
  { name: "H3qSndFC (3-token Insider)", address: WALLETS.INSIDER_H3Q, tier: "3" },
];

async function checkWallet(wallet: WalletCheck) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[TIER ${wallet.tier}] ${wallet.name}`);
  console.log(`Address: ${wallet.address}`);
  console.log("=".repeat(60));

  // 1. Get current balance (SOL + stablecoins)
  const balance = await client.getCurrentBalance({
    address: wallet.address,
    chain: "solana"
  });

  const solBalance = balance.find(b => b.token_symbol === "SOL");
  const usdcBalance = balance.find(b => b.token_symbol === "USDC");
  const usdtBalance = balance.find(b => b.token_symbol === "USDT");

  const solAmt = solBalance ? Number(solBalance.token_amount) : 0;
  const usdcAmt = usdcBalance ? Number(usdcBalance.token_amount) : 0;
  const usdtAmt = usdtBalance ? Number(usdtBalance.token_amount) : 0;

  console.log(`\nBalance: ${solAmt.toFixed(4)} SOL`);
  if (usdcAmt > 1) console.log(`         ${usdcAmt.toFixed(2)} USDC`);
  if (usdtAmt > 1) console.log(`         ${usdtAmt.toFixed(2)} USDT`);

  if (solAmt >= 5) {
    console.log("🚨 HIGH BALANCE - Deployer threshold!");
  }
  if (usdcAmt >= 100 || usdtAmt >= 100) {
    console.log("⚠️ Significant stablecoin balance - monitor for conversion to SOL");
  }

  await delay(1500);

  // 2. Get recent transactions
  const result = await client.getTransactions({
    chain: "solana",
    address: wallet.address,
    date: { from: "2026-01-10T00:00:00Z", to: "2026-01-17T23:59:59Z" }
  });

  const txns = result.data || [];
  console.log(`\nTransactions (Jan 10-17): ${txns.length}`);

  // Show significant transfers (SOL, USDC, USDT)
  let hasSignificantActivity = false;
  for (const tx of txns.slice(0, 10)) {
    const received = tx.tokens_received || [];
    const sent = tx.tokens_sent || [];

    // Check SOL
    const solReceived = received.find(t => t.token_symbol === "SOL");
    const solSent = sent.find(t => t.token_symbol === "SOL");
    const solRecvAmt = solReceived ? Number(solReceived.token_amount) : 0;
    const solSentAmt = solSent ? Number(solSent.token_amount) : 0;

    // Check USDC
    const usdcReceived = received.find(t => t.token_symbol === "USDC");
    const usdcSent = sent.find(t => t.token_symbol === "USDC");
    const usdcRecvAmt = usdcReceived ? Number(usdcReceived.token_amount) : 0;
    const usdcSentAmt = usdcSent ? Number(usdcSent.token_amount) : 0;

    // Check USDT
    const usdtReceived = received.find(t => t.token_symbol === "USDT");
    const usdtSent = sent.find(t => t.token_symbol === "USDT");
    const usdtRecvAmt = usdtReceived ? Number(usdtReceived.token_amount) : 0;
    const usdtSentAmt = usdtSent ? Number(usdtSent.token_amount) : 0;

    // Show any significant transfer
    const hasTransfer = solRecvAmt >= 0.1 || solSentAmt >= 0.1 ||
                        usdcRecvAmt >= 10 || usdcSentAmt >= 10 ||
                        usdtRecvAmt >= 10 || usdtSentAmt >= 10;

    if (hasTransfer) {
      hasSignificantActivity = true;
      console.log(`\n  ${tx.block_timestamp}`);

      if (solRecvAmt >= 0.1) {
        console.log(`    IN:  ${solRecvAmt.toFixed(4)} SOL from ${solReceived?.from_address?.slice(0, 10)}...`);
      }
      if (solSentAmt >= 0.1) {
        console.log(`    OUT: ${solSentAmt.toFixed(4)} SOL to ${solSent?.to_address?.slice(0, 10)}...`);
        if (solSentAmt >= 5) {
          console.log(`    🚨🚨🚨 POTENTIAL DEPLOYER FUNDING! To: ${solSent?.to_address}`);
        }
      }
      if (usdcRecvAmt >= 10) {
        console.log(`    IN:  ${usdcRecvAmt.toFixed(2)} USDC from ${usdcReceived?.from_address?.slice(0, 10)}...`);
      }
      if (usdcSentAmt >= 10) {
        console.log(`    OUT: ${usdcSentAmt.toFixed(2)} USDC to ${usdcSent?.to_address?.slice(0, 10)}...`);
      }
      if (usdtRecvAmt >= 10) {
        console.log(`    IN:  ${usdtRecvAmt.toFixed(2)} USDT from ${usdtReceived?.from_address?.slice(0, 10)}...`);
      }
      if (usdtSentAmt >= 10) {
        console.log(`    OUT: ${usdtSentAmt.toFixed(2)} USDT to ${usdtSent?.to_address?.slice(0, 10)}...`);
      }
    }
  }

  if (!hasSignificantActivity) {
    console.log("  No significant transfers in period");
  }

  await delay(1500);
  return { wallet, balance: solAmt, txCount: txns.length };
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     FULL PRE-LAUNCH CHECK - January 16, 2026               ║");
  console.log("║     2 DAYS TO LAUNCH (Sunday, January 18)                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: { wallet: WalletCheck; balance: number; txCount: number }[] = [];

  for (const wallet of WALLETS_TO_CHECK) {
    const result = await checkWallet(wallet);
    results.push(result);
    await delay(1000);
  }

  // Summary
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                        SUMMARY                             ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("Wallet Balances:");
  for (const r of results) {
    const flag = r.balance >= 5 ? "🚨" : r.balance >= 1 ? "⚠️" : "✓";
    console.log(`  ${flag} [T${r.wallet.tier}] ${r.wallet.name.padEnd(35)} ${r.balance.toFixed(4)} SOL`);
  }

  // Find highest balance
  const maxBalance = results.reduce((max, r) => r.balance > max.balance ? r : max, results[0]);

  console.log("\n" + "=".repeat(60));
  console.log("HIGHEST BALANCE:");
  console.log(`  ${maxBalance.wallet.name}: ${maxBalance.balance.toFixed(4)} SOL`);

  if (maxBalance.balance >= 8) {
    console.log("\n🚨 ALERT: Wallet at deployer funding threshold!");
  } else if (maxBalance.balance >= 5) {
    console.log("\n⚠️ WARNING: Wallet approaching threshold (8-15 SOL)");
  }

  console.log("\n" + "=".repeat(60));
  console.log("LAUNCH READINESS:");
  console.log("  - Launch: Sunday, January 18, 2026");
  console.log("  - Expected: 10 AM - 12 PM Pacific");
  console.log("  - Deployer funding: 2-3 hours before launch");
  console.log("  - Signal: v49j/37Xxihfs sends >5 SOL to fresh wallet");
  console.log("=".repeat(60));
}

main().catch(console.error);
