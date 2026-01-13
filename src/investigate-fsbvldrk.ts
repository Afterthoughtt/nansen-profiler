/**
 * FSbvLdrK Deep Investigation
 *
 * 2-token insider (XRPEP3 + RXRP) - noted as "Coinbase connected" in JAN_2026 notes.
 * This script saves the full funding chain trace.
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DEPLOYER_CHAIN, DATES } from "./config/index.js";
import { delay, formatAddress } from "./utils.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const TARGET = WALLETS.INSIDER_FSBV;
const COINBASE_WALLETS = new Set([WALLETS.COINBASE_HOT_1, WALLETS.COINBASE_HOT_2]);
const DEPLOYER_CHAIN_SET = new Set(DEPLOYER_CHAIN);

interface FundingLevel {
  address: string;
  label?: string;
  firstFunder?: string;
  isDeployerChain: boolean;
  isCoinbase: boolean;
}

interface InvestigationResult {
  target: string;
  runTime: string;
  fundingChain: FundingLevel[];
  chainDepth: number;
  connectionScore: number;
  verdict: "CONNECTED" | "INDEPENDENT" | "UNKNOWN";
  verdictReason: string;
  currentBalance?: number;
  counterpartySummary?: {
    totalCounterparties: number;
    topByVolume: { address: string; volume: number; label?: string }[];
  };
}

async function traceFundingChain(address: string, maxDepth: number = 4): Promise<FundingLevel[]> {
  const chain: FundingLevel[] = [];
  let current = address;

  for (let depth = 0; depth < maxDepth; depth++) {
    console.log(`  Level ${depth}: ${formatAddress(current)}`);

    const isDeployerChain = DEPLOYER_CHAIN_SET.has(current);
    const isCoinbase = COINBASE_WALLETS.has(current);

    const related = await client.getRelatedWallets({
      address: current,
      chain: "solana",
      pagination: { page: 1, per_page: 20 },
    });

    const firstFunderRel = related.find((r) => r.relation === "First Funder");
    const label = firstFunderRel?.address_label;

    chain.push({
      address: current,
      label,
      firstFunder: firstFunderRel?.address,
      isDeployerChain,
      isCoinbase,
    });

    if (isDeployerChain || isCoinbase) {
      console.log(`    → Found ${isDeployerChain ? "DEPLOYER CHAIN" : "COINBASE"} connection!`);
      break;
    }

    if (!firstFunderRel?.address) {
      console.log(`    → No First Funder found, stopping`);
      break;
    }

    console.log(`    First Funder: ${formatAddress(firstFunderRel.address)}`);
    current = firstFunderRel.address;
    await delay(2000);
  }

  return chain;
}

async function main() {
  console.log("=".repeat(60));
  console.log("FSbvLdrK DEEP INVESTIGATION");
  console.log("=".repeat(60));
  console.log(`\nTarget: ${TARGET}`);

  // Trace funding chain
  console.log("\n=== Tracing Funding Chain ===");
  const fundingChain = await traceFundingChain(TARGET);

  // Check for connections
  const hasDeployerConnection = fundingChain.some((l) => l.isDeployerChain);
  const hasCoinbaseConnection = fundingChain.some((l) => l.isCoinbase);

  let verdict: "CONNECTED" | "INDEPENDENT" | "UNKNOWN" = "UNKNOWN";
  let verdictReason = "";
  let connectionScore = 0;

  if (hasDeployerConnection) {
    verdict = "CONNECTED";
    verdictReason = "Direct connection to deployer chain";
    connectionScore = 100;
  } else if (hasCoinbaseConnection) {
    verdict = "CONNECTED";
    verdictReason = "Funded via Coinbase (same origin as deployer chain)";
    connectionScore = 80;
  } else {
    verdict = "INDEPENDENT";
    verdictReason = "No connection to deployer chain or Coinbase";
    connectionScore = 0;
  }

  // Get current balance
  console.log("\n=== Checking Current Balance ===");
  const balances = await client.getCurrentBalance({ address: TARGET, chain: "solana" });
  const solBalance = balances.find((b) => b.token_symbol === "SOL")?.token_amount || 0;
  console.log(`  SOL Balance: ${solBalance.toFixed(4)}`);

  // Get counterparties summary
  console.log("\n=== Fetching Counterparties ===");
  await delay(2000);
  const counterparties = await client.getCounterparties({
    address: TARGET,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    source_input: "Combined",
    group_by: "wallet",
    pagination: { page: 1, per_page: 10 },
  });

  const topByVolume = counterparties
    .map((cp) => ({
      address: cp.counterparty_address,
      volume: (cp.total_volume_usd || 0),
      label: cp.counterparty_address_label?.[0],
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  const result: InvestigationResult = {
    target: TARGET,
    runTime: new Date().toISOString(),
    fundingChain,
    chainDepth: fundingChain.length,
    connectionScore,
    verdict,
    verdictReason,
    currentBalance: solBalance,
    counterpartySummary: {
      totalCounterparties: counterparties.length,
      topByVolume,
    },
  };

  // Save results
  writeFileSync(
    "data/analysis/fsbvldrk-investigation.json",
    JSON.stringify(result, null, 2)
  );

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("INVESTIGATION RESULTS");
  console.log("=".repeat(60));

  console.log(`\nVerdict: ${verdict}`);
  console.log(`Reason: ${verdictReason}`);
  console.log(`Connection Score: ${connectionScore}/100`);
  console.log(`Current Balance: ${solBalance.toFixed(4)} SOL`);

  console.log("\n📊 Funding Chain:");
  for (let i = 0; i < fundingChain.length; i++) {
    const level = fundingChain[i];
    const flags = [];
    if (level.isDeployerChain) flags.push("DEPLOYER");
    if (level.isCoinbase) flags.push("COINBASE");
    const flagStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
    console.log(`  ${i}: ${level.address}${flagStr}`);
    if (level.label) console.log(`     Label: ${level.label}`);
  }

  console.log("\n📁 Results saved to: data/analysis/fsbvldrk-investigation.json");
  console.log("=".repeat(60));
}

main().catch(console.error);
