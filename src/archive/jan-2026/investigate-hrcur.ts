/**
 * Investigate HRcur4Ggby1SVYCJyafw8sypaAnKXEG61Lv4foEgqnWb
 * v49j sent ~$200 USDC to this wallet Jan 14-16
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const TARGET = "HRcur4Ggby1SVYCJyafw8sypaAnKXEG61Lv4foEgqnWb";

const KNOWN_CHAIN = new Map([
  [WALLETS.PRIMARY_FUNDER, "v49j"],
  [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs"],
  [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt"],
  [WALLETS.DEPLOYER_BZ2Y, "Bz2yexdH (RXRP)"],
  [WALLETS.ROOT, "ROOT"],
  [WALLETS.COINBASE_HOT_1, "Coinbase Hot 1"],
  [WALLETS.COINBASE_HOT_2, "Coinbase Hot 2"],
  ["EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV", "EbMRVzXVRH8y (Quantum)"],
  ["9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66", "9dcT4Cw"],
  ["E41iCFHDphDFCcnPfjkeuhPwYxSaRP2WKMvSUr8hVzTf", "E41i (v49j USDC)"],
]);

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  INVESTIGATING: HRcur4Ggby...");
  console.log("  " + TARGET);
  console.log("  (Received ~$200 USDC from v49j on Jan 14-16)");
  console.log("=".repeat(70));

  // 1. Balance
  console.log("\n📍 BALANCE");
  const balance = await client.getCurrentBalance({
    address: TARGET,
    chain: "solana",
  });

  const sol = balance.find((b) => b.token_symbol === "SOL");
  const usdc = balance.find((b) => b.token_symbol === "USDC");
  console.log(`  SOL: ${sol?.token_amount?.toFixed(4) || "0"}`);
  if (usdc && usdc.token_amount && usdc.token_amount > 0.01) {
    console.log(`  USDC: ${usdc.token_amount.toFixed(2)}`);
  }

  // Show other tokens
  for (const b of balance) {
    if (
      b.token_symbol !== "SOL" &&
      b.token_symbol !== "USDC" &&
      b.token_amount &&
      b.token_amount > 0
    ) {
      console.log(`  ${b.token_symbol}: ${b.token_amount}`);
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 2. First Funder
  console.log("\n📍 FIRST FUNDER");
  const firstFunder = await client.findFirstFunder(TARGET);
  const ffKnown = firstFunder ? KNOWN_CHAIN.get(firstFunder) : null;
  console.log(`  ${firstFunder || "Unknown"}`);
  if (ffKnown) {
    console.log(`  🚨 MATCH: ${ffKnown}`);
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Related wallets
  console.log("\n📍 RELATED WALLETS");
  const related = await client.getRelatedWallets({
    address: TARGET,
    chain: "solana",
    pagination: { page: 1, per_page: 20 },
  });

  for (const rw of related) {
    const known = KNOWN_CHAIN.get(rw.address);
    const flag = known ? ` 🚨 ${known}` : "";
    const labels = rw.labels?.join(", ") || "";
    console.log(`  ${rw.relation}: ${rw.address.slice(0, 16)}...${flag}`);
    if (labels) console.log(`     Labels: ${labels}`);
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 4. Interaction count
  console.log("\n📍 INTERACTION COUNT");
  const counterparties = await client.getCounterparties({
    address: TARGET,
    chain: "solana",
    date: DATES.RECENT_90D,
    group_by: "wallet",
    source_input: "Combined",
  });

  const totalInteractions = counterparties.reduce(
    (sum, cp) => sum + cp.interaction_count,
    0
  );
  console.log(`  Total interactions (90d): ${totalInteractions}`);
  console.log(`  Unique counterparties: ${counterparties.length}`);

  if (totalInteractions < 20) {
    console.log(`  ⚠️ FRESH WALLET - Could be deployer candidate`);
  } else if (totalInteractions < 100) {
    console.log(`  ⚠️ LOW activity wallet`);
  }

  // Check for known chain in counterparties
  console.log("\n📍 KNOWN CHAIN CONNECTIONS");
  let foundConnections = false;
  for (const cp of counterparties) {
    const known = KNOWN_CHAIN.get(cp.counterparty_address);
    if (known) {
      foundConnections = true;
      console.log(
        `  🚨 ${known}: ${cp.interaction_count} interactions, $${cp.volume_usd?.toFixed(0) || "?"}`
      );
    }
  }

  // Also check for v49j specifically
  const v49jMatch = counterparties.find(
    (cp) => cp.counterparty_address === WALLETS.PRIMARY_FUNDER
  );
  if (v49jMatch) {
    console.log(
      `  🚨 v49j (counterparty): ${v49jMatch.interaction_count} interactions, $${v49jMatch.volume_usd?.toFixed(0) || "?"}`
    );
    foundConnections = true;
  }

  if (!foundConnections) {
    console.log("  No direct connections to known chain wallets");
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 5. Recent transactions
  console.log("\n📍 RECENT TRANSACTIONS");
  const txResult = await client.getTransactions({
    address: TARGET,
    chain: "solana",
    date: DATES.RECENT_90D,
    pagination: { page: 1, per_page: 30 },
  });

  const transactions = txResult.data || [];
  console.log(`  Found ${transactions.length} transactions\n`);

  for (const tx of transactions.slice(0, 15)) {
    console.log(`  ${tx.block_timestamp}`);

    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        if (recv.token_amount && Math.abs(recv.token_amount) > 0.001) {
          const from = recv.from_address || "unknown";
          const fromKnown = KNOWN_CHAIN.get(from);
          const flag = fromKnown ? ` 🚨 ${fromKnown}` : "";
          console.log(
            `     RECV: ${recv.token_amount?.toFixed(4)} ${recv.token_symbol} from ${from.slice(0, 12)}...${flag}`
          );
        }
      }
    }

    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        if (sent.token_amount && Math.abs(sent.token_amount) > 0.001) {
          const to = sent.to_address || "unknown";
          const toKnown = KNOWN_CHAIN.get(to);
          const flag = toKnown ? ` 🚨 ${toKnown}` : "";
          console.log(
            `     SENT: ${sent.token_amount?.toFixed(4)} ${sent.token_symbol} to ${to.slice(0, 12)}...${flag}`
          );
        }
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));

  const isDeployerCandidate =
    totalInteractions < 50 && (sol?.token_amount || 0) > 1;
  console.log(`
  Address: ${TARGET}
  Balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL, ${usdc?.token_amount?.toFixed(2) || "0"} USDC
  First Funder: ${firstFunder?.slice(0, 16) || "Unknown"}...
  Interactions: ${totalInteractions}
  v49j Connection: USDC transfers (Jan 14-16)

  Deployer Candidate: ${isDeployerCandidate ? "⚠️ POSSIBLE" : "❌ NO (too active or low balance)"}
`);
}

main().catch(console.error);
