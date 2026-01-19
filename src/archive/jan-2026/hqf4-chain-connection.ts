/**
 * Check if Hqf4 has direct counterparty connections to our dev chain
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const HQF4 = "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT";

const DEV_CHAIN = [
  { name: "v49j", address: WALLETS.PRIMARY_FUNDER },
  { name: "37Xxihfs", address: WALLETS.ORIGINAL_DEPLOYER },
  { name: "HYMt", address: WALLETS.POTENTIAL_FUNDER_HYMT },
  { name: "Bz2yexdH", address: WALLETS.DEPLOYER_BZ2Y },
  { name: "ROOT", address: WALLETS.ROOT },
  { name: "EbMRVzXVRH8y", address: "EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV" },
  { name: "9dcT4Cw", address: "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66" },
];

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  Hqf4 CONNECTION TO DEV CHAIN?");
  console.log("=".repeat(70));

  const today = new Date();
  const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Get Hqf4 counterparties
  console.log("\n📍 Hqf4 COUNTERPARTIES (Full History)");
  const counterparties = await client.getCounterparties({
    address: HQF4,
    chain: "solana",
    date: {
      from: yearAgo.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    group_by: "wallet",
    source_input: "Combined",
  });

  console.log(`  Total counterparties: ${counterparties.length}`);

  // Check for dev chain wallets
  console.log("\n📍 CHECKING FOR DEV CHAIN CONNECTIONS:");
  let foundConnection = false;

  for (const dev of DEV_CHAIN) {
    const match = counterparties.find(
      (cp) => cp.counterparty_address === dev.address
    );
    if (match) {
      foundConnection = true;
      console.log(`  🚨 ${dev.name}: ${match.interaction_count} interactions, $${match.volume_usd?.toFixed(0) || "?"}`);
    }
  }

  if (!foundConnection) {
    console.log("  No direct counterparty connections to dev chain wallets");
  }

  // Also check 2FyeNLZM (funder) counterparties
  console.log("\n📍 2FyeNLZM (Hqf4's Funder) COUNTERPARTIES:");
  await new Promise((r) => setTimeout(r, 1500));

  const funderCp = await client.getCounterparties({
    address: "2FyeNLZMtKYUSJYp4tEiJwJgu351Lf7wRZ5aQfBTaVPd",
    chain: "solana",
    date: {
      from: yearAgo.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    group_by: "wallet",
    source_input: "Combined",
  });

  for (const dev of DEV_CHAIN) {
    const match = funderCp.find((cp) => cp.counterparty_address === dev.address);
    if (match) {
      console.log(`  🚨 ${dev.name}: ${match.interaction_count} interactions`);
    }
  }

  // Check recent transactions for XRP-themed activity
  console.log("\n📍 Hqf4 TOKEN HISTORY (XRP-themed?):");
  await new Promise((r) => setTimeout(r, 1500));

  const txResult = await client.getTransactions({
    address: HQF4,
    chain: "solana",
    date: {
      from: "2025-06-01",
      to: today.toISOString().split("T")[0],
    },
    pagination: { page: 1, per_page: 50 },
  });

  const txs = txResult.data || [];

  const xrpTokens = new Set<string>();
  for (const tx of txs) {
    const allTokens = [...(tx.tokens_received || []), ...(tx.tokens_sent || [])];
    for (const t of allTokens) {
      if (t.token_symbol?.toLowerCase().includes("xrp") ||
          t.token_symbol?.toLowerCase().includes("ripple")) {
        xrpTokens.add(t.token_symbol || "unknown");
      }
    }
  }

  if (xrpTokens.size > 0) {
    console.log(`  🚨 XRP-THEMED TOKENS TRADED: ${[...xrpTokens].join(", ")}`);
  } else {
    console.log("  No XRP-themed tokens in recent history");
  }

  // VERDICT
  console.log("\n" + "=".repeat(70));
  console.log("  VERDICT");
  console.log("=".repeat(70));
  console.log(`
  Hqf4:
  - Traded on TROLLXRP and XRPEP3 (our dev's tokens)
  - Different Coinbase chain (not v49j/ROOT)
  - Just funded 5.2 SOL NOW

  CONCLUSION: ${foundConnection ?
    "🚨 CONNECTED TO DEV - POSSIBLE BUNDLE/INSIDER WALLET" :
    "Likely an independent trader who follows XRP tokens, NOT our deployer"}

  WATCH LEVEL: ${foundConnection ? "HIGH" : "MEDIUM"}
`);
}

main().catch(console.error);
