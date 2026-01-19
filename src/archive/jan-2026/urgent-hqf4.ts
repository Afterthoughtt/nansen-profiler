/**
 * URGENT: Hqf4 just received 5.2 SOL - Is this our deployer?
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const HQF4 = "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT";
const FUNDER = "2FyeNLZMtKYUSJYp4tEiJwJgu351Lf7wRZ5aQfBTaVPd";

const KNOWN_CHAIN = new Map([
  [WALLETS.PRIMARY_FUNDER, "v49j"],
  [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs"],
  [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt"],
  [WALLETS.DEPLOYER_BZ2Y, "Bz2yexdH (RXRP)"],
  [WALLETS.ROOT, "ROOT"],
  [WALLETS.COINBASE_HOT_1, "Coinbase Hot 1"],
  [WALLETS.COINBASE_HOT_2, "Coinbase Hot 2"],
]);

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  🚨🚨🚨 URGENT: Hqf4 JUST FUNDED WITH 5.2 SOL");
  console.log("=".repeat(70));
  console.log(`\n  Recipient: ${HQF4}`);
  console.log(`  Funder: ${FUNDER}`);

  // 1. Check Hqf4 balance
  console.log("\n📍 Hqf4 CURRENT BALANCE");
  const balance = await client.getCurrentBalance({
    address: HQF4,
    chain: "solana",
  });

  const sol = balance.find((b) => b.token_symbol === "SOL");
  console.log(`  SOL: ${sol?.token_amount?.toFixed(4) || "0"}`);

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Check Hqf4 interaction count
  console.log("\n📍 Hqf4 INTERACTION COUNT");
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const counterparties = await client.getCounterparties({
    address: HQF4,
    chain: "solana",
    date: {
      from: monthAgo.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    group_by: "wallet",
    source_input: "Combined",
  });

  const totalInteractions = counterparties.reduce(
    (sum, cp) => sum + cp.interaction_count,
    0
  );
  console.log(`  Interactions (30d): ${totalInteractions}`);

  if (totalInteractions < 10) {
    console.log(`  ⚠️⚠️⚠️ VERY FRESH WALLET - DEPLOYER CANDIDATE!`);
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Trace Hqf4 funding chain
  console.log("\n📍 FUNDING CHAIN TRACE (Looking for Coinbase/v49j/ROOT)");
  let currentAddress = HQF4;
  const chain: string[] = [];

  for (let level = 0; level < 6; level++) {
    const shortAddr = currentAddress.slice(0, 16);
    const knownName = KNOWN_CHAIN.get(currentAddress);

    // Check for labels
    const related = await client.getRelatedWallets({
      address: currentAddress,
      chain: "solana",
      pagination: { page: 1, per_page: 10 },
    });

    const ffRel = related.find((r) => r.relation === "First Funder");
    const labels = ffRel?.labels?.join(", ") || "";

    if (knownName) {
      console.log(`  Level ${level}: ${shortAddr}... 🚨 ${knownName}`);
      chain.push(`${shortAddr} (${knownName})`);
      break;
    }

    if (labels.toLowerCase().includes("coinbase")) {
      console.log(`  Level ${level}: ${shortAddr}... 🚨 COINBASE!`);
      chain.push(`${shortAddr} (COINBASE)`);
      break;
    }

    console.log(`  Level ${level}: ${shortAddr}...`);
    if (labels) console.log(`           Labels: ${labels}`);
    chain.push(shortAddr);

    if (!ffRel) {
      console.log(`  Level ${level + 1}: (chain ends)`);
      break;
    }
    currentAddress = ffRel.address;

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n  Chain: ${chain.join(" → ")}`);

  // 4. Check if funder (2FyeNLZM) connects to our chain
  console.log("\n📍 CHECKING FUNDER: 2FyeNLZM");
  const funderRelated = await client.getRelatedWallets({
    address: FUNDER,
    chain: "solana",
    pagination: { page: 1, per_page: 10 },
  });

  for (const rw of funderRelated) {
    const known = KNOWN_CHAIN.get(rw.address);
    const flag = known ? ` 🚨 ${known}` : "";
    console.log(`  ${rw.relation}: ${rw.address.slice(0, 16)}...${flag}`);
    if (rw.labels?.length) {
      console.log(`     Labels: ${rw.labels.join(", ")}`);
    }
  }

  // VERDICT
  console.log("\n" + "=".repeat(70));
  console.log("  VERDICT");
  console.log("=".repeat(70));

  const isFresh = totalInteractions < 20;
  const hasEnoughSol = (sol?.token_amount || 0) >= 5;

  if (isFresh && hasEnoughSol) {
    console.log(`
  🚨🚨🚨 POSSIBLE DEPLOYER ALERT! 🚨🚨🚨

  Hqf4 has:
  - ${sol?.token_amount?.toFixed(4)} SOL (enough to deploy)
  - ${totalInteractions} interactions (FRESH)
  - Just funded NOW

  ADD TO WATCHLIST IMMEDIATELY:
  ${HQF4}

  CHECK IF CONNECTED TO OUR CHAIN (v49j/ROOT/Coinbase)
`);
  } else {
    console.log(`
  Wallet funded but may not be deployer:
  - Balance: ${sol?.token_amount?.toFixed(4)} SOL
  - Interactions: ${totalInteractions}
`);
  }
}

main().catch(console.error);
