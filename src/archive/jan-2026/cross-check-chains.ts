/**
 * Cross-check: Does our deployer chain have any connection to QuantumCore chain?
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// QuantumCore chain
const QUANTUM_CHAIN = [
  "EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV", // Deployer
  "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66", // Related
  "4Cu3vB4b9RfoWJ4TLF9FnLFU2hYuMwFmq5dnTQNgMZYo", // Funder L1
  "FoPPNnDicrpgXFuiRVNqM3XKXt3fqgpZAWaKhnXipump", // Funder L2
];

// Our known chain
const OUR_CHAIN = [
  { name: "HYMt", address: WALLETS.POTENTIAL_FUNDER_HYMT },
  { name: "v49j", address: WALLETS.PRIMARY_FUNDER },
  { name: "37Xxihfs", address: WALLETS.ORIGINAL_DEPLOYER },
];

async function checkCounterparties(name: string, address: string) {
  console.log(`\n📍 Checking ${name} counterparties for Quantum chain...`);

  const counterparties = await client.getCounterparties({
    address,
    chain: "solana",
    date: DATES.RECENT_90D,
    group_by: "wallet",
    source_input: "Combined",
  });

  const matches: string[] = [];

  for (const cp of counterparties) {
    if (QUANTUM_CHAIN.includes(cp.counterparty_address)) {
      matches.push(
        `   🚨 MATCH: ${cp.counterparty_address.slice(0, 12)}... (${cp.interaction_count} interactions)`
      );
    }
  }

  if (matches.length > 0) {
    console.log(`   CONNECTIONS FOUND:`);
    for (const m of matches) {
      console.log(m);
    }
    return true;
  } else {
    console.log(`   No direct counterparty matches`);
    return false;
  }
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  CROSS-CHAIN CONNECTION CHECK");
  console.log("  Looking for links between our chain and QuantumCore chain");
  console.log("=".repeat(60));

  let anyConnection = false;

  for (const wallet of OUR_CHAIN) {
    const found = await checkCounterparties(wallet.name, wallet.address);
    if (found) anyConnection = true;
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n" + "=".repeat(60));
  if (anyConnection) {
    console.log("  🚨 CONNECTIONS EXIST BETWEEN CHAINS");
  } else {
    console.log("  ❌ NO DIRECT CONNECTIONS FOUND");
    console.log("  These appear to be separate entities");
  }
  console.log("=".repeat(60));
}

main().catch(console.error);
