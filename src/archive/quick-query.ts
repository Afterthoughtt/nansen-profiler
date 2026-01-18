/**
 * Quick Query Script - For ad-hoc investigations
 * Run with: npx tsx src/quick-query.ts
 *
 * Modify the main() function for your query, then run.
 * This file is gitignored for temporary use.
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS, DATES } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

async function main() {
  // Other 2-token insiders from Jan 3 analysis
  const insiders = [
    { name: 'FSbvLdrK (XRPEP3 + RXRP)', addr: WALLETS.INSIDER_FSBV },
    { name: '2NuAgVk3 (TrollXRP + RXRP)', addr: WALLETS.INSIDER_2NUA },
  ];

  // Chain wallets to check for connections
  const chainAddrs = new Set([
    WALLETS.ROOT,
    WALLETS.PRIMARY_FUNDER,
    WALLETS.ORIGINAL_DEPLOYER,
    WALLETS.COINBASE_HOT_1,
    WALLETS.COINBASE_HOT_2,
  ]);

  console.log('=== 2-Token Insider Investigation ===\n');
  console.log('Looking for connections to our deployer chain...\n');

  for (const insider of insiders) {
    console.log(`--- ${insider.name} ---`);
    console.log(`Address: ${insider.addr}\n`);

    // 1. Get balance
    const balance = await client.getCurrentBalance({
      address: insider.addr,
      chain: 'solana',
    });
    await delay(1500);

    const sol = balance.find(b => b.token_symbol === 'SOL');
    console.log(`Balance: ${sol?.token_amount?.toFixed(4) || 0} SOL\n`);

    // 2. Trace funding chain
    console.log('Funding Chain:');
    let currentAddr = insider.addr;
    let chainConnection = false;

    for (let level = 0; level < 4; level++) {
      const related = await client.getRelatedWallets({
        address: currentAddr,
        chain: 'solana',
      });
      await delay(1500);

      const ff = related.find(w => w.relation === 'First Funder');
      if (!ff) {
        console.log(`  Level ${level}: ${currentAddr.slice(0,8)}... -> END`);
        break;
      }

      const isChain = chainAddrs.has(ff.address);
      const marker = isChain ? ' [CHAIN CONNECTION!]' : '';
      console.log(`  Level ${level}: ${currentAddr.slice(0,8)}... -> ${ff.address.slice(0,8)}... (${ff.address_label || 'unlabeled'})${marker}`);

      if (isChain) {
        chainConnection = true;
        break;
      }
      currentAddr = ff.address;
    }

    // 3. Check counterparties for chain wallets
    console.log('\nChecking counterparties for chain wallet interactions...');
    const cps = await client.getCounterparties({
      address: insider.addr,
      chain: 'solana',
      date: { from: '2025-01-01T00:00:00Z', to: '2026-12-31T00:00:00Z' },
    });
    await delay(1500);

    const chainCps = cps.filter(c => chainAddrs.has(c.counterparty_address));
    if (chainCps.length > 0) {
      console.log(`  FOUND ${chainCps.length} chain wallet counterparties!`);
      for (const cp of chainCps) {
        console.log(`    ${cp.counterparty_address.slice(0,8)}... | $${cp.total_volume_usd?.toFixed(0)} | ${cp.counterparty_address_label || ''}`);
      }
      chainConnection = true;
    } else {
      console.log('  No chain wallet counterparties found.');
    }

    // Verdict
    console.log(`\nVerdict: ${chainConnection ? 'CONNECTED to deployer chain!' : 'INDEPENDENT (no chain link)'}\n`);
    console.log('---\n');
  }

  console.log('=== Done ===');
}

main().catch(console.error);
