/**
 * Investigate HRcur4 - correct address
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const HRCUR4 = "HRcur4Ggby1SVYCJyafw8sypaAnKXEG61Lv4foEgqnWb";

async function main() {
  console.log("=== HRcur4 INVESTIGATION ===\n");
  console.log(`Address: ${HRCUR4}\n`);

  // 1. Balance
  console.log("--- Current Balance ---");
  const balance = await client.getCurrentBalance({
    address: HRCUR4,
    chain: "solana"
  });

  for (const b of balance) {
    const amt = Number(b.token_amount);
    if (amt > 0.001) {
      console.log(`${b.token_symbol}: ${amt.toFixed(4)}`);
    }
  }

  const solBal = balance.find(b => b.token_symbol === "SOL");
  const usdcBal = balance.find(b => b.token_symbol === "USDC");
  const solAmt = solBal ? Number(solBal.token_amount) : 0;
  const usdcAmt = usdcBal ? Number(usdcBal.token_amount) : 0;

  if (solAmt >= 5) {
    console.log("🚨 DEPLOYER THRESHOLD SOL BALANCE!");
  }

  await delay(2000);

  // 2. First Funder
  console.log("\n--- First Funder ---");
  const related = await client.getRelatedWallets({
    address: HRCUR4,
    chain: "solana"
  });

  const firstFunder = related.find(w => w.relation === "First Funder");
  if (firstFunder) {
    console.log(`First Funder: ${firstFunder.address}`);
    console.log(`Label: ${firstFunder.address_label || "Unknown"}`);

    if ([WALLETS.PRIMARY_FUNDER, WALLETS.ORIGINAL_DEPLOYER].includes(firstFunder.address)) {
      console.log("🚨🚨🚨 FIRST FUNDER IS IN DEPLOYER CHAIN!");
    }
  } else {
    console.log("Could not determine First Funder");
  }

  await delay(2000);

  // 3. All Transactions
  console.log("\n--- All Transactions ---");
  const txns = await client.getTransactions({
    address: HRCUR4,
    chain: "solana",
    date: { from: "2025-01-01T00:00:00Z", to: "2026-12-31T23:59:59Z" }
  });

  const txList = txns.data || [];
  console.log(`Total transactions: ${txList.length}\n`);

  for (const tx of txList.slice(0, 20)) {
    const received = tx.tokens_received || [];
    const sent = tx.tokens_sent || [];

    let hasTransfer = false;
    for (const r of received) {
      const amt = Number(r.token_amount);
      if (amt > 0.001) {
        if (!hasTransfer) {
          console.log(`${tx.block_timestamp}`);
          hasTransfer = true;
        }
        console.log(`  IN: ${amt.toFixed(4)} ${r.token_symbol} from ${r.from_address?.slice(0, 12)}...`);
      }
    }
    for (const s of sent) {
      const amt = Number(s.token_amount);
      if (amt > 0.001) {
        if (!hasTransfer) {
          console.log(`${tx.block_timestamp}`);
          hasTransfer = true;
        }
        console.log(`  OUT: ${amt.toFixed(4)} ${s.token_symbol} to ${s.to_address?.slice(0, 12)}...`);
      }
    }
  }

  // 4. Assessment
  console.log("\n" + "=".repeat(60));
  console.log("ASSESSMENT:");

  if (solAmt >= 8 && firstFunder?.address &&
      [WALLETS.PRIMARY_FUNDER, WALLETS.ORIGINAL_DEPLOYER].includes(firstFunder.address)) {
    console.log("🚨🚨🚨 HIGH PROBABILITY DEPLOYER!");
  } else if (txList.length < 10 && (solAmt > 0 || usdcAmt > 50)) {
    console.log("⚠️ FRESH WALLET WITH FUNDS - MONITOR CLOSELY");
  } else if (txList.length > 50) {
    console.log("✓ Likely operational wallet (high tx count)");
  } else {
    console.log("⚠️ Needs monitoring - check First Funder chain");
  }
  console.log("=".repeat(60));
}

main().catch(console.error);
