/**
 * H3qSndFC Investigation - Threat #6
 *
 * Goal: Determine if the 3-token insider (H3qSndFC) is connected to the deployer chain.
 *
 * If connected → Their wallet becomes a leading indicator
 * If independent → Acknowledge as competitor, monitor competitively only
 *
 * Investigation steps:
 * 1. Trace H3qSndFC funding chain (3+ levels)
 * 2. Map their counterparties
 * 3. Check for shared funders/counterparties with v49j/37Xxihfs
 * 4. Generate connection assessment
 */

import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";
import { delay, formatAddress } from "./utils.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Known chain wallets to check for connections
const CHAIN_WALLETS = new Set([
  WALLETS.ROOT,
  WALLETS.PRIMARY_FUNDER, // v49j
  WALLETS.ORIGINAL_DEPLOYER, // 37Xxihfs
  WALLETS.COINBASE_HOT_1,
  WALLETS.COINBASE_HOT_2,
  WALLETS.DEPLOYER_D7MS,
  WALLETS.DEPLOYER_DBMX,
  WALLETS.DEPLOYER_BZ2Y,
  WALLETS.DEPLOYER_GUCX,
]);

interface FundingLevel {
  address: string;
  label?: string;
  level: number;
}

interface InvestigationResult {
  fundingChain: FundingLevel[];
  counterparties: Array<{
    address: string;
    label?: string;
    volume_usd: number;
    direction: "in" | "out" | "both";
  }>;
  chainConnections: string[];
  connectionScore: number;
  assessment: string;
}

async function traceFundingChain(
  address: string,
  maxLevels: number = 4
): Promise<FundingLevel[]> {
  const chain: FundingLevel[] = [];
  let currentAddress = address;

  for (let level = 0; level < maxLevels; level++) {
    console.log(`  Level ${level}: ${formatAddress(currentAddress)}`);

    const relatedWallets = await client.getRelatedWallets({
      address: currentAddress,
      chain: "solana",
    });

    await delay(1500);

    const firstFunder = relatedWallets.find((w) => w.relation === "First Funder");

    if (!firstFunder) {
      console.log(`    -> No First Funder found (end of chain)`);
      break;
    }

    chain.push({
      address: firstFunder.address,
      label: firstFunder.address_label || undefined,
      level: level + 1,
    });

    console.log(
      `    -> First Funder: ${formatAddress(firstFunder.address)} ${firstFunder.address_label ? `(${firstFunder.address_label})` : ""}`
    );

    // Check if this funder is in our chain
    if (CHAIN_WALLETS.has(firstFunder.address)) {
      console.log(`    -> CHAIN CONNECTION FOUND!`);
      break;
    }

    currentAddress = firstFunder.address;
  }

  return chain;
}

async function getCounterpartyConnections(address: string): Promise<
  Array<{
    address: string;
    label?: string;
    volume_usd: number;
    direction: "in" | "out" | "both";
  }>
> {
  const counterparties = await client.getCounterparties({
    address,
    chain: "solana",
    date: DATES.FULL_HISTORY,
  });

  return counterparties
    .filter((c) => c.total_volume_usd > 50) // Filter noise
    .map((c) => ({
      address: c.counterparty_address,
      label: c.counterparty_address_label || undefined,
      volume_usd: c.total_volume_usd,
      direction:
        c.volume_in_usd > c.volume_out_usd * 2
          ? "in"
          : c.volume_out_usd > c.volume_in_usd * 2
            ? "out"
            : "both",
    }))
    .sort((a, b) => b.volume_usd - a.volume_usd)
    .slice(0, 20);
}

function assessConnection(
  fundingChain: FundingLevel[],
  counterparties: Array<{ address: string; label?: string }>,
  chainConnections: string[]
): { score: number; assessment: string } {
  let score = 0;
  const reasons: string[] = [];

  // Check funding chain for chain wallets
  for (const level of fundingChain) {
    if (CHAIN_WALLETS.has(level.address)) {
      score += 40;
      reasons.push(`Funding chain includes chain wallet at level ${level.level}`);
    }
  }

  // Check counterparties for chain wallets
  const chainCounterparties = counterparties.filter((c) =>
    CHAIN_WALLETS.has(c.address)
  );
  if (chainCounterparties.length > 0) {
    score += 20 * chainCounterparties.length;
    reasons.push(`${chainCounterparties.length} chain wallet(s) in counterparties`);
  }

  // Check for Coinbase funders (same origin as deployer chain)
  const coinbaseFunders = fundingChain.filter(
    (l) => l.label?.includes("Coinbase") || l.label?.includes("coinbase")
  );
  if (coinbaseFunders.length > 0) {
    score += 15;
    reasons.push("Funded via Coinbase (same origin as deployer chain)");
  }

  // Check for deployer-related labels
  const deployerLabels = counterparties.filter(
    (c) =>
      c.label?.includes("Deployer") ||
      c.label?.includes("pump.fun") ||
      c.label?.includes("Token")
  );
  if (deployerLabels.length > 0) {
    score += 10;
    reasons.push("Counterparties include deployer/token-related wallets");
  }

  // Generate assessment
  let assessment: string;
  if (score >= 60) {
    assessment = "CONNECTED - High confidence link to deployer chain. Use as leading indicator.";
  } else if (score >= 30) {
    assessment = "POSSIBLY CONNECTED - Some chain overlap. Monitor as secondary signal.";
  } else if (score >= 10) {
    assessment = "WEAK CONNECTION - Minor overlap. Likely coincidental.";
  } else {
    assessment = "INDEPENDENT - No chain connection found. Competitor only.";
  }

  if (reasons.length > 0) {
    assessment += "\n  Reasons: " + reasons.join("; ");
  }

  return { score, assessment };
}

