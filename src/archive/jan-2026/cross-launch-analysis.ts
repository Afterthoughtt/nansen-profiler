import * as fs from 'fs';

const insiderData = JSON.parse(fs.readFileSync('./data/analysis/insider-hunt-v2.json', 'utf8'));
const rxrpData = JSON.parse(fs.readFileSync('./data/analysis/rxrp-first-30s-buyers.json', 'utf8'));

interface Buyer {
  address: string;
  totalBoughtUsd?: number;
  totalSpentUsd?: number;
  secondsAfterFirstTrade?: number;
}

// Collect all first 15 buyers per token
const tokenBuyers: Record<string, Set<string>> = {};

for (const token of insiderData.tokens) {
  const buyers: Buyer[] = token.firstMinuteBuyers?.slice(0, 15) || [];
  tokenBuyers[token.ticker] = new Set(buyers.map((b) => b.address));
}

// Add RXRP detailed data
tokenBuyers['RXRP_30s'] = new Set(rxrpData.buyers?.slice(0, 15).map((b: Buyer) => b.address) || []);

// Find wallets in multiple launches
const walletTokens: Record<string, string[]> = {};

for (const [ticker, buyers] of Object.entries(tokenBuyers)) {
  for (const wallet of buyers) {
    if (!walletTokens[wallet]) walletTokens[wallet] = [];
    walletTokens[wallet].push(ticker);
  }
}

const multiTokenWallets = Object.entries(walletTokens)
  .filter(([_, tokens]) => tokens.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('           CROSS-LAUNCH ANALYSIS: WALLETS IN MULTIPLE FIRST-15 LISTS');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

if (multiTokenWallets.length === 0) {
  console.log('No wallets found in multiple token first-15 buyer lists.');
} else {
  console.log(`Found ${multiTokenWallets.length} wallets appearing in multiple launches:\n`);
  for (const [wallet, tokens] of multiTokenWallets) {
    console.log(`🚨 ${wallet}`);
    console.log(`   Appeared in ${tokens.length} launches: ${tokens.join(', ')}\n`);
  }
}

// Now check all buyers (not just first 15) for cross-token patterns
console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('           EXTENDED ANALYSIS: ALL EARLY BUYERS ACROSS TOKENS');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const allTokenBuyers: Record<string, Set<string>> = {};
for (const token of insiderData.tokens) {
  const buyers: Buyer[] = token.firstMinuteBuyers || [];
  allTokenBuyers[token.ticker] = new Set(buyers.map((b) => b.address));
}

const allWalletTokens: Record<string, string[]> = {};
for (const [ticker, buyers] of Object.entries(allTokenBuyers)) {
  for (const wallet of buyers) {
    if (!allWalletTokens[wallet]) allWalletTokens[wallet] = [];
    allWalletTokens[wallet].push(ticker);
  }
}

const allMultiTokenWallets = Object.entries(allWalletTokens)
  .filter(([_, tokens]) => tokens.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`Found ${allMultiTokenWallets.length} wallets in multiple launches (all early buyers):\n`);
for (const [wallet, tokens] of allMultiTokenWallets.slice(0, 25)) {
  console.log(`🎯 ${wallet}`);
  console.log(`   ${tokens.length} tokens: ${tokens.join(', ')}\n`);
}
