/**
 * RXRP Deployer (Bz2yexdH) Counterparties Analysis
 *
 * Analyzes who the RXRP deployer interacted with:
 * - Funding sources (already known: 37Xxihfs, v49j)
 * - Recipients of SOL from deployer
 * - Interaction patterns
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DEPLOYER_CHAIN, DATES } from "./config/index.js";
import { delay, formatAddress } from "./utils.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// RXRP Deployer
const DEPLOYER = WALLETS.DEPLOYER_BZ2Y;

interface CounterpartyAnalysis {
  address: string;
  label?: string;
  interactionCount: number;
  volumeInUsd: number;
  volumeOutUsd: number;
  netFlow: number;
  direction: "INBOUND" | "OUTBOUND" | "BOTH";
  isKnownChainWallet: boolean;
  firstFunder?: string;
}

interface DeployerCounterpartyReport {
  deployer: string;
  analysisDate: string;
  dateRange: { from: string; to: string };
  totalCounterparties: number;
  fundingSources: CounterpartyAnalysis[];
  recipients: CounterpartyAnalysis[];
  knownChainWallets: string[];
  unknownWallets: CounterpartyAnalysis[];
}

async function main() {
  console.log("=".repeat(60));
  console.log("RXRP DEPLOYER COUNTERPARTIES ANALYSIS");
  console.log("=".repeat(60));
  console.log(`\nDeployer: ${DEPLOYER}`);

  // Get counterparties for a date range covering RXRP launch
  const dateRange = {
    from: "2025-11-01",
    to: "2025-12-31",
  };

  console.log(`\nDate range: ${dateRange.from} to ${dateRange.to}`);

  console.log("\n=== Fetching counterparties ===");
  const counterparties = await client.getCounterparties({
    address: DEPLOYER,
    chain: "solana",
    date: dateRange,
    source_input: "Combined",
    group_by: "wallet",
    pagination: { page: 1, per_page: 100 },
  });

  console.log(`Found ${counterparties.length} counterparties`);

  // Analyze each counterparty
  const analyzed: CounterpartyAnalysis[] = [];
  const deployerChainSet = new Set(DEPLOYER_CHAIN);

  for (const cp of counterparties) {
    const volumeIn = cp.volume_in_usd || 0;
    const volumeOut = cp.volume_out_usd || 0;
    const netFlow = volumeIn - volumeOut;

    let direction: "INBOUND" | "OUTBOUND" | "BOTH" = "BOTH";
    if (volumeIn > 0 && volumeOut === 0) direction = "INBOUND";
    else if (volumeOut > 0 && volumeIn === 0) direction = "OUTBOUND";

    const isKnownChainWallet = deployerChainSet.has(cp.counterparty_address);

    analyzed.push({
      address: cp.counterparty_address,
      label: cp.counterparty_address_label?.[0],
      interactionCount: cp.interaction_count,
      volumeInUsd: volumeIn,
      volumeOutUsd: volumeOut,
      netFlow,
      direction,
      isKnownChainWallet,
    });
  }

  // Sort by total volume
  analyzed.sort(
    (a, b) =>
      Math.abs(b.volumeInUsd) +
      Math.abs(b.volumeOutUsd) -
      (Math.abs(a.volumeInUsd) + Math.abs(a.volumeOutUsd))
  );

  // Categorize
  const fundingSources = analyzed.filter(
    (cp) => cp.direction === "INBOUND" || (cp.direction === "BOTH" && cp.netFlow > 0)
  );
  const recipients = analyzed.filter(
    (cp) => cp.direction === "OUTBOUND" || (cp.direction === "BOTH" && cp.netFlow < 0)
  );
  const unknownWallets = analyzed.filter((cp) => !cp.isKnownChainWallet);

  // Check First Funder for top unknown wallets
  console.log("\n=== Checking First Funders for unknown recipients ===");
  const topUnknownRecipients = recipients
    .filter((r) => !r.isKnownChainWallet)
    .slice(0, 10);

  for (const recipient of topUnknownRecipients) {
    console.log(`  Checking ${formatAddress(recipient.address)}...`);
    try {
      const firstFunder = await client.findFirstFunder(recipient.address);
      recipient.firstFunder = firstFunder || undefined;
      await delay(1500);
    } catch (error) {
      console.error(`  Error checking ${recipient.address}:`, error);
    }
  }

  const report: DeployerCounterpartyReport = {
    deployer: DEPLOYER,
    analysisDate: new Date().toISOString(),
    dateRange,
    totalCounterparties: counterparties.length,
    fundingSources,
    recipients,
    knownChainWallets: analyzed
      .filter((cp) => cp.isKnownChainWallet)
      .map((cp) => cp.address),
    unknownWallets,
  };

  // Save results
  writeFileSync(
    "data/analysis/rxrp-deployer-counterparties.json",
    JSON.stringify(report, null, 2)
  );

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));

  console.log(`\nTotal counterparties: ${report.totalCounterparties}`);
  console.log(`Funding sources: ${fundingSources.length}`);
  console.log(`Recipients: ${recipients.length}`);
  console.log(`Known chain wallets: ${report.knownChainWallets.length}`);

  console.log("\n📥 FUNDING SOURCES (SOL flowing INTO deployer):");
  for (const cp of fundingSources.slice(0, 10)) {
    const flag = cp.isKnownChainWallet ? "✅" : "  ";
    console.log(
      `${flag} ${formatAddress(cp.address, 12)} | $${cp.volumeInUsd.toFixed(0).padStart(6)} in | ${cp.label || ""}`
    );
  }

  console.log("\n📤 RECIPIENTS (SOL flowing OUT from deployer):");
  for (const cp of recipients.slice(0, 10)) {
    const flag = cp.isKnownChainWallet ? "✅" : "  ";
    console.log(
      `${flag} ${formatAddress(cp.address, 12)} | $${cp.volumeOutUsd.toFixed(0).padStart(6)} out | ${cp.label || ""}`
    );
    if (cp.firstFunder) {
      console.log(`     First Funder: ${formatAddress(cp.firstFunder, 12)}`);
    }
  }

  if (report.knownChainWallets.length > 0) {
    console.log("\n✅ Known chain wallets found in counterparties:");
    for (const addr of report.knownChainWallets) {
      console.log(`  ${addr}`);
    }
  }

  console.log(
    "\n📁 Results saved to: data/analysis/rxrp-deployer-counterparties.json"
  );
  console.log("=".repeat(60));
}

main().catch(console.error);
