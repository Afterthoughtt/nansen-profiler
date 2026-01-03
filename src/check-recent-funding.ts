/**
 * Check recent funding from key wallets
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const WALLETS_TO_CHECK = [
  {
    name: "37Xxihfs",
    address: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
    role: "Original Deployer",
  },
  {
    name: "v49j",
    address: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
    role: "Primary Funder",
  },
];

async function checkOutboundTransfers(
  name: string,
  address: string,
  role: string
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Checking ${name} (${role})`);
  console.log(`Address: ${address}`);
  console.log(`${"=".repeat(60)}`);

  const response = await client.getTransactions({
    chain: "solana",
    address: address,
    date: {
      from: "2025-11-30",
      to: "2026-01-04",
    },
    pagination: {
      page: 1,
      per_page: 100,
    },
  });
  const txs = response.data || [];

  // Filter for SOL transfers OUT from this wallet
  const outbound = txs
    .filter((tx) => tx.from_address === address)
    .filter((tx) => tx.token_symbol === "SOL")
    .filter((tx) => parseFloat(tx.amount) > 0.1) // Only significant transfers
    .sort(
      (a, b) =>
        new Date(b.block_timestamp).getTime() -
        new Date(a.block_timestamp).getTime()
    );

  console.log(`\nOutbound SOL transfers > 0.1 SOL since Nov 30:\n`);

  if (outbound.length === 0) {
    console.log("  No significant outbound SOL transfers found.");
  } else {
    for (const tx of outbound.slice(0, 15)) {
      const date = new Date(tx.block_timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const toShort = tx.to_address.slice(0, 12);
      console.log(`  ${date}: ${tx.amount} SOL -> ${toShort}...`);
    }
  }

  // Also check for inbound funding
  const inbound = txs
    .filter((tx) => tx.to_address === address)
    .filter((tx) => tx.token_symbol === "SOL")
    .filter((tx) => parseFloat(tx.amount) > 0.1)
    .sort(
      (a, b) =>
        new Date(b.block_timestamp).getTime() -
        new Date(a.block_timestamp).getTime()
    );

  console.log(`\nInbound SOL transfers > 0.1 SOL since Nov 30:\n`);

  if (inbound.length === 0) {
    console.log("  No significant inbound SOL transfers found.");
  } else {
    for (const tx of inbound.slice(0, 10)) {
      const date = new Date(tx.block_timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const fromShort = tx.from_address.slice(0, 12);
      console.log(`  ${date}: ${tx.amount} SOL <- ${fromShort}...`);
    }
  }
}

async function main() {
  console.log("RECENT FUNDING CHECK - Looking for deployer funding activity");
  console.log("Date range: Nov 30, 2025 - Jan 4, 2026\n");

  for (const wallet of WALLETS_TO_CHECK) {
    await checkOutboundTransfers(wallet.name, wallet.address, wallet.role);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("ANALYSIS COMPLETE");
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
