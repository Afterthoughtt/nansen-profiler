/**
 * Trace HRcur4's First Funder chain to check for deployer connection
 * First Funder: Ciwuet8g (GOATGUY Token Deployer)
 */

import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { WALLETS } from './config/index.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const CHAIN_WALLETS = [
  WALLETS.PRIMARY_FUNDER,    // v49j
  WALLETS.ORIGINAL_DEPLOYER, // 37Xxihfs
  WALLETS.ROOT,              // ROOT
  WALLETS.COINBASE_HOT_1,    // Coinbase
  WALLETS.COINBASE_HOT_2,    // Coinbase 2
];

async function traceChain(startAddress: string, depth: number = 0): Promise<void> {
  if (depth > 4) {
    console.log("  ".repeat(depth) + "Max depth reached");
    return;
  }

  const related = await client.getRelatedWallets({
    address: startAddress,
    chain: "solana"
  });

  const firstFunder = related.find(w => w.relation === "First Funder");

  if (!firstFunder) {
    console.log("  ".repeat(depth) + `${startAddress.slice(0, 10)}... → No First Funder found`);
    return;
  }

  const label = firstFunder.address_label || "Unknown";
  const isChainWallet = CHAIN_WALLETS.includes(firstFunder.address);

  console.log("  ".repeat(depth) + `${startAddress.slice(0, 10)}... → ${firstFunder.address.slice(0, 10)}... (${label})`);

  if (isChainWallet) {
    console.log("  ".repeat(depth + 1) + "🚨🚨🚨 CONNECTED TO DEPLOYER CHAIN!");
    return;
  }

  if (label.includes("Coinbase") || label.includes("Binance") || label.includes("OKX")) {
    console.log("  ".repeat(depth + 1) + "→ Exchange origin (end of trace)");
    return;
  }

  await delay(2000);
  await traceChain(firstFunder.address, depth + 1);
}

async function main() {
  console.log("=== TRACING HRcur4 FIRST FUNDER CHAIN ===\n");
  console.log("Target: HRcur4Ggby1SVYCJyafw8sypaAnKXEG61Lv4foEgqnWb");
  console.log("Known First Funder: Ciwuet8g (GOATGUY Token Deployer)\n");

  console.log("Tracing funding chain (looking for connection to v49j/37Xxihfs/ROOT)...\n");

  await traceChain("HRcur4Ggby1SVYCJyafw8sypaAnKXEG61Lv4foEgqnWb");

  console.log("\n" + "=".repeat(60));
  console.log("If chain connects to v49j, 37Xxihfs, ROOT, or Coinbase:");
  console.log("→ HRcur4 could be part of the entity's wallet network");
  console.log("→ USDC accumulation could convert to SOL for deployment");
  console.log("=".repeat(60));
}

main().catch(console.error);
