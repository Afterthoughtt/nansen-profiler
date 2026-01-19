/**
 * Check current status of all known insiders for Jan 18 launch
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

interface Insider {
  name: string;
  addr: string;
  status: 'CONNECTED' | 'INDEPENDENT' | 'WHALE';
}

const insiders: Insider[] = [
  { name: 'H3qSndFC (3-token insider)', addr: WALLETS.INSIDER_H3Q, status: 'INDEPENDENT' },
  { name: 'FSbvLdrK (2-token insider)', addr: WALLETS.INSIDER_FSBV, status: 'CONNECTED' },
  { name: '2NuAgVk3 (2-token whale)', addr: WALLETS.INSIDER_2NUA, status: 'WHALE' },
];

async function main() {
  console.log('=== INSIDER STATUS CHECK FOR JAN 18 ===\n');
  console.log('Date: ' + new Date().toISOString());
  console.log('');

  for (const insider of insiders) {
    console.log(`--- ${insider.name} ---`);
    console.log(`Status: ${insider.status}`);
    console.log(`Address: ${insider.addr}\n`);

    // Get current balance
    const balance = await client.getCurrentBalance({
      address: insider.addr,
      chain: 'solana',
    });
    await delay(1500);

    const sol = balance.find(b => b.token_symbol === 'SOL');
    const solAmount = sol?.token_amount || 0;
    console.log(`SOL Balance: ${Number(solAmount).toFixed(4)} SOL`);

    // Risk assessment
    if (Number(solAmount) > 5) {
      console.log(`⚠️  HIGH BALANCE - May be preparing to buy!`);
    } else if (Number(solAmount) > 1) {
      console.log(`ℹ️  Moderate balance - Active trader`);
    } else {
      console.log(`✓  Low balance - Not immediately active`);
    }

    // Check recent activity
    try {
      const txnResult = await client.getTransactions({
        chain: 'solana',
        address: insider.addr,
        date: { from: '2026-01-01T00:00:00Z', to: '2026-01-16T00:00:00Z' }
      });
      await delay(1500);

      const txns = txnResult.data || [];
      console.log(`Jan 2026 Transactions: ${txns.length}`);

      if (txns.length > 0) {
        const lastTx = txns[0];
        console.log(`Last Active: ${lastTx.block_timestamp}`);
      }
    } catch (err) {
      console.log('Transaction query failed');
    }

    console.log('\n---\n');
  }

  console.log('=== SUMMARY ===\n');
  console.log('Priority Order for Jan 18:');
  console.log('1. FSbvLdrK - CONNECTED to deployer chain (secondary indicator)');
  console.log('2. H3qSndFC - 3-token insider (competitor - fast buyer)');
  console.log('3. 2NuAgVk3 - Whale (may move market)');
}

main().catch(console.error);
