import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import type {
  WalletAnalysis,
  InvestigationReport,
  RelatedWallet,
  WalletLabel,
} from "./types.js";
import { writeFileSync } from "fs";
import { join } from "path";

const DEPLOYERS = [
  {
    address: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
    type: "original",
    launchDates: ["2025-06-15", "2025-07-20", "2025-08-24"],
  },
  {
    address: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    type: "fresh",
    launchDates: ["2025-09-28"],
  },
  {
    address: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
    type: "fresh",
    launchDates: ["2025-11-02"],
  },
];

/**
 * Step 1: Target Address Label Lookup
 * Get labels for a deployer wallet
 */
async function getLabels(
  client: NansenClient,
  address: string,
): Promise<WalletLabel[]> {
  console.log("  Step 1: Looking up wallet labels...");
  try {
    const labels = await client.getWalletLabels(address);
    if (labels.length > 0) {
      console.log(
        `  ✅ Found ${labels.length} labels:`,
        labels.map((l) => l.label).join(", "),
      );
    } else {
      console.log("  ℹ️  No labels found for this wallet");
    }
    return labels;
  } catch (error) {
    console.log("  ⚠️  Labels endpoint not available or error occurred");
    return [];
  }
}

/**
 * Step 2: Initial Relationship Discovery
 * Find "First Funder" and other special relationships
 */
async function findRelatedWallets(
  client: NansenClient,
  address: string,
): Promise<RelatedWallet[]> {
  console.log("  Step 2: Finding related wallets...");
  try {
    const relatedWallets = await client.getRelatedWallets({
      address,
      chain: "solana",
      pagination: { page: 1, per_page: 20 },
    });

    const firstFunder = relatedWallets.find(
      (rw) => rw.relation === "First Funder",
    );
    if (firstFunder) {
      console.log(
        `  ✅ First Funder found: ${firstFunder.address.substring(0, 8)}...`,
      );
    } else {
      console.log("  ⚠️  No First Funder relationship found");
    }

    return relatedWallets;
  } catch (error) {
    console.log("  ⚠️  Related wallets endpoint error:", error);
    return [];
  }
}

/**
 * Step 3: Counterparty Analysis (for validation)
 * Get high-interaction addresses
 */
async function analyzeCounterparties(client: NansenClient, address: string) {
  console.log("  Step 3: Analyzing counterparties for validation...");
  const counterparties = await client.getCounterparties({
    address,
    chain: "solana",
    group_by: "wallet",
    source_input: "Combined",
    date: {
      from: "2025-01-01",
      to: "2025-12-31",
    },
    filters: {
      total_volume_usd: { min: 100 },
    },
    order_by: [{ field: "total_volume_usd", direction: "DESC" }],
  });

  const fundingSources = counterparties
    .filter((cp) => (cp.volume_in_usd || 0) > 0)
    .slice(0, 5);

  console.log(`  ✅ Top ${fundingSources.length} funding sources identified`);
  fundingSources.forEach((source, idx) => {
    console.log(
      `    ${idx + 1}. ${source.counterparty_address.substring(0, 8)}... ` +
        `Volume In: $${source.volume_in_usd?.toFixed(2) || 0} ` +
        `(${source.interaction_count} interactions)`,
    );
  });
  return counterparties;
}

/**
 * Step 4: Multi-Level Clustering
 * Trace funding chain by recursively finding First Funders
 */
async function traceFundingChain(
  client: NansenClient,
  address: string,
  maxDepth: number = 3,
): Promise<string[]> {
  console.log("  Step 4: Tracing multi-level funding chain...");
  const chain: string[] = [address];

  for (let level = 0; level < maxDepth; level++) {
    const currentWallet = chain[chain.length - 1];
    console.log(
      `    Level ${level}: Checking ${currentWallet.substring(0, 8)}...`,
    );

    const firstFunder = await client.findFirstFunder(currentWallet);
    if (firstFunder && !chain.includes(firstFunder)) {
      chain.push(firstFunder);
      console.log(
        `    ✅ Found upstream funder: ${firstFunder.substring(0, 8)}...`,
      );
    } else {
      console.log(`    ⛔ Reached end of funding chain`);
      break;
    }

    // Wait a bit to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log(
    `  ✅ Complete funding chain (${chain.length} levels):`,
    chain.map((w) => w.substring(0, 8)).join(" ← "),
  );
  return chain.reverse(); // root first
}

/**
 * Analyze a single deployer wallet using Related Wallets methodology
 */
