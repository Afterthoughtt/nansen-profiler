import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import type { Transaction, CounterpartyData, RelatedWallet } from "./types.js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Key wallets to analyze
const WALLETS = {
  PRIMARY_FUNDER: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  ROOT: "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
  COINBASE: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
  DEPLOYER_ORIGINAL: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
  DEPLOYER_FRESH_1: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
  DEPLOYER_FRESH_2: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
};

interface AnalysisResult {
  wallet: string;
  role: string;
  transactions: Transaction[];
  counterparties: CounterpartyData[];
  relatedWallets: RelatedWallet[];
  analysis: {
    activityStatus: string;
    fundedAddresses: string[];
    topCounterparties: string[];
    firstFunder: string | null;
    signerRelationships: string[];
  };
}

interface ComprehensiveReport {
  analyzedAt: string;
  phases: {
    phase1: AnalysisResult;
    phase2: AnalysisResult;
    phase3: AnalysisResult;
    phase4: {
      sharedCounterparties: string[];
      commonPatterns: string[];
    };
    phase5: {
      sep28Launch: any;
      nov2Launch: any;
      timingPattern: any;
    };
    phase6: {
      networkMap: Record<string, RelatedWallet[]>;
      clusterWallets: string[];
    };
    phase7: {
      behavioralFingerprint: any;
      smartMoneyIndicators: any;
    };
  };
  recommendations: {
    primaryTarget: string;
    backupTargets: string[];
    confidence: number;
    monitoringStrategy: string[];
  };
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeWallet(
  client: NansenClient,
  address: string,
  role: string,
): Promise<AnalysisResult> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 Analyzing ${role}: ${address.substring(0, 8)}...`);
  console.log("=".repeat(80));

  const result: AnalysisResult = {
    wallet: address,
    role,
    transactions: [],
    counterparties: [],
    relatedWallets: [],
    analysis: {
      activityStatus: "unknown",
      fundedAddresses: [],
      topCounterparties: [],
      firstFunder: null,
      signerRelationships: [],
    },
  };

  try {
    // 1. Get transaction history
    console.log("\n📡 Fetching transaction history...");
    result.transactions = await client.getEarlyTransactions(address, 100);
    console.log(`   ✅ Found ${result.transactions.length} transactions`);

    // Extract funded addresses (outbound transactions)
    const fundedAddresses = new Set<string>();
    result.transactions.forEach((tx) => {
      if (tx.tokens_sent && tx.tokens_sent.length > 0) {
        tx.tokens_sent.forEach((token) => {
          if (token.to_address && token.to_address !== address) {
            fundedAddresses.add(token.to_address);
          }
        });
      }
    });
    result.analysis.fundedAddresses = Array.from(fundedAddresses).slice(0, 20);
    console.log(`   📤 Funded ${fundedAddresses.size} unique addresses`);

    await wait(2000);

    // 2. Get counterparties
    console.log("\n📡 Fetching counterparties...");
    result.counterparties = await client.getCounterparties({
      address,
      chain: "solana",
      group_by: "wallet",
      source_input: "Combined",
      date: { from: "2025-01-01", to: "2025-12-31" },
      order_by: [{ field: "total_volume_usd", direction: "DESC" }],
    });
    console.log(`   ✅ Found ${result.counterparties.length} counterparties`);

    result.analysis.topCounterparties = result.counterparties
      .slice(0, 10)
      .map((cp) => cp.counterparty_address);

    await wait(2000);

    // 3. Get related wallets
    console.log("\n📡 Fetching related wallets...");
    result.relatedWallets = await client.getRelatedWallets({
      address,
      chain: "solana",
      pagination: { page: 1, per_page: 20 },
    });
    console.log(`   ✅ Found ${result.relatedWallets.length} related wallets`);

    // Find First Funder
    const firstFunder = result.relatedWallets.find(
      (rw) => rw.relation === "First Funder",
    );
    result.analysis.firstFunder = firstFunder ? firstFunder.address : null;

    // Find Signer relationships
    const signers = result.relatedWallets.filter(
      (rw) => rw.relation === "Signer",
    );
    result.analysis.signerRelationships = signers.map((s) => s.address);

    console.log(
      `   🔗 First Funder: ${result.analysis.firstFunder?.substring(0, 8) || "None"}`,
    );
    console.log(
      `   ✍️  Signers: ${result.analysis.signerRelationships.length}`,
    );

    // Determine activity status
    if (result.transactions.length > 0) {
      const latestTx = result.transactions[0];
      const latestDate = new Date(latestTx.block_timestamp);
      const daysSinceActivity = Math.floor(
        (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceActivity < 30) {
        result.analysis.activityStatus = "active";
      } else if (daysSinceActivity < 90) {
        result.analysis.activityStatus = "moderate";
      } else {
        result.analysis.activityStatus = "dormant";
      }
      console.log(`   📊 Activity Status: ${result.analysis.activityStatus}`);
      console.log(`   📅 Days Since Last Activity: ${daysSinceActivity}`);
    }
  } catch (error) {
    console.error(`   ❌ Error analyzing ${role}:`, error);
  }

  return result;
}

async function runComprehensiveAnalysis() {
  const apiKey = process.env.NANSEN_API_KEY;

  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("🚀 COMPREHENSIVE WALLET ANALYSIS");
  console.log("=".repeat(80));
  console.log("📋 Objective: Achieve 95%+ certainty on funding source");
  console.log("💰 Estimated Cost: ~750 credits");
  console.log("=".repeat(80));

  const client = new NansenClient(apiKey);
  const report: ComprehensiveReport = {
    analyzedAt: new Date().toISOString(),
    phases: {
      phase1: {} as AnalysisResult,
      phase2: {} as AnalysisResult,
      phase3: {} as AnalysisResult,
      phase4: { sharedCounterparties: [], commonPatterns: [] },
      phase5: { sep28Launch: {}, nov2Launch: {}, timingPattern: {} },
      phase6: { networkMap: {}, clusterWallets: [] },
      phase7: { behavioralFingerprint: {}, smartMoneyIndicators: {} },
    },
    recommendations: {
      primaryTarget: "",
      backupTargets: [],
      confidence: 0,
      monitoringStrategy: [],
    },
  };

  try {
    // ============================================
    // PHASE 1: Primary Target (v49jgwyQ...)
    // ============================================
    console.log("\n\n🎯 PHASE 1: PRIMARY TARGET ANALYSIS");
    console.log("=".repeat(80));
    report.phases.phase1 = await analyzeWallet(
      client,
      WALLETS.PRIMARY_FUNDER,
      "PRIMARY_FUNDER",
    );

    // Save intermediate result
    mkdirSync("./data/analysis", { recursive: true });
    writeFileSync(
      "./data/analysis/phase1-primary-target.json",
      JSON.stringify(report.phases.phase1, null, 2),
    );

    await wait(3000);

    // ============================================
    // PHASE 2: ROOT Wallet Analysis
    // ============================================
    console.log("\n\n🌳 PHASE 2: ROOT WALLET ANALYSIS");
    console.log("=".repeat(80));
    report.phases.phase2 = await analyzeWallet(client, WALLETS.ROOT, "ROOT");

    writeFileSync(
      "./data/analysis/phase2-root-wallet.json",
      JSON.stringify(report.phases.phase2, null, 2),
    );

    await wait(3000);

    // ============================================
    // PHASE 3: Coinbase/CEX Risk Assessment
    // ============================================
    console.log("\n\n🏦 PHASE 3: CEX FUNDING RISK ASSESSMENT");
    console.log("=".repeat(80));
    report.phases.phase3 = await analyzeWallet(
      client,
      WALLETS.COINBASE,
      "COINBASE",
    );

    writeFileSync(
      "./data/analysis/phase3-cex-risk.json",
      JSON.stringify(report.phases.phase3, null, 2),
    );

    await wait(3000);

    // ============================================
    // PHASE 4: Cross-Deployer Intelligence
    // ============================================
    console.log("\n\n🔄 PHASE 4: CROSS-DEPLOYER INTELLIGENCE");
    console.log("=".repeat(80));

    console.log("\n📊 Comparing counterparties across all deployers...");

    // Analyze all deployers
    const deployerAnalysis = {
      original: await analyzeWallet(
        client,
        WALLETS.DEPLOYER_ORIGINAL,
        "DEPLOYER_ORIGINAL",
      ),
      fresh1: await analyzeWallet(
        client,
        WALLETS.DEPLOYER_FRESH_1,
        "DEPLOYER_FRESH_1",
      ),
      fresh2: await analyzeWallet(
        client,
        WALLETS.DEPLOYER_FRESH_2,
        "DEPLOYER_FRESH_2",
      ),
    };

    // Find shared counterparties
    const counterpartySets = [
      new Set(
        deployerAnalysis.original.counterparties.map(
          (cp) => cp.counterparty_address,
        ),
      ),
      new Set(
        deployerAnalysis.fresh1.counterparties.map(
          (cp) => cp.counterparty_address,
        ),
      ),
      new Set(
        deployerAnalysis.fresh2.counterparties.map(
          (cp) => cp.counterparty_address,
        ),
      ),
    ];

    const sharedCounterparties = Array.from(counterpartySets[0]).filter(
      (addr) => counterpartySets[1].has(addr) && counterpartySets[2].has(addr),
    );

    report.phases.phase4.sharedCounterparties = sharedCounterparties;
    console.log(
      `   ✅ Found ${sharedCounterparties.length} shared counterparties across all deployers`,
    );

    // Common patterns
    const patterns = [];
    if (
      deployerAnalysis.fresh1.analysis.firstFunder ===
      deployerAnalysis.fresh2.analysis.firstFunder
    ) {
      patterns.push(
        "Fresh deployers share same First Funder (HIGH CONFIDENCE)",
      );
    }

    report.phases.phase4.commonPatterns = patterns;

    writeFileSync(
      "./data/analysis/phase4-cross-deployer.json",
      JSON.stringify(
        {
          ...report.phases.phase4,
          deployerAnalysis,
        },
        null,
        2,
      ),
    );

    await wait(3000);

    // ============================================
    // PHASE 5: Historical Timing Analysis
    // ============================================
    console.log("\n\n⏰ PHASE 5: HISTORICAL TIMING ANALYSIS");
    console.log("=".repeat(80));

    console.log("\n📅 Analyzing Sep 28, 2025 launch (XRPEP3)...");
    const sep28Txs = deployerAnalysis.fresh1.transactions;
    const sep28FirstTx = sep28Txs[sep28Txs.length - 1]; // Oldest = first funding
    const sep28Deploy = sep28Txs[0]; // Most recent = deployment

    report.phases.phase5.sep28Launch = {
      deployer: WALLETS.DEPLOYER_FRESH_1,
      firstFunding: sep28FirstTx?.block_timestamp,
      deployment: sep28Deploy?.block_timestamp,
      firstFunder: deployerAnalysis.fresh1.analysis.firstFunder,
    };

    console.log("\n📅 Analyzing Nov 2, 2025 launch (TrollXRP)...");
    const nov2Txs = deployerAnalysis.fresh2.transactions;
    const nov2FirstTx = nov2Txs[nov2Txs.length - 1];
    const nov2Deploy = nov2Txs[0];

    report.phases.phase5.nov2Launch = {
      deployer: WALLETS.DEPLOYER_FRESH_2,
      firstFunding: nov2FirstTx?.block_timestamp,
      deployment: nov2Deploy?.block_timestamp,
      firstFunder: deployerAnalysis.fresh2.analysis.firstFunder,
    };

    // Calculate timing pattern
    if (sep28FirstTx && sep28Deploy && nov2FirstTx && nov2Deploy) {
      const sep28Delta =
        new Date(sep28Deploy.block_timestamp).getTime() -
        new Date(sep28FirstTx.block_timestamp).getTime();
      const nov2Delta =
        new Date(nov2Deploy.block_timestamp).getTime() -
        new Date(nov2FirstTx.block_timestamp).getTime();

      report.phases.phase5.timingPattern = {
        sep28FundingToDeployment: `${Math.floor(sep28Delta / (1000 * 60 * 60))} hours`,
        nov2FundingToDeployment: `${Math.floor(nov2Delta / (1000 * 60 * 60))} hours`,
        averageTimeDelta: `${Math.floor((sep28Delta + nov2Delta) / 2 / (1000 * 60 * 60))} hours`,
      };

      console.log(
        `   ⏱️  Sep 28 Funding → Deployment: ${report.phases.phase5.timingPattern.sep28FundingToDeployment}`,
      );
      console.log(
        `   ⏱️  Nov 2 Funding → Deployment: ${report.phases.phase5.timingPattern.nov2FundingToDeployment}`,
      );
      console.log(
        `   📊 Average Time Delta: ${report.phases.phase5.timingPattern.averageTimeDelta}`,
      );
    }

    writeFileSync(
      "./data/analysis/phase5-timing.json",
      JSON.stringify(report.phases.phase5, null, 2),
    );

    await wait(3000);

    // ============================================
    // PHASE 6: Complete Network Expansion
    // ============================================
    console.log("\n\n🕸️  PHASE 6: COMPLETE NETWORK EXPANSION");
    console.log("=".repeat(80));

    console.log("\n📡 Getting related wallets for all key addresses...");

    const allWallets = [
      { address: WALLETS.PRIMARY_FUNDER, role: "PRIMARY_FUNDER" },
      { address: WALLETS.ROOT, role: "ROOT" },
      { address: WALLETS.COINBASE, role: "COINBASE" },
      { address: WALLETS.DEPLOYER_ORIGINAL, role: "DEPLOYER_ORIGINAL" },
      { address: WALLETS.DEPLOYER_FRESH_1, role: "DEPLOYER_FRESH_1" },
      { address: WALLETS.DEPLOYER_FRESH_2, role: "DEPLOYER_FRESH_2" },
    ];

    for (const wallet of allWallets) {
      console.log(`\n   🔍 ${wallet.role}...`);
      const related = await client.getRelatedWallets({
        address: wallet.address,
        chain: "solana",
        pagination: { page: 1, per_page: 20 },
      });
      report.phases.phase6.networkMap[wallet.role] = related;
      console.log(`      ✅ ${related.length} related wallets`);
      await wait(2000);
    }

    // Identify cluster wallets (wallets with Signer relationships)
    const clusterWallets = new Set<string>();
    Object.values(report.phases.phase6.networkMap).forEach((related) => {
      related.forEach((rw) => {
        if (rw.relation === "Signer") {
          clusterWallets.add(rw.address);
        }
      });
    });
    report.phases.phase6.clusterWallets = Array.from(clusterWallets);

    console.log(
      `\n   🎯 Identified ${report.phases.phase6.clusterWallets.length} cluster wallets (Signer relationships)`,
    );

    writeFileSync(
      "./data/analysis/phase6-network.json",
      JSON.stringify(report.phases.phase6, null, 2),
    );

    // ============================================
    // PHASE 7: Advanced Intelligence
    // ============================================
    console.log("\n\n🧠 PHASE 7: ADVANCED INTELLIGENCE");
    console.log("=".repeat(80));

    // Behavioral fingerprint
    console.log("\n📊 Creating behavioral fingerprint...");
    const behavioralFingerprint = {
      primaryFunderActivity: report.phases.phase1.analysis.activityStatus,
      rootActivity: report.phases.phase2.analysis.activityStatus,
      cexActivity: report.phases.phase3.analysis.activityStatus,
      consistentFundingPattern: report.phases.phase4.commonPatterns.length > 0,
      signerWallets: report.phases.phase6.clusterWallets,
      typicalTimeDelta: report.phases.phase5.timingPattern.averageTimeDelta,
    };

    report.phases.phase7.behavioralFingerprint = behavioralFingerprint;

    // Check for Smart Money indicators in metadata
    console.log("\n🎯 Checking for Smart Money indicators...");
    const smartMoneyIndicators = {
      hasSmartMoneyLabels: false, // Would be in counterparty/related wallet metadata
      highVolumeCounterparties: report.phases.phase1.counterparties
        .filter((cp) => (cp.total_volume_usd || 0) > 10000)
        .map((cp) => ({
          address: cp.counterparty_address,
          volume: cp.total_volume_usd,
        })),
    };

    report.phases.phase7.smartMoneyIndicators = smartMoneyIndicators;

    writeFileSync(
      "./data/analysis/phase7-advanced.json",
      JSON.stringify(report.phases.phase7, null, 2),
    );

    // ============================================
    // FINAL RECOMMENDATIONS
    // ============================================
    console.log("\n\n🎯 GENERATING FINAL RECOMMENDATIONS");
    console.log("=".repeat(80));

    // Calculate confidence based on findings
    let confidence = 0;
    const reasons = [];

    // Check if both fresh deployers share same First Funder
    if (
      deployerAnalysis.fresh1.analysis.firstFunder ===
        deployerAnalysis.fresh2.analysis.firstFunder &&
      deployerAnalysis.fresh1.analysis.firstFunder === WALLETS.PRIMARY_FUNDER
    ) {
      confidence += 50;
      reasons.push("Both fresh deployers funded by v49jgwyQ (50 points)");
    }

    // Check if primary funder is active
    if (report.phases.phase1.analysis.activityStatus === "active") {
      confidence += 20;
      reasons.push("Primary funder is currently active (20 points)");
    }

    // Check if ROOT consistently funds primary
    if (report.phases.phase1.analysis.firstFunder === WALLETS.ROOT) {
      confidence += 15;
      reasons.push("ROOT → Primary funder relationship confirmed (15 points)");
    }

    // Check if CEX is dormant (good - means not reverting to CEX pattern)
    if (report.phases.phase3.analysis.activityStatus !== "active") {
      confidence += 10;
      reasons.push("CEX wallet not actively used (10 points)");
    }

    report.recommendations = {
      primaryTarget: WALLETS.PRIMARY_FUNDER,
      backupTargets: [WALLETS.ROOT, WALLETS.COINBASE],
      confidence: Math.min(confidence, 100),
      monitoringStrategy: [
        `PRIMARY: Monitor ${WALLETS.PRIMARY_FUNDER.substring(0, 8)}... for any fresh wallet funding`,
        `BACKUP: Monitor ${WALLETS.ROOT.substring(0, 8)}... for funding to new LEVEL 1 wallets`,
        `FALLBACK: Monitor ${WALLETS.COINBASE.substring(0, 8)}... if CEX pattern resumes`,
        `Expected timing: ${report.phases.phase5.timingPattern.averageTimeDelta} between funding and deployment`,
      ],
    };

    console.log(`\n✅ CONFIDENCE SCORE: ${report.recommendations.confidence}%`);
    console.log("\nReasoning:");
    reasons.forEach((reason) => console.log(`   • ${reason}`));

    console.log("\n📋 PRIMARY TARGET:");
    console.log(`   ${report.recommendations.primaryTarget}`);

    console.log("\n📋 BACKUP TARGETS:");
    report.recommendations.backupTargets.forEach((target, idx) => {
      console.log(`   ${idx + 1}. ${target}`);
    });

    // Save complete report
    writeFileSync(
      "./data/analysis/comprehensive-report.json",
      JSON.stringify(report, null, 2),
    );

    console.log("\n" + "=".repeat(80));
    console.log("✅ COMPREHENSIVE ANALYSIS COMPLETE!");
    console.log("=".repeat(80));
    console.log("\n📁 Reports saved to:");
    console.log("   • ./data/analysis/comprehensive-report.json");
    console.log("   • ./data/analysis/phase*.json (individual phases)");
    console.log(
      "\n📊 Next: Generate comprehensive intelligence report markdown",
    );
  } catch (error) {
    console.error("\n❌ Analysis failed:", error);
    process.exit(1);
  }
}

runComprehensiveAnalysis();
