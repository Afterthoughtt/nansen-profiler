/**
 * Investigate specific wallets - check connection to deployer chain
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const TARGETS = [
  { name: "9dcT4Cw", address: "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66" },
  { name: "4MjUnWu", address: "4MjUnWuKAoSo1hogJ9ftQVCv7ywKffYyJx3u2tJcEiWH" },
];

const KNOWN_CHAIN = [
  { name: "v49j", address: WALLETS.PRIMARY_FUNDER },
  { name: "37Xxihfs", address: WALLETS.ORIGINAL_DEPLOYER },
  { name: "HYMt", address: WALLETS.POTENTIAL_FUNDER_HYMT },
  { name: "ROOT", address: WALLETS.ROOT },
  { name: "Coinbase Hot 1", address: WALLETS.COINBASE_HOT_1 },
  { name: "Coinbase Hot 2", address: WALLETS.COINBASE_HOT_2 },
];

async function investigateWallet(name: string, address: string) {
  console.log("\n" + "=".repeat(70));
  console.log(`  INVESTIGATING: ${name}`);
  console.log(`  ${address}`);
  console.log("=".repeat(70));

  // 1. Current Balance
  console.log("\n📍 BALANCE");
  const balance = await client.getCurrentBalance({
    address,
    chain: "solana",
  });

  const sol = balance.find((b) => b.token_symbol === "SOL");
  const usdc = balance.find((b) => b.token_symbol === "USDC");
  console.log(`   SOL: ${sol?.token_amount?.toFixed(4) || "0"}`);
  if (usdc && usdc.token_amount && usdc.token_amount > 0.01) {
    console.log(`   USDC: ${usdc.token_amount.toFixed(2)}`);
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 2. First Funder
  console.log("\n📍 FIRST FUNDER");
  const firstFunder = await client.findFirstFunder(address);
  console.log(`   ${firstFunder || "Unknown"}`);

  // Check if First Funder is in our chain
  const chainMatch = KNOWN_CHAIN.find((w) => w.address === firstFunder);
  if (chainMatch) {
    console.log(`   🚨 MATCH: ${chainMatch.name} (DEPLOYER CHAIN)`);
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Related Wallets
  console.log("\n📍 RELATED WALLETS");
  const related = await client.getRelatedWallets({
    address,
    chain: "solana",
    pagination: { page: 1, per_page: 20 },
  });

  for (const rw of related) {
    const labels = rw.labels?.join(", ") || "No label";
    const match = KNOWN_CHAIN.find((w) => w.address === rw.address);
    const flag = match ? ` 🚨 ${match.name}` : "";
    console.log(`   ${rw.relation}: ${rw.address.slice(0, 12)}...${flag}`);
    if (labels !== "No label") {
      console.log(`      Labels: ${labels}`);
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 4. Transaction count / freshness
  console.log("\n📍 INTERACTION COUNT");
  const counterparties = await client.getCounterparties({
    address,
    chain: "solana",
    date: DATES.RECENT_90D,
    group_by: "wallet",
    source_input: "Combined",
  });

  const totalInteractions = counterparties.reduce(
    (sum, cp) => sum + cp.interaction_count,
    0
  );
  console.log(`   Total interactions (90d): ${totalInteractions}`);
  console.log(`   Unique counterparties: ${counterparties.length}`);

  if (totalInteractions < 10) {
    console.log(`   ⚠️ FRESH WALLET`);
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 5. Recent transactions (look for inbound SOL)
  console.log("\n📍 RECENT TRANSACTIONS (SOL > 0.5)");
  const txResult = await client.getTransactions({
    address,
    chain: "solana",
    date: DATES.RECENT_90D,
    pagination: { page: 1, per_page: 50 },
  });

  const transactions = txResult.data || [];
  let fundingFound = false;

  for (const tx of transactions) {
    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        if (
          recv.token_symbol === "SOL" &&
          recv.token_amount &&
          recv.token_amount > 0.5
        ) {
          const from = recv.from_address || "unknown";
          const fromMatch = KNOWN_CHAIN.find((w) => w.address === from);
          const flag = fromMatch ? ` 🚨 ${fromMatch.name}` : "";
          console.log(
            `   ${tx.block_timestamp}: ${recv.token_amount.toFixed(4)} SOL from ${from.slice(0, 12)}...${flag}`
          );
          fundingFound = true;
        }
      }
    }
  }

  if (!fundingFound) {
    console.log(`   No significant SOL inflows found`);
  }

  // Summary
  console.log("\n" + "-".repeat(70));
  console.log("  SUMMARY:");
  console.log(`  - Balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL`);
  console.log(`  - First Funder: ${firstFunder?.slice(0, 12) || "Unknown"}...`);
  console.log(`  - Interactions: ${totalInteractions}`);
  console.log(
    `  - Chain Connected: ${chainMatch ? "YES - " + chainMatch.name : "Unknown"}`
  );
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  WALLET INVESTIGATION");
  console.log("  Checking connection to deployer chain");
  console.log("=".repeat(70));

  for (const target of TARGETS) {
    await investigateWallet(target.name, target.address);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n" + "=".repeat(70));
  console.log("  INVESTIGATION COMPLETE");
  console.log("=".repeat(70));
}

main().catch(console.error);
