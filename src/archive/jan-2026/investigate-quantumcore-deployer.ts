/**
 * URGENT: Investigate QuantumCore deployer
 * EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const DEPLOYER = "EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV";

const KNOWN_CHAIN = new Map([
  [WALLETS.PRIMARY_FUNDER, "v49j (Primary Funder)"],
  [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs (Original Deployer)"],
  [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt (NEW Funder)"],
  [WALLETS.ROOT, "ROOT"],
  [WALLETS.COINBASE_HOT_1, "Coinbase Hot 1"],
  [WALLETS.COINBASE_HOT_2, "Coinbase Hot 2"],
  [WALLETS.DEPLOYER_D7MS, "D7Ms (XRPEP3)"],
  [WALLETS.DEPLOYER_DBMX, "DBmx (TrollXRP)"],
  [WALLETS.DEPLOYER_BZ2Y, "Bz2y (RXRP)"],
  [WALLETS.DEPLOYER_GUCX, "GUCX (Sleeper)"],
]);

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  🚨 QUANTUMCORE DEPLOYER INVESTIGATION");
  console.log("  " + DEPLOYER);
  console.log("=".repeat(70));

  // 1. Balance
  console.log("\n📍 BALANCE");
  const balance = await client.getCurrentBalance({
    address: DEPLOYER,
    chain: "solana",
  });
  const sol = balance.find((b) => b.token_symbol === "SOL");
  console.log(`   SOL: ${sol?.token_amount?.toFixed(4) || "0"}`);

  // Check for other tokens
  for (const b of balance) {
    if (b.token_symbol !== "SOL" && b.token_amount && b.token_amount > 0) {
      console.log(`   ${b.token_symbol}: ${b.token_amount}`);
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 2. First Funder chain (5 levels)
  console.log("\n📍 FUNDING CHAIN (5 levels)");
  let currentAddress = DEPLOYER;
  const chain: string[] = [];

  for (let level = 0; level < 5; level++) {
    const shortAddr = currentAddress.slice(0, 16);
    const knownName = KNOWN_CHAIN.get(currentAddress);

    if (knownName) {
      console.log(`   Level ${level}: ${shortAddr}... 🚨 ${knownName}`);
      chain.push(`${shortAddr} (${knownName})`);
      console.log(`\n   ✅ CONNECTED TO DEPLOYER CHAIN!`);
      break;
    }

    console.log(`   Level ${level}: ${shortAddr}...`);
    chain.push(shortAddr);

    await new Promise((r) => setTimeout(r, 1500));

    const firstFunder = await client.findFirstFunder(currentAddress);
    if (!firstFunder) {
      console.log(`   Level ${level + 1}: (chain ends)`);
      break;
    }

    currentAddress = firstFunder;
  }

  console.log(`\n   Chain: ${chain.join(" → ")}`);

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Related wallets
  console.log("\n📍 RELATED WALLETS");
  const related = await client.getRelatedWallets({
    address: DEPLOYER,
    chain: "solana",
    pagination: { page: 1, per_page: 30 },
  });

  for (const rw of related) {
    const knownName = KNOWN_CHAIN.get(rw.address);
    const flag = knownName ? ` 🚨 ${knownName}` : "";
    console.log(`   ${rw.relation}: ${rw.address.slice(0, 16)}...${flag}`);
    if (rw.labels && rw.labels.length > 0) {
      console.log(`      Labels: ${rw.labels.join(", ")}`);
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 4. Counterparties - look for chain connections
  console.log("\n📍 COUNTERPARTIES (checking for chain connections)");
  const counterparties = await client.getCounterparties({
    address: DEPLOYER,
    chain: "solana",
    date: DATES.RECENT_90D,
    group_by: "wallet",
    source_input: "Combined",
  });

  console.log(`   Found ${counterparties.length} counterparties\n`);

  let chainConnections: string[] = [];

  for (const cp of counterparties.slice(0, 20)) {
    const knownName = KNOWN_CHAIN.get(cp.counterparty_address);
    if (knownName) {
      chainConnections.push(
        `${knownName}: ${cp.counterparty_address} (${cp.interaction_count} interactions, $${cp.volume_usd?.toFixed(0) || "?"})`
      );
    }

    const shortAddr = cp.counterparty_address.slice(0, 16);
    const flag = knownName ? ` 🚨 ${knownName}` : "";
    const labels = cp.labels?.join(", ") || "";

    console.log(`   ${shortAddr}...${flag}`);
    console.log(`      Interactions: ${cp.interaction_count} | Volume: $${cp.volume_usd?.toFixed(0) || "?"}`);
    if (labels) {
      console.log(`      Labels: ${labels}`);
    }
  }

  if (chainConnections.length > 0) {
    console.log("\n🚨🚨🚨 CHAIN CONNECTIONS FOUND:");
    for (const conn of chainConnections) {
      console.log(`   - ${conn}`);
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 5. Recent transactions
  console.log("\n📍 RECENT TRANSACTIONS");
  const txResult = await client.getTransactions({
    address: DEPLOYER,
    chain: "solana",
    date: DATES.RECENT_90D,
    pagination: { page: 1, per_page: 30 },
  });

  const transactions = txResult.data || [];
  console.log(`   Found ${transactions.length} transactions\n`);

  for (const tx of transactions.slice(0, 15)) {
    console.log(`   ${tx.block_timestamp}`);

    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        const to = sent.to_address || "unknown";
        const toKnown = KNOWN_CHAIN.get(to);
        const flag = toKnown ? ` 🚨 ${toKnown}` : "";
        console.log(
          `      SENT: ${sent.token_amount?.toFixed(4) || "?"} ${sent.token_symbol} → ${to.slice(0, 12)}...${flag}`
        );
      }
    }

    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        const from = recv.from_address || "unknown";
        const fromKnown = KNOWN_CHAIN.get(from);
        const flag = fromKnown ? ` 🚨 ${fromKnown}` : "";
        console.log(
          `      RECV: ${recv.token_amount?.toFixed(4) || "?"} ${recv.token_symbol} ← ${from.slice(0, 12)}...${flag}`
        );
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`
  Deployer: EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV
  Token: QuantumCore (7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho)
  Balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL
  Chain Connections: ${chainConnections.length > 0 ? "YES" : "NOT FOUND YET"}

  Next: Check if this deployer received funds from HYMt, v49j, or 37Xxihfs
`);
}

main().catch(console.error);