async function main() {
  console.log("=".repeat(70));
  console.log(" H3qSndFC INVESTIGATION - Threat #6");
  console.log("=".repeat(70));
  console.log(`\nTarget: ${WALLETS.INSIDER_H3Q}`);
  console.log("Known: 3-token insider (XRPEP3, TrollXRP, RainXRP)\n");

  // Step 1: Get current balance
  console.log("--- STEP 1: Current Status ---\n");
  const balance = await client.getCurrentBalance({
    address: WALLETS.INSIDER_H3Q,
    chain: "solana",
  });
  await delay(1500);

  const solBalance = balance.find((b) => b.token_symbol === "SOL");
  console.log(`Current SOL Balance: ${solBalance?.token_amount?.toFixed(4) || "0"} SOL`);
  console.log(`Total Value: $${balance.reduce((sum, b) => sum + (b.value_usd || 0), 0).toFixed(2)}`);

  // Step 2: Trace funding chain
  console.log("\n--- STEP 2: Funding Chain Trace (3+ levels) ---\n");
  const fundingChain = await traceFundingChain(WALLETS.INSIDER_H3Q, 4);

  // Step 3: Get counterparties
  console.log("\n--- STEP 3: Counterparty Analysis ---\n");
  const counterparties = await getCounterpartyConnections(WALLETS.INSIDER_H3Q);
  await delay(1500);

  console.log(`Found ${counterparties.length} significant counterparties:\n`);
  for (const cp of counterparties.slice(0, 10)) {
    const chainMarker = CHAIN_WALLETS.has(cp.address) ? " [CHAIN!]" : "";
    console.log(
      `  ${formatAddress(cp.address)} | ${cp.direction.toUpperCase()} $${cp.volume_usd.toFixed(0)} | ${cp.label || ""}${chainMarker}`
    );
  }

  // Step 4: Find chain connections
  console.log("\n--- STEP 4: Chain Connection Check ---\n");
  const chainConnections: string[] = [];

  // Check funding chain
  for (const level of fundingChain) {
    if (CHAIN_WALLETS.has(level.address)) {
      chainConnections.push(`Funding Level ${level.level}: ${formatAddress(level.address)}`);
    }
  }

  // Check counterparties
  for (const cp of counterparties) {
    if (CHAIN_WALLETS.has(cp.address)) {
      chainConnections.push(`Counterparty: ${formatAddress(cp.address)} (${cp.label || "chain wallet"})`);
    }
  }

  if (chainConnections.length === 0) {
    console.log("No direct chain connections found.");
  } else {
    console.log("Chain connections found:");
    for (const conn of chainConnections) {
      console.log(`  - ${conn}`);
    }
  }

  // Step 5: Assessment
  console.log("\n--- STEP 5: Connection Assessment ---\n");
  const { score, assessment } = assessConnection(
    fundingChain,
    counterparties,
    chainConnections
  );

  console.log(`Connection Score: ${score}/100`);
  console.log(`Assessment: ${assessment}`);

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log(" INVESTIGATION SUMMARY");
  console.log("=".repeat(70));

  const result: InvestigationResult = {
    fundingChain,
    counterparties,
    chainConnections,
    connectionScore: score,
    assessment,
  };

  console.log(`\nH3qSndFC (${formatAddress(WALLETS.INSIDER_H3Q)})`);
  console.log(`  Funding Chain Depth: ${fundingChain.length} levels`);
  console.log(`  Total Counterparties: ${counterparties.length}`);
  console.log(`  Chain Connections: ${chainConnections.length}`);
  console.log(`  Connection Score: ${score}/100`);
  console.log(`\nVerdict: ${assessment.split("\n")[0]}`);

  if (score >= 30) {
    console.log("\n  ACTION: Add to primary monitoring alongside deployer chain.");
  } else {
    console.log("\n  ACTION: Monitor competitively only. Not a leading indicator.");
  }

  console.log("\n" + "=".repeat(70));

  // Save results
  const fs = await import("fs");
  const outputPath = "data/analysis/h3qsndfc-investigation.json";
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(console.error);
