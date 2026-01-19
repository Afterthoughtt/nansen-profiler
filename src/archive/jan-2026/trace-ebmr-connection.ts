/**
 * Trace EbMRVzXVRH8y connection to the main dev chain
 * Why is it distributing COIN during launch window?
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const EBMR = "EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV";
const DISTRIBUTOR = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  EbMRVzXVRH8y <-> DEV CHAIN CONNECTION");
  console.log("=".repeat(70));

  // 1. Check EbMRVzXVRH8y First Funder - does it trace to v49j/ROOT?
  console.log("\n📍 TRACING EbMRVzXVRH8y FUNDING CHAIN");

  let currentAddress = EBMR;
  const chain: string[] = [];

  const KNOWN = new Map([
    [WALLETS.PRIMARY_FUNDER, "v49j"],
    [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs"],
    [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt"],
    [WALLETS.ROOT, "ROOT"],
    [WALLETS.COINBASE_HOT_1, "Coinbase Hot 1"],
    [WALLETS.COINBASE_HOT_2, "Coinbase Hot 2"],
    [DISTRIBUTOR, "9dcT4Cw"],
    [EBMR, "EbMRVzXVRH8y"],
  ]);

  for (let level = 0; level < 8; level++) {
    const shortAddr = currentAddress.slice(0, 16);
    const knownName = KNOWN.get(currentAddress);

    const related = await client.getRelatedWallets({
      address: currentAddress,
      chain: "solana",
      pagination: { page: 1, per_page: 10 },
    });

    const ff = related.find((r) => r.relation === "First Funder");
    const labels = ff?.labels?.join(", ") || "";

    if (knownName) {
      console.log(`  Level ${level}: ${shortAddr}... = ${knownName}`);
      chain.push(knownName);
    } else {
      console.log(`  Level ${level}: ${shortAddr}...`);
      chain.push(shortAddr);
    }

    if (labels) console.log(`           Labels: ${labels}`);

    if (labels.toLowerCase().includes("coinbase")) {
      console.log(`  Level ${level + 1}: COINBASE (chain ends)`);
      chain.push("COINBASE");
      break;
    }

    if (!ff) {
      console.log(`  Level ${level + 1}: (no First Funder)`);
      break;
    }

    currentAddress = ff.address;
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n  CHAIN: ${chain.join(" → ")}`);

  // 2. Check if EbMRVzXVRH8y has direct counterparty connection to v49j/HYMt
  console.log("\n📍 EbMRVzXVRH8y COUNTERPARTIES (checking for v49j, HYMt, 37Xxihfs)");
  await new Promise((r) => setTimeout(r, 1500));

  const today = new Date();
  const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

  const counterparties = await client.getCounterparties({
    address: EBMR,
    chain: "solana",
    date: {
      from: yearAgo.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    group_by: "wallet",
    source_input: "Combined",
  });

  const devWallets = [
    { name: "v49j", address: WALLETS.PRIMARY_FUNDER },
    { name: "HYMt", address: WALLETS.POTENTIAL_FUNDER_HYMT },
    { name: "37Xxihfs", address: WALLETS.ORIGINAL_DEPLOYER },
    { name: "ROOT", address: WALLETS.ROOT },
    { name: "9dcT4Cw", address: DISTRIBUTOR },
  ];

  let foundConnection = false;
  for (const dev of devWallets) {
    const match = counterparties.find((cp) => cp.counterparty_address === dev.address);
    if (match) {
      foundConnection = true;
      console.log(`  🚨 ${dev.name}: ${match.interaction_count} interactions, $${match.volume_usd?.toFixed(0) || "?"}`);
    }
  }

  if (!foundConnection) {
    console.log("  No direct counterparty connections to main dev chain");
  }

  // 3. Check 9dcT4Cw connection to v49j/HYMt
  console.log("\n📍 9dcT4Cw COUNTERPARTIES (checking for v49j, HYMt, 37Xxihfs)");
  await new Promise((r) => setTimeout(r, 1500));

  const dist9dc = await client.getCounterparties({
    address: DISTRIBUTOR,
    chain: "solana",
    date: {
      from: yearAgo.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    group_by: "wallet",
    source_input: "Combined",
  });

  for (const dev of devWallets) {
    if (dev.address === DISTRIBUTOR) continue;
    const match = dist9dc.find((cp) => cp.counterparty_address === dev.address);
    if (match) {
      console.log(`  🚨 ${dev.name}: ${match.interaction_count} interactions`);
    }
  }

  // 4. What tokens has EbMRVzXVRH8y deployed?
  console.log("\n📍 EbMRVzXVRH8y TOKEN DEPLOYMENTS");
  await new Promise((r) => setTimeout(r, 1500));

  const ebmrRelated = await client.getRelatedWallets({
    address: EBMR,
    chain: "solana",
    pagination: { page: 1, per_page: 30 },
  });

  const deployments = ebmrRelated.filter((r) =>
    r.relation.includes("Deploy") || r.relation.includes("Creator")
  );

  if (deployments.length > 0) {
    console.log(`  Found ${deployments.length} deployments:`);
    for (const d of deployments) {
      console.log(`    ${d.relation}: ${d.address}`);
    }
  } else {
    console.log("  No direct token deployments found");
  }

  // VERDICT
  console.log("\n" + "=".repeat(70));
  console.log("  ASSESSMENT");
  console.log("=".repeat(70));
  console.log(`
  EbMRVzXVRH8y is distributing COIN tokens via 9dcT4Cw during the
  launch window. This is NOT a coincidence.

  POSSIBLE ROLES:

  1. BUNDLE WALLET PREP: These 345+ wallets receiving COIN could be
     the same wallets that will buy the NEW pump.fun token at launch.
     The COIN/THE tokens are a SEPARATE reward/loyalty system.

  2. BACKUP LAUNCH: If pump.fun fails or gets front-run, the dev has
     COIN/THE already distributed for an instant custom SPL launch.

  3. DUAL TOKEN SYSTEM: Quantum X might have TWO tokens - one on
     pump.fun (new) and COIN/THE for holders/staking/rewards.

  KEY QUESTION: Are the wallets receiving COIN the same wallets
  that will bundle the pump.fun launch?

  IMPLICATION: These COIN recipients might be your COMPETITION at
  launch - they're the dev's bundle wallets with SOL ready to buy.
`);
}

main().catch(console.error);
