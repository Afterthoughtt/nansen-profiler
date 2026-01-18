/**
 * Investigate v49j USDC transfer recipients
 * E41iCF and HRcur4 - potential new pattern?
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Wallets that received USDC from v49j today
const USDC_RECIPIENTS = [
  { short: "E41iCF", full: "E41iCFHDphDFCcnPfjkeuhPwYxSaRP2WKMvSUr8hVzTf", amount: "199.2 USDC" },
  { short: "HRcur4", full: "HRcur4duiocvijEy95hqvyLxPdJUyENBPBjaM6hbCT9X", amount: "100 USDC" },
];

async function investigateWallet(wallet: typeof USDC_RECIPIENTS[0]) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🔍 INVESTIGATING: ${wallet.short}`);
  console.log(`   Received: ${wallet.amount} from v49j`);
  console.log(`   Address: ${wallet.full}`);
  console.log("=".repeat(70));

  // 1. Current Balance
  console.log("\n--- Current Balance ---");
  const balance = await client.getCurrentBalance({
    address: wallet.full,
    chain: "solana"
  });

  let solAmt = 0;
  let usdcAmt = 0;
  for (const b of balance) {
    if (b.token_symbol === "SOL") {
      solAmt = Number(b.token_amount);
      console.log(`SOL: ${solAmt.toFixed(4)}`);
    }
    if (b.token_symbol === "USDC") {
      usdcAmt = Number(b.token_amount);
      console.log(`USDC: ${usdcAmt.toFixed(2)}`);
    }
  }

  if (solAmt >= 5) {
    console.log("🚨 DEPLOYER THRESHOLD SOL BALANCE!");
  }

  await delay(2000);

  // 2. First Funder
  console.log("\n--- First Funder ---");
  const related = await client.getRelatedWallets({
    address: wallet.full,
    chain: "solana"
  });

  const firstFunder = related.find(w => w.relation === "First Funder");
  if (firstFunder) {
    console.log(`First Funder: ${firstFunder.address}`);
    console.log(`Label: ${firstFunder.address_label || "Unknown"}`);

    const chainWallets = [
      WALLETS.PRIMARY_FUNDER, // v49j
      WALLETS.ORIGINAL_DEPLOYER, // 37Xxihfs
    ];

    if (chainWallets.includes(firstFunder.address)) {
      console.log("🚨🚨🚨 FIRST FUNDER IS IN DEPLOYER CHAIN!");
    }
  }

  await delay(2000);

  // 3. Recent Transactions
  console.log("\n--- Recent Transactions (Jan 2026) ---");
  const txns = await client.getTransactions({
    address: wallet.full,
    chain: "solana",
    date: { from: "2026-01-01T00:00:00Z", to: "2026-01-17T23:59:59Z" }
  });

  const txList = txns.data || [];
  console.log(`Total January transactions: ${txList.length}`);

  for (const tx of txList.slice(0, 15)) {
    const received = tx.tokens_received || [];
    const sent = tx.tokens_sent || [];

    // Show ALL token transfers
    let hasTransfer = false;
    for (const r of received) {
      const amt = Number(r.token_amount);
      if (amt > 0.001) {
        if (!hasTransfer) {
          console.log(`\n  ${tx.block_timestamp}`);
          hasTransfer = true;
        }
        console.log(`    IN: ${amt.toFixed(4)} ${r.token_symbol} from ${r.from_address?.slice(0, 10)}...`);
      }
    }
    for (const s of sent) {
      const amt = Number(s.token_amount);
      if (amt > 0.001) {
        if (!hasTransfer) {
          console.log(`\n  ${tx.block_timestamp}`);
          hasTransfer = true;
        }
        console.log(`    OUT: ${amt.toFixed(4)} ${s.token_symbol} to ${s.to_address?.slice(0, 10)}...`);
      }
    }
  }

  await delay(2000);

  // 4. Counterparties
  console.log("\n--- Counterparties (Jan 2026) ---");
  try {
    const cps = await client.getCounterparties({
      address: wallet.full,
      chain: "solana",
      date: { from: "2026-01-01T00:00:00Z", to: "2026-01-17T23:59:59Z" }
    });

    console.log(`Total counterparties: ${cps.length}`);
    for (const cp of cps.slice(0, 10)) {
      const volIn = cp.volume_in_usd || 0;
      const volOut = cp.volume_out_usd || 0;
      if (volIn > 10 || volOut > 10) {
        console.log(`  ${cp.counterparty_address?.slice(0, 12)}... | Label: ${cp.counterparty_address_label || "Unknown"}`);
        console.log(`    IN: $${volIn.toFixed(2)} | OUT: $${volOut.toFixed(2)}`);
      }
    }
  } catch (err) {
    console.log("  Counterparty query failed");
  }

  return { wallet, solAmt, usdcAmt, txCount: txList.length, firstFunder };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  URGENT: Investigating v49j USDC Recipients                      ║");
  console.log("║  Could this be a NEW deployment pattern?                         ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");

  const results = [];
  for (const wallet of USDC_RECIPIENTS) {
    const result = await investigateWallet(wallet);
    results.push(result);
  }

  // Summary
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║                         ASSESSMENT                               ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  for (const r of results) {
    console.log(`${r.wallet.short}:`);
    console.log(`  SOL: ${r.solAmt.toFixed(4)} | USDC: ${r.usdcAmt.toFixed(2)}`);
    console.log(`  Txns: ${r.txCount}`);
    console.log(`  First Funder: ${r.firstFunder?.address?.slice(0, 12) || "Unknown"}...`);

    // Deployer assessment
    if (r.solAmt >= 8 && r.firstFunder?.address &&
        [WALLETS.PRIMARY_FUNDER, WALLETS.ORIGINAL_DEPLOYER].includes(r.firstFunder.address)) {
      console.log(`  🚨🚨🚨 HIGH RISK - POTENTIAL DEPLOYER!`);
    } else if (r.txCount < 20 && r.firstFunder?.address === WALLETS.PRIMARY_FUNDER) {
      console.log(`  ⚠️ MEDIUM RISK - Fresh wallet funded by v49j`);
    } else if (r.txCount > 100) {
      console.log(`  ✓ LOW RISK - Operational wallet (high tx count)`);
    } else {
      console.log(`  ⚠️ NEEDS FURTHER INVESTIGATION`);
    }
    console.log("");
  }

  console.log("=".repeat(70));
  console.log("NOTE: Previous deployments used SOL funding, not USDC.");
  console.log("If entity is changing pattern, USDC could convert to SOL for deployment.");
  console.log("Watch these wallets for SOL accumulation.");
  console.log("=".repeat(70));
}

main().catch(console.error);