async function analyzeWallet(
  client: NansenClient,
  address: string,
  type: string,
  launchDates: string[],
): Promise<WalletAnalysis> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 Analyzing ${type} deployer: ${address}`);
  console.log(`${"=".repeat(80)}\n`);

  // Step 1: Labels
  const labels = await getLabels(client, address);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Step 2: Related Wallets
  const relatedWallets = await findRelatedWallets(client, address);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Step 3: Counterparties (for validation)
  const counterparties = await analyzeCounterparties(client, address);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Step 4: Multi-level funding chain
  const fundingChain = await traceFundingChain(client, address, 3);

  // Get some transactions for additional context
  console.log("  Getting transaction history...");
  const transactions = await client.getEarlyTransactions(address, 50);
  console.log(`  ✅ Retrieved ${transactions.length} transactions\n`);

  const firstFunder = relatedWallets.find(
    (rw) => rw.relation === "First Funder",
  );

  const analysis: WalletAnalysis = {
    deployer: {
      address,
      chain: "solana",
      launchDate: launchDates[launchDates.length - 1],
      firstFunder: firstFunder?.address,
      fundingChain,
      labels,
    },
    relatedWallets,
    counterparties,
    transactions,
    fundingChain,
    patterns: {
      primaryFundingSource: firstFunder?.address,
    },
  };

  return analysis;
}

/**
 * Step 6: Confidence Assessment
 * Apply Nansen's confidence scoring methodology
 */
function calculateConfidence(analyses: WalletAnalysis[]): {
  confidence: number;
  relationshipType: "direct" | "multi-level" | "unclear";
  reasoning: string[];
} {
  console.log(`\n${"=".repeat(80)}`);
  console.log("🎯 STEP 6: CONFIDENCE ASSESSMENT");
  console.log(`${"=".repeat(80)}\n`);

  const reasoning: string[] = [];
  let confidence = 0;

  // Check if all deployers have the same First Funder
  const firstFunders = analyses
    .map((a) => a.deployer.firstFunder)
    .filter((f) => f != null);

  if (firstFunders.length === 0) {
    confidence = 20;
    reasoning.push("❌ No First Funder relationships found for any deployer");
    return { confidence, relationshipType: "unclear", reasoning };
  }

  const uniqueFirstFunders = new Set(firstFunders);

  if (uniqueFirstFunders.size === 1) {
    // HIGH CONFIDENCE: All deployers have same First Funder
    confidence = 95;
    reasoning.push(
      `✅ All ${analyses.length} deployers share the SAME First Funder`,
    );
    reasoning.push(`   Wallet: ${firstFunders[0]}`);
    return { confidence, relationshipType: "direct", reasoning };
  }

  // Check for common root in funding chains
  const rootWallets = analyses
    .map((a) => a.fundingChain[0]) // First element is root
    .filter((r) => r != null);

  const uniqueRoots = new Set(rootWallets);

  if (uniqueRoots.size === 1) {
    // MEDIUM-HIGH CONFIDENCE: Different first funders but same root
    confidence = 80;
    reasoning.push(`⚠️ Different First Funders, but same ROOT funding source`);
    reasoning.push(`   Root Wallet: ${rootWallets[0]}`);
    return { confidence, relationshipType: "multi-level", reasoning };
  }

  // Check for overlap in funding chains
  const allWalletsInChains = new Set(analyses.flatMap((a) => a.fundingChain));
  const sharedWallets = Array.from(allWalletsInChains).filter((wallet) => {
    const count = analyses.filter((a) =>
      a.fundingChain.includes(wallet),
    ).length;
    return count >= 2;
  });

  if (sharedWallets.length > 0) {
    confidence = 65;
    reasoning.push(
      `⚠️ Some overlap in funding chains (${sharedWallets.length} shared wallets)`,
    );
    return { confidence, relationshipType: "multi-level", reasoning };
  }

  // LOW CONFIDENCE
  confidence = 30;
  reasoning.push(
    "❌ No clear pattern: Different first funders, different roots",
  );
  return { confidence, relationshipType: "unclear", reasoning };
}

/**
 * Step 7: Find common patterns across all deployers
 */
function findCommonPatterns(
  analyses: WalletAnalysis[],
): InvestigationReport["commonPatterns"] {
  const { confidence, relationshipType, reasoning } =
    calculateConfidence(analyses);

  console.log("\n🔬 ANALYSIS RESULTS:");
  reasoning.forEach((r) => console.log(`  ${r}`));
  console.log(`\n  Confidence Score: ${confidence}%`);
  console.log(`  Relationship Type: ${relationshipType}\n`);

  // Find shared first funder
  const firstFunders = analyses
    .map((a) => a.deployer.firstFunder)
    .filter((f) => f != null);
  const uniqueFirstFunders = new Set(firstFunders);
  const sharedFirstFunder =
    uniqueFirstFunders.size === 1 ? firstFunders[0] : undefined;

  // Find root funding wallet
  const rootWallets = analyses.map((a) => a.fundingChain[0]);
  const uniqueRoots = new Set(rootWallets);
  const rootFundingWallet = uniqueRoots.size === 1 ? rootWallets[0] : undefined;

  // Find all recurring counterparties
  const counterpartyMap = new Map<string, number>();
  analyses.forEach((analysis) => {
    analysis.counterparties.forEach((cp) => {
      const wallet = cp.counterparty_address;
      counterpartyMap.set(wallet, (counterpartyMap.get(wallet) || 0) + 1);
    });
  });

  const recurringCounterparties = Array.from(counterpartyMap.entries())
    .filter(([_, count]) => count >= 2)
    .map(([wallet]) => wallet);

  return {
    rootFundingWallet,
    sharedFirstFunder,
    recurringCounterparties,
    confidence,
    relationshipType,
  };
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("🚀 Starting Nansen Related Wallets Investigation\n");
  console.log(
    "Methodology: Identifying Related Wallets at Scale (Nansen Use Case #3)\n",
  );

  const client = new NansenClient(apiKey);
  const analyses: WalletAnalysis[] = [];

  // Analyze each deployer using 7-step workflow
  for (const deployer of DEPLOYERS) {
    try {
      const analysis = await analyzeWallet(
        client,
        deployer.address,
        deployer.type,
        deployer.launchDates,
      );
      analyses.push(analysis);

      // Wait between deployers to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Failed to analyze ${deployer.address}:`, error);
    }
  }

  // Find common patterns
  const commonPatterns = findCommonPatterns(analyses);

  // Generate recommendations
  const recommendations: string[] = [];

  if (commonPatterns.confidence >= 90) {
    recommendations.push(
      `🎯 HIGH CONFIDENCE (${commonPatterns.confidence}%): Clear pattern identified`,
    );
    if (commonPatterns.sharedFirstFunder) {
      recommendations.push(
        `Monitor wallet: ${commonPatterns.sharedFirstFunder}`,
      );
      recommendations.push(
        "This wallet directly funds all deployers. Watch for new funding activity during launch window.",
      );
    } else if (commonPatterns.rootFundingWallet) {
      recommendations.push(
        `Monitor root wallet: ${commonPatterns.rootFundingWallet}`,
      );
      recommendations.push(
        "This is the root of the funding chain. Watch for downstream activity during launch window.",
      );
    }
  } else if (commonPatterns.confidence >= 60) {
    recommendations.push(
      `⚠️ MEDIUM CONFIDENCE (${commonPatterns.confidence}%): Pattern identified but requires additional monitoring`,
    );
    const walletsToMonitor = [
      commonPatterns.sharedFirstFunder,
      commonPatterns.rootFundingWallet,
      ...commonPatterns.recurringCounterparties.slice(0, 2),
    ].filter((w) => w != null);
    recommendations.push(
      `Monitor these wallets: ${walletsToMonitor.join(", ")}`,
    );
  } else {
    recommendations.push(
      `❌ LOW CONFIDENCE (${commonPatterns.confidence}%): Inconsistent patterns`,
    );
    recommendations.push(
      "Recommend building Option 2 (full CLI tool) for deeper analysis",
    );
    recommendations.push("Consider analyzing more historical launches");
  }

  // Create final report
  const report: InvestigationReport = {
    analyzedAt: new Date().toISOString(),
    wallets: analyses,
    commonPatterns,
    recommendations,
  };

  // Save report
  const reportPath = join(
    process.cwd(),
    "reports",
    "investigation-report.json",
  );
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n${"=".repeat(80)}`);
  console.log("📋 FINAL REPORT");
  console.log(`${"=".repeat(80)}\n`);
  console.log(`Confidence Level: ${commonPatterns.confidence}%`);
  console.log(`Relationship Type: ${commonPatterns.relationshipType}`);
  if (commonPatterns.sharedFirstFunder) {
    console.log(`Shared First Funder: ${commonPatterns.sharedFirstFunder}`);
  }
  if (commonPatterns.rootFundingWallet) {
    console.log(`Root Funding Wallet: ${commonPatterns.rootFundingWallet}`);
  }
  console.log("\nRecommendations:");
  recommendations.forEach((rec) => console.log(`  ${rec}`));
  console.log(`\n✅ Full report saved to: ${reportPath}\n`);
}

main().catch(console.error);
