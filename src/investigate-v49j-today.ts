/**
 * Investigate v49j activity today (Jan 16-17, 2026)
 * Check for any fresh wallet funding
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

async function main() {
  console.log("=== V49J ACTIVITY INVESTIGATION (Jan 15-17) ===\n");
  console.log(`v49j: ${WALLETS.PRIMARY_FUNDER}\n`);

  // 1. Get recent transactions
  console.log("--- Recent Transactions ---\n");
  const result = await client.getTransactions({
    chain: "solana",
    address: WALLETS.PRIMARY_FUNDER,
    date: { from: "2026-01-15T00:00:00Z", to: "2026-01-17T23:59:59Z" }
  });

  const txns = result.data || [];
  console.log(`Found ${txns.length} transactions (Jan 15-17)\n`);

  let totalIn = 0;
  let totalOut = 0;
  const freshWalletsSent: string[] = [];

  for (const tx of txns) {
    const received = tx.tokens_received || [];
    const sent = tx.tokens_sent || [];

    const solReceived = received.find(t => t.token_symbol === "SOL");
    const solSent = sent.find(t => t.token_symbol === "SOL");

    const recvAmt = solReceived ? Number(solReceived.token_amount) : 0;
    const sentAmt = solSent ? Number(solSent.token_amount) : 0;

    if (recvAmt > 0.001 || sentAmt > 0.001) {
      console.log(`Date: ${tx.block_timestamp}`);
      console.log(`  Hash: ${tx.transaction_hash}`);

      if (recvAmt > 0.001) {
        console.log(`  RECEIVED: ${recvAmt.toFixed(4)} SOL`);
        console.log(`  From: ${solReceived?.from_address}`);
        totalIn += recvAmt;
      }

      if (sentAmt > 0.001) {
        console.log(`  SENT: ${sentAmt.toFixed(4)} SOL`);
        console.log(`  To: ${solSent?.to_address}`);
        totalOut += sentAmt;

        // Track potential fresh wallets
        if (solSent?.to_address && sentAmt >= 1) {
          freshWalletsSent.push(`${solSent.to_address} (${sentAmt.toFixed(2)} SOL)`);
        }
      }
      console.log("");
    }
  }

  console.log("--- Summary ---");
  console.log(`Total IN: ${totalIn.toFixed(4)} SOL`);
  console.log(`Total OUT: ${totalOut.toFixed(4)} SOL`);
  console.log(`Net: ${(totalIn - totalOut).toFixed(4)} SOL\n`);

  if (freshWalletsSent.length > 0) {
    console.log("🚨 POTENTIAL DEPLOYER FUNDING DETECTED!");
    console.log("v49j sent >1 SOL to these wallets:");
    for (const w of freshWalletsSent) {
      console.log(`  - ${w}`);
    }
  } else {
    console.log("✓ No significant SOL outbound to fresh wallets detected");
  }

  // 2. Check counterparties
  await delay(2000);
  console.log("\n--- Recent Counterparties ---\n");

  try {
    const cps = await client.getCounterparties({
      address: WALLETS.PRIMARY_FUNDER,
      chain: "solana",
      date: { from: "2026-01-15T00:00:00Z", to: "2026-01-17T23:59:59Z" }
    });

    console.log(`Found ${cps.length} counterparties (Jan 15-17)\n`);

    // Sort by volume
    const sorted = cps.sort((a, b) => {
      const aTotal = (a.volume_in_usd || 0) + (a.volume_out_usd || 0);
      const bTotal = (b.volume_in_usd || 0) + (b.volume_out_usd || 0);
      return bTotal - aTotal;
    });

    for (const cp of sorted.slice(0, 10)) {
      const volIn = cp.volume_in_usd || 0;
      const volOut = cp.volume_out_usd || 0;
      if (volIn > 1 || volOut > 1) {
        console.log(`${cp.counterparty_address?.slice(0, 12)}...`);
        console.log(`  Label: ${cp.counterparty_address_label || 'Unknown'}`);
        console.log(`  IN: $${volIn.toFixed(2)} | OUT: $${volOut.toFixed(2)}`);
        console.log(`  Interactions: ${cp.interaction_count}\n`);
      }
    }
  } catch (err) {
    console.log("Counterparty query failed:", (err as Error).message);
  }

  console.log("\n=== CONCLUSION ===");
  console.log(`Current v49j balance: 7.18 SOL (approaching 8-15 SOL threshold)`);
  console.log("Watch for outbound >5 SOL to fresh wallet = deployer funding signal");
}

main().catch(console.error);
