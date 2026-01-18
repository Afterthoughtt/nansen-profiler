/**
 * Investigate v49j's recent funding (7 SOL increase Jan 8-15)
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

async function main() {
  console.log('=== V49J FUNDING INVESTIGATION ===\n');
  console.log('v49j went from 0.0272 SOL (Jan 8) to 7.0352 SOL (Jan 15)');
  console.log('Investigating source of ~7 SOL...\n');

  // 1. Get recent transactions
  console.log('--- Recent Transactions (Jan 2026) ---\n');
  const result = await client.getTransactions({
    chain: 'solana',
    address: WALLETS.PRIMARY_FUNDER, // v49j
    date: { from: '2026-01-01T00:00:00Z', to: '2026-01-16T00:00:00Z' }
  });

  const txns = result.data || [];
  console.log(`Found ${txns.length} transactions in January 2026\n`);

  for (const tx of txns) {
    const received = tx.tokens_received || [];
    const sent = tx.tokens_sent || [];

    // Show SOL transfers
    const solReceived = received.find(t => t.token_symbol === 'SOL');
    const solSent = sent.find(t => t.token_symbol === 'SOL');

    if (solReceived && Number(solReceived.token_amount) > 0.01) {
      console.log('RECEIVED SOL:');
      console.log(`  Date: ${tx.block_timestamp}`);
      console.log(`  Amount: ${solReceived.token_amount} SOL`);
      console.log(`  From: ${solReceived.from_address}`);
      console.log('');
    }

    if (solSent && Number(solSent.token_amount) > 0.01) {
      console.log('SENT SOL:');
      console.log(`  Date: ${tx.block_timestamp}`);
      console.log(`  Amount: ${solSent.token_amount} SOL`);
      console.log(`  To: ${solSent.to_address}`);
      console.log('');
    }
  }

  await delay(2000);

  // 2. Get counterparties for January
  console.log('\n--- January Counterparties ---\n');
  try {
    const cps = await client.getCounterparties({
      address: WALLETS.PRIMARY_FUNDER,
      chain: 'solana',
      date: { from: '2026-01-08T00:00:00Z', to: '2026-01-16T00:00:00Z' }
    });

    console.log(`Found ${cps.length} counterparties\n`);

    // Sort by volume in
    const sorted = cps.sort((a, b) => (b.volume_in_usd || 0) - (a.volume_in_usd || 0));

    for (const cp of sorted.slice(0, 10)) {
      if ((cp.volume_in_usd || 0) > 10 || (cp.volume_out_usd || 0) > 10) {
        console.log(`Address: ${cp.counterparty_address}`);
        console.log(`  Label: ${cp.counterparty_address_label || 'Unknown'}`);
        console.log(`  Volume IN: $${cp.volume_in_usd?.toFixed(2) || 0}`);
        console.log(`  Volume OUT: $${cp.volume_out_usd?.toFixed(2) || 0}`);
        console.log(`  Interactions: ${cp.interaction_count}`);
        console.log('');
      }
    }
  } catch (err) {
    console.log('Counterparty query failed (may be timeout), checking transactions instead...');
  }

  // 3. Check who funded the wallet
  await delay(2000);
  console.log('\n--- First Funder Check ---\n');
  const related = await client.getRelatedWallets({
    address: WALLETS.PRIMARY_FUNDER,
    chain: 'solana',
  });

  const ff = related.find(w => w.relation === 'First Funder');
  if (ff) {
    console.log(`First Funder: ${ff.address}`);
    console.log(`Label: ${ff.address_label || 'Unknown'}`);
  }

  console.log('\n=== CONCLUSION ===');
  console.log('v49j has 7+ SOL - approaching deployer funding threshold (8-15 SOL)');
  console.log('This is a PRE-LAUNCH SIGNAL for Jan 18.');
}

main().catch(console.error);
