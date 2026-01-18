/**
 * Find the full address for HRcur4 from v49j transactions
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

async function main() {
  console.log("=== Finding HRcur4 address from v49j transactions ===\n");

  // Get all v49j transactions in January
  const txns = await client.getTransactions({
    address: WALLETS.PRIMARY_FUNDER,
    chain: "solana",
    date: { from: "2026-01-01T00:00:00Z", to: "2026-01-17T23:59:59Z" }
  });

  const txList = txns.data || [];
  console.log(`Total v49j transactions: ${txList.length}\n`);

  // Find any address starting with HRcur4 or similar
  const allAddresses = new Set<string>();

  for (const tx of txList) {
    const sent = tx.tokens_sent || [];
    const received = tx.tokens_received || [];

    for (const s of sent) {
      if (s.to_address) allAddresses.add(s.to_address);
    }
    for (const r of received) {
      if (r.from_address) allAddresses.add(r.from_address);
    }
  }

  console.log("Looking for addresses starting with 'HR'...\n");
  for (const addr of allAddresses) {
    if (addr.startsWith("HR")) {
      console.log(`Found: ${addr}`);
    }
  }

  console.log("\n--- ALL v49j USDC OUTBOUND (Jan 2026) ---\n");

  for (const tx of txList) {
    const sent = tx.tokens_sent || [];

    for (const s of sent) {
      if (s.token_symbol === "USDC" && Number(s.token_amount) > 1) {
        console.log(`${tx.block_timestamp}`);
        console.log(`  USDC OUT: ${Number(s.token_amount).toFixed(2)} to ${s.to_address}`);
        console.log("");
      }
    }
  }
}

main().catch(console.error);
