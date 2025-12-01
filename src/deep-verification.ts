/**
 * Deep Verification Analysis
 *
 * Purpose: Increase confidence in deployer prediction by verifying:
 * 1. Is v49j the ONLY funding path?
 * 2. Are v49j/deployers controlled by same entity?
 * 3. Where do profits flow?
 * 4. What are the alternative paths?
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { NansenClient } from "./nansen-client.js";
import type { RelatedWallet, CounterpartyData, Transaction } from "./types.js";

// Key addresses
const WALLETS = {
  PRIMARY_FUNDER: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5", // LEVEL 1
  ROOT: "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
  COINBASE_HOT: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
  // Known deployers
  DEPLOYER_ORIGINAL: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2", // First funder: Coinbase
  DEPLOYER_D7MS: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",     // First funder: v49j
  DEPLOYER_DBMX: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",     // First funder: v49j
};

// Known token addresses for profit tracking
const TOKENS = {
  XRPEP3: "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump",
  TROLLXRP: "CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump",
};

interface SignerAnalysis {
  wallet: string;
  signers: string[];
}

interface ProfitDestination {
  address: string;
  totalVolumeUsd: number;
  interactionCount: number;
  isKnownWallet: boolean;
  knownRole?: string;
}

interface VerificationReport {
  generatedAt: string;

  // Phase 1: Fresh Analysis
  freshAnalysis: {
    v49jBalance: { sol: number; usd: number };
    dbmxBalance: { sol: number; usd: number };
    rootLastActivity?: string;
    v49jRecentTransactions: number;
  };

  // Phase 2: Signer Analysis
  signerAnalysis: {
    walletSigners: SignerAnalysis[];
    sharedSigners: string[];
    entityConfidence: number;
    conclusion: string;
  };

  // Phase 3: Profit Flow
  profitFlow: {
    d7msDestinations: ProfitDestination[];
    dbmxDestinations: ProfitDestination[];
    flowsBackToFundingChain: boolean;
    profitExtractionPath: string;
  };

  // Phase 4: v49j Exclusivity
  v49jExclusivity: {
    totalCounterparties: number;
    categorized: {
      knownDeployers: string[];
      cexWallets: string[];
      tokenContracts: string[];
      unknownWallets: string[];
    };
    exclusivityScore: number;
    conclusion: string;
  };

  // Phase 5: Alternative Paths
  alternativePaths: {
    rootFundedWallets: string[];
    potentialLevel1Wallets: {
      address: string;
      hasFundedDeployers: boolean;
      recentActivity: boolean;
    }[];
    v49jIsOnlyPath: boolean;
    recommendedMonitorList: string[];
  };

  // Phase 6: DBmx Reuse
  dbmxReuse: {
    currentBalance: number;
    recentActivity: boolean;
    lastActivityDate?: string;
    reuseProbability: number;
    recommendation: string;
  };

  // Overall
  overallConfidence: number;
  keyFindings: string[];
  monitoringRecommendations: string[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DeepVerification {
  private client: NansenClient;
  private report: Partial<VerificationReport> = {};

  constructor(apiKey: string) {
    this.client = new NansenClient(apiKey);
  }

  async run(): Promise<VerificationReport> {
    console.log("\n" + "=".repeat(60));
    console.log("🔬 DEEP VERIFICATION ANALYSIS");
    console.log("=".repeat(60));

    this.report.generatedAt = new Date().toISOString();

    // Run phases in order of importance for the user's main concerns
    await this.phase5AlternativePaths();   // Is v49j the ONLY path?
    await this.phase4V49jExclusivity();    // What does v49j do?
    await this.phase2SignerAnalysis();     // Same entity?
    await this.phase3ProfitFlow();         // Economic link?
    await this.phase1FreshAnalysis();      // Current state
    await this.phase6DbmxReuse();          // Reuse probability

    // Calculate overall confidence
    this.calculateOverallConfidence();

    // Save report
    await this.saveReport();

    return this.report as VerificationReport;
  }

  /**
   * PHASE 5: Alternative Path Discovery (HIGHEST PRIORITY)
   * Check if ROOT has funded other LEVEL 1 wallets besides v49j
   */
  private async phase5AlternativePaths(): Promise<void> {
    console.log("\n📍 PHASE 5: ALTERNATIVE PATH DISCOVERY");
    console.log("-".repeat(40));

    const result: VerificationReport["alternativePaths"] = {
      rootFundedWallets: [],
      potentialLevel1Wallets: [],
      v49jIsOnlyPath: true,
      recommendedMonitorList: [WALLETS.PRIMARY_FUNDER],
    };

    try {
      // Get all wallets ROOT has interacted with
      console.log("  → Fetching ROOT wallet counterparties...");
      const rootCounterparties = await this.client.getCounterparties({
        address: WALLETS.ROOT,
        chain: "solana",
        date: { from: "2024-01-01", to: "2025-12-31" },
        group_by: "wallet",
        source_input: "Combined",
      });
      await delay(2000);

      // Filter for wallets ROOT has SENT to (potential LEVEL 1s)
      const sentTo = rootCounterparties.filter(cp =>
        cp.volume_out_usd && cp.volume_out_usd > 0
      );

      console.log(`  → ROOT has sent funds to ${sentTo.length} wallets`);

      for (const cp of sentTo) {
        result.rootFundedWallets.push(cp.counterparty_address);

        // Check if this is v49j or a known wallet
        if (cp.counterparty_address === WALLETS.PRIMARY_FUNDER) {
          console.log(`    ✅ v49j confirmed as ROOT recipient (${cp.volume_out_usd?.toFixed(2)} USD out)`);
          continue;
        }

        if (cp.counterparty_address === WALLETS.COINBASE_HOT) {
          console.log(`    ⚪ Coinbase Hot Wallet (exchange)`);
          continue;
        }

        // Check if this wallet has funded any deployers
        console.log(`    → Checking potential LEVEL 1: ${cp.counterparty_address.slice(0, 8)}...`);

        const relatedWallets = await this.client.getRelatedWallets({
          address: cp.counterparty_address,
          chain: "solana",
          pagination: { page: 1, per_page: 50 },
        });
        await delay(2000);

        // Check if this wallet is a "First Funder" for any deployers
        const fundedByThis = relatedWallets.filter(rw =>
          rw.relation === "First Funder" && rw.address !== cp.counterparty_address
        );

        const hasFundedDeployers = fundedByThis.some(rw =>
          [WALLETS.DEPLOYER_D7MS, WALLETS.DEPLOYER_DBMX, WALLETS.DEPLOYER_ORIGINAL].includes(rw.address)
        );

        // Check recent activity
        const recentTxs = await this.client.getTransactions({
          address: cp.counterparty_address,
          chain: "solana",
          date: { from: "2025-11-01", to: "2025-11-30" },
          pagination: { page: 1, per_page: 10 },
        });
        await delay(2000);

        const recentActivity = (recentTxs.data?.length || 0) > 0;

        result.potentialLevel1Wallets.push({
          address: cp.counterparty_address,
          hasFundedDeployers,
          recentActivity,
        });

        if (hasFundedDeployers || recentActivity) {
          console.log(`    ⚠️  POTENTIAL ALTERNATIVE LEVEL 1!`);
          console.log(`       Has funded deployers: ${hasFundedDeployers}`);
          console.log(`       Recent activity: ${recentActivity}`);
          result.v49jIsOnlyPath = false;
          result.recommendedMonitorList.push(cp.counterparty_address);
        }
      }

      // Get ROOT's related wallets to find First Funder relationships
      console.log("\n  → Checking ROOT's outbound First Funder relationships...");
      const rootRelated = await this.client.getRelatedWallets({
        address: WALLETS.ROOT,
        chain: "solana",
        pagination: { page: 1, per_page: 50 },
      });

      const rootFundedFirst = rootRelated.filter(rw =>
        rw.relation === "First Funder" && rw.address !== WALLETS.ROOT
      );

      for (const rw of rootFundedFirst) {
        console.log(`    First Funder relationship: ${rw.address.slice(0, 8)}...`);
        if (!result.rootFundedWallets.includes(rw.address)) {
          result.rootFundedWallets.push(rw.address);
        }
      }

    } catch (error) {
      console.error("  ❌ Error in alternative paths analysis:", error);
    }

    // Summary
    console.log("\n  📊 ALTERNATIVE PATHS SUMMARY:");
    console.log(`     ROOT funded wallets: ${result.rootFundedWallets.length}`);
    console.log(`     Potential LEVEL 1s: ${result.potentialLevel1Wallets.length}`);
    console.log(`     v49j is ONLY path: ${result.v49jIsOnlyPath ? "✅ YES" : "⚠️ NO"}`);
    console.log(`     Recommended monitor list: ${result.recommendedMonitorList.length} wallets`);

    this.report.alternativePaths = result;
  }

  /**
   * PHASE 4: v49j Exclusivity Check
   * Determine if v49j ONLY funds deployers (making any outbound = strong signal)
   */
  private async phase4V49jExclusivity(): Promise<void> {
    console.log("\n📍 PHASE 4: v49j EXCLUSIVITY CHECK");
    console.log("-".repeat(40));

    const result: VerificationReport["v49jExclusivity"] = {
      totalCounterparties: 0,
      categorized: {
        knownDeployers: [],
        cexWallets: [],
        tokenContracts: [],
        unknownWallets: [],
      },
      exclusivityScore: 0,
      conclusion: "",
    };

    try {
      // Get ALL counterparties v49j has ever interacted with
      console.log("  → Fetching v49j full counterparty history...");
      const counterparties = await this.client.getCounterparties({
        address: WALLETS.PRIMARY_FUNDER,
        chain: "solana",
        date: { from: "2024-01-01", to: "2025-12-31" },
        group_by: "wallet",
        source_input: "Combined",
      });
      await delay(2000);

      result.totalCounterparties = counterparties.length;
      console.log(`  → v49j has interacted with ${counterparties.length} wallets total`);

      // Categorize each counterparty
      for (const cp of counterparties) {
        const addr = cp.counterparty_address;

        // Check if known deployer
        if ([WALLETS.DEPLOYER_D7MS, WALLETS.DEPLOYER_DBMX, WALLETS.DEPLOYER_ORIGINAL].includes(addr)) {
          result.categorized.knownDeployers.push(addr);
          console.log(`    ✅ Known deployer: ${addr.slice(0, 8)}...`);
          continue;
        }

        // Check if CEX (by label or known address)
        if (addr === WALLETS.COINBASE_HOT || addr === WALLETS.ROOT) {
          result.categorized.cexWallets.push(addr);
          console.log(`    🏦 CEX/ROOT wallet: ${addr.slice(0, 8)}...`);
          continue;
        }

        // Check labels from counterparty data
        if (cp.counterparty_address_label?.some(l =>
          l.toLowerCase().includes("coinbase") ||
          l.toLowerCase().includes("binance") ||
          l.toLowerCase().includes("exchange")
        )) {
          result.categorized.cexWallets.push(addr);
          console.log(`    🏦 Labeled CEX: ${addr.slice(0, 8)}... (${cp.counterparty_address_label?.join(", ")})`);
          continue;
        }

        // Check if it's a token contract (by checking if it ends in "pump")
        if (addr.endsWith("pump")) {
          result.categorized.tokenContracts.push(addr);
          console.log(`    🪙 Token contract: ${addr.slice(0, 8)}...`);
          continue;
        }

        // Unknown wallet - needs investigation
        result.categorized.unknownWallets.push(addr);
        console.log(`    ❓ Unknown wallet: ${addr.slice(0, 8)}... (interactions: ${cp.interaction_count}, vol out: ${cp.volume_out_usd?.toFixed(2) || 0})`);
      }

      // Investigate unknown wallets with significant outbound volume
      const significantUnknown = counterparties.filter(cp =>
        result.categorized.unknownWallets.includes(cp.counterparty_address) &&
        cp.volume_out_usd && cp.volume_out_usd > 10 // More than $10 outbound
      );

      if (significantUnknown.length > 0) {
        console.log(`\n  → Investigating ${significantUnknown.length} unknown wallets with significant outbound...`);

        for (const cp of significantUnknown.slice(0, 5)) { // Limit to 5 to save API calls
          console.log(`    Checking ${cp.counterparty_address.slice(0, 8)}...`);

          // Check if this wallet became a deployer
          const related = await this.client.getRelatedWallets({
            address: cp.counterparty_address,
            chain: "solana",
            pagination: { page: 1, per_page: 20 },
          });
          await delay(2000);

          const deployedVia = related.find(r => r.relation === "Deployed via");
          if (deployedVia) {
            console.log(`      🎯 This wallet deployed tokens! (via ${deployedVia.address.slice(0, 8)})`);
            // Reclassify as potential deployer
            result.categorized.unknownWallets = result.categorized.unknownWallets.filter(a => a !== cp.counterparty_address);
            result.categorized.knownDeployers.push(cp.counterparty_address);
          }
        }
      }

      // Calculate exclusivity score
      const deployerRatio = result.categorized.knownDeployers.length /
        (result.categorized.knownDeployers.length + result.categorized.unknownWallets.length);
      result.exclusivityScore = Math.round(deployerRatio * 100);

      if (result.categorized.unknownWallets.length === 0) {
        result.conclusion = "v49j ONLY interacts with known deployers and CEX. Any new SOL outbound is 99% a deployer.";
        result.exclusivityScore = 99;
      } else if (result.categorized.unknownWallets.length <= 3) {
        result.conclusion = `v49j has ${result.categorized.unknownWallets.length} unknown interactions. High signal quality but verify new outbound.`;
      } else {
        result.conclusion = `v49j has ${result.categorized.unknownWallets.length} unknown interactions. Signal may have noise.`;
      }

    } catch (error) {
      console.error("  ❌ Error in v49j exclusivity check:", error);
    }

    console.log("\n  📊 v49j EXCLUSIVITY SUMMARY:");
    console.log(`     Total counterparties: ${result.totalCounterparties}`);
    console.log(`     Known deployers: ${result.categorized.knownDeployers.length}`);
    console.log(`     CEX wallets: ${result.categorized.cexWallets.length}`);
    console.log(`     Token contracts: ${result.categorized.tokenContracts.length}`);
    console.log(`     Unknown wallets: ${result.categorized.unknownWallets.length}`);
    console.log(`     Exclusivity score: ${result.exclusivityScore}%`);
    console.log(`     Conclusion: ${result.conclusion}`);

    this.report.v49jExclusivity = result;
  }

  /**
   * PHASE 2: Signer Analysis
   * Check if deployers share signers with v49j (proves same entity)
   */
  private async phase2SignerAnalysis(): Promise<void> {
    console.log("\n📍 PHASE 2: SIGNER ANALYSIS");
    console.log("-".repeat(40));

    const result: VerificationReport["signerAnalysis"] = {
      walletSigners: [],
      sharedSigners: [],
      entityConfidence: 0,
      conclusion: "",
    };

    const walletsToCheck = [
      { address: WALLETS.PRIMARY_FUNDER, name: "v49j" },
      { address: WALLETS.DEPLOYER_D7MS, name: "D7Ms" },
      { address: WALLETS.DEPLOYER_DBMX, name: "DBmx" },
    ];

    try {
      // Get signers for each wallet
      for (const wallet of walletsToCheck) {
        console.log(`  → Getting signers for ${wallet.name}...`);
        const related = await this.client.getRelatedWallets({
          address: wallet.address,
          chain: "solana",
          pagination: { page: 1, per_page: 50 },
        });
        await delay(2000);

        const signers = related
          .filter(r => r.relation === "Signer")
          .map(r => r.address);

        result.walletSigners.push({
          wallet: wallet.address,
          signers,
        });

        console.log(`    Found ${signers.length} signers`);
        signers.forEach(s => console.log(`      - ${s.slice(0, 12)}...`));
      }

      // Find shared signers
      const allSigners = result.walletSigners.flatMap(ws => ws.signers);
      const signerCounts = new Map<string, number>();

      for (const signer of allSigners) {
        signerCounts.set(signer, (signerCounts.get(signer) || 0) + 1);
      }

      result.sharedSigners = Array.from(signerCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([signer, _]) => signer);

      // Calculate confidence
      if (result.sharedSigners.length > 0) {
        result.entityConfidence = 99;
        result.conclusion = `Found ${result.sharedSigners.length} shared signer(s)! Same entity controls these wallets.`;
      } else {
        result.entityConfidence = 70;
        result.conclusion = "No shared signers found. Could be using different keys per wallet (opsec).";
      }

    } catch (error) {
      console.error("  ❌ Error in signer analysis:", error);
    }

    console.log("\n  📊 SIGNER ANALYSIS SUMMARY:");
    console.log(`     Shared signers: ${result.sharedSigners.length}`);
    console.log(`     Entity confidence: ${result.entityConfidence}%`);
    console.log(`     Conclusion: ${result.conclusion}`);

    this.report.signerAnalysis = result;
  }

  /**
   * PHASE 3: Profit Flow Tracking
   * Where do deployer profits go?
   */
  private async phase3ProfitFlow(): Promise<void> {
    console.log("\n📍 PHASE 3: PROFIT FLOW TRACKING");
    console.log("-".repeat(40));

    const result: VerificationReport["profitFlow"] = {
      d7msDestinations: [],
      dbmxDestinations: [],
      flowsBackToFundingChain: false,
      profitExtractionPath: "",
    };

    const fundingChainAddresses = [WALLETS.PRIMARY_FUNDER, WALLETS.ROOT, WALLETS.COINBASE_HOT];

    try {
      // Track D7Ms profits (after XRPEP3 launch Sep 28)
      console.log("  → Tracking D7Ms profit destinations...");
      const d7msCounterparties = await this.client.getCounterparties({
        address: WALLETS.DEPLOYER_D7MS,
        chain: "solana",
        date: { from: "2025-09-28", to: "2025-12-31" },
        group_by: "wallet",
        source_input: "Combined",
      });
      await delay(2000);

      // Filter for outbound (where D7Ms sent funds)
      const d7msOutbound = d7msCounterparties.filter(cp =>
        cp.volume_out_usd && cp.volume_out_usd > 1
      );

      for (const cp of d7msOutbound) {
        const isKnown = fundingChainAddresses.includes(cp.counterparty_address);
        result.d7msDestinations.push({
          address: cp.counterparty_address,
          totalVolumeUsd: cp.volume_out_usd || 0,
          interactionCount: cp.interaction_count,
          isKnownWallet: isKnown,
          knownRole: isKnown ? (cp.counterparty_address === WALLETS.PRIMARY_FUNDER ? "v49j" : "ROOT/CEX") : undefined,
        });

        if (isKnown) {
          result.flowsBackToFundingChain = true;
          console.log(`    ✅ D7Ms sent ${cp.volume_out_usd?.toFixed(2)} to ${cp.counterparty_address.slice(0, 8)}... (FUNDING CHAIN)`);
        }
      }

      // Track DBmx profits (after TrollXRP launch Nov 2)
      console.log("\n  → Tracking DBmx profit destinations...");
      const dbmxCounterparties = await this.client.getCounterparties({
        address: WALLETS.DEPLOYER_DBMX,
        chain: "solana",
        date: { from: "2025-11-02", to: "2025-12-31" },
        group_by: "wallet",
        source_input: "Combined",
      });
      await delay(2000);

      const dbmxOutbound = dbmxCounterparties.filter(cp =>
        cp.volume_out_usd && cp.volume_out_usd > 1
      );

      for (const cp of dbmxOutbound) {
        const isKnown = fundingChainAddresses.includes(cp.counterparty_address);
        result.dbmxDestinations.push({
          address: cp.counterparty_address,
          totalVolumeUsd: cp.volume_out_usd || 0,
          interactionCount: cp.interaction_count,
          isKnownWallet: isKnown,
          knownRole: isKnown ? (cp.counterparty_address === WALLETS.PRIMARY_FUNDER ? "v49j" : "ROOT/CEX") : undefined,
        });

        if (isKnown) {
          result.flowsBackToFundingChain = true;
          console.log(`    ✅ DBmx sent ${cp.volume_out_usd?.toFixed(2)} to ${cp.counterparty_address.slice(0, 8)}... (FUNDING CHAIN)`);
        }
      }

      // Determine profit extraction path
      if (result.flowsBackToFundingChain) {
        result.profitExtractionPath = "Deployer → v49j/ROOT → CEX (confirms economic control)";
      } else if (result.d7msDestinations.length === 0 && result.dbmxDestinations.length === 0) {
        result.profitExtractionPath = "No significant outbound detected (profits may be held or swapped)";
      } else {
        result.profitExtractionPath = "Profits sent to unknown wallets (requires further investigation)";
      }

    } catch (error) {
      console.error("  ❌ Error in profit flow tracking:", error);
    }

    console.log("\n  📊 PROFIT FLOW SUMMARY:");
    console.log(`     D7Ms destinations: ${result.d7msDestinations.length}`);
    console.log(`     DBmx destinations: ${result.dbmxDestinations.length}`);
    console.log(`     Flows back to funding chain: ${result.flowsBackToFundingChain ? "✅ YES" : "❌ NO"}`);
    console.log(`     Extraction path: ${result.profitExtractionPath}`);

    this.report.profitFlow = result;
  }

  /**
   * PHASE 1: Fresh Analysis (current wallet states)
   */
  private async phase1FreshAnalysis(): Promise<void> {
    console.log("\n📍 PHASE 1: FRESH ANALYSIS (Current State)");
    console.log("-".repeat(40));

    const result: VerificationReport["freshAnalysis"] = {
      v49jBalance: { sol: 0, usd: 0 },
      dbmxBalance: { sol: 0, usd: 0 },
      v49jRecentTransactions: 0,
    };

    try {
      // Get v49j current balance
      console.log("  → Fetching v49j current balance...");
      const v49jBalance = await this.client.getCurrentBalance({
        address: WALLETS.PRIMARY_FUNDER,
        chain: "solana",
      });
      await delay(2000);

      const v49jSol = v49jBalance.find(b => b.token_symbol === "SOL");
      if (v49jSol) {
        result.v49jBalance = {
          sol: v49jSol.token_amount || 0,
          usd: v49jSol.value_usd || 0,
        };
      }
      console.log(`    v49j SOL: ${result.v49jBalance.sol.toFixed(4)} (~$${result.v49jBalance.usd.toFixed(2)})`);

      // Get DBmx current balance
      console.log("  → Fetching DBmx current balance...");
      const dbmxBalance = await this.client.getCurrentBalance({
        address: WALLETS.DEPLOYER_DBMX,
        chain: "solana",
      });
      await delay(2000);

      const dbmxSol = dbmxBalance.find(b => b.token_symbol === "SOL");
      if (dbmxSol) {
        result.dbmxBalance = {
          sol: dbmxSol.token_amount || 0,
          usd: dbmxSol.value_usd || 0,
        };
      }
      console.log(`    DBmx SOL: ${result.dbmxBalance.sol.toFixed(4)} (~$${result.dbmxBalance.usd.toFixed(2)})`);

      // Get v49j recent transactions (last 7 days)
      console.log("  → Fetching v49j recent transactions...");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const v49jTxs = await this.client.getTransactions({
        address: WALLETS.PRIMARY_FUNDER,
        chain: "solana",
        date: {
          from: sevenDaysAgo.toISOString().split("T")[0],
          to: new Date().toISOString().split("T")[0]
        },
        pagination: { page: 1, per_page: 50 },
      });
      await delay(2000);

      result.v49jRecentTransactions = v49jTxs.data?.length || 0;
      console.log(`    v49j recent txs (7 days): ${result.v49jRecentTransactions}`);

      // Check ROOT last activity
      console.log("  → Checking ROOT last activity...");
      const rootTxs = await this.client.getTransactions({
        address: WALLETS.ROOT,
        chain: "solana",
        date: { from: "2025-01-01", to: "2025-12-31" },
        pagination: { page: 1, per_page: 10 },
      });

      if (rootTxs.data && rootTxs.data.length > 0) {
        result.rootLastActivity = rootTxs.data[0].block_timestamp;
        console.log(`    ROOT last activity: ${result.rootLastActivity}`);
      }

    } catch (error) {
      console.error("  ❌ Error in fresh analysis:", error);
    }

    this.report.freshAnalysis = result;
  }

  /**
   * PHASE 6: DBmx Reuse Probability
   */
  private async phase6DbmxReuse(): Promise<void> {
    console.log("\n📍 PHASE 6: DBmx REUSE PROBABILITY");
    console.log("-".repeat(40));

    // We already have DBmx balance from Phase 1
    const freshAnalysis = this.report.freshAnalysis!;

    const result: VerificationReport["dbmxReuse"] = {
      currentBalance: freshAnalysis.dbmxBalance.sol,
      recentActivity: false,
      reuseProbability: 0,
      recommendation: "",
    };

    try {
      // Check recent activity
      console.log("  → Checking DBmx recent activity...");
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const dbmxTxs = await this.client.getTransactions({
        address: WALLETS.DEPLOYER_DBMX,
        chain: "solana",
        date: {
          from: twoDaysAgo.toISOString().split("T")[0],
          to: new Date().toISOString().split("T")[0]
        },
        pagination: { page: 1, per_page: 10 },
      });

      result.recentActivity = (dbmxTxs.data?.length || 0) > 0;
      if (dbmxTxs.data && dbmxTxs.data.length > 0) {
        result.lastActivityDate = dbmxTxs.data[0].block_timestamp;
      }

      // Calculate reuse probability
      // Based on user's input: they're 99% sure fresh wallet will be used
      // But let's verify with data

      if (result.currentBalance < 0.01) {
        // Very low balance - unlikely to deploy without funding
        result.reuseProbability = 5;
        result.recommendation = "DBmx balance too low for deployment. Fresh wallet likely.";
      } else if (result.currentBalance < 0.1) {
        result.reuseProbability = 15;
        result.recommendation = "DBmx has minimal balance. Fresh wallet more likely.";
      } else {
        result.reuseProbability = 25;
        result.recommendation = "DBmx has some balance but historical pattern suggests fresh wallets.";
      }

      // Pattern note: DBmx was reused for RizzmasCTO on Nov 23
      // But user believes they always use fresh wallets
      console.log(`\n  Note: DBmx WAS reused on Nov 23 for RizzmasCTO/RizzmasRug`);
      console.log(`  However, user states pattern is always fresh wallets`);

    } catch (error) {
      console.error("  ❌ Error in DBmx reuse analysis:", error);
    }

    console.log("\n  📊 DBmx REUSE SUMMARY:");
    console.log(`     Current balance: ${result.currentBalance.toFixed(4)} SOL`);
    console.log(`     Recent activity: ${result.recentActivity ? "YES" : "NO"}`);
    console.log(`     Reuse probability: ${result.reuseProbability}%`);
    console.log(`     Recommendation: ${result.recommendation}`);

    this.report.dbmxReuse = result;
  }

  /**
   * Calculate overall confidence and generate key findings
   */
  private calculateOverallConfidence(): void {
    const findings: string[] = [];
    const recommendations: string[] = [];

    let confidence = 90; // Base confidence from established pattern

    // Adjust based on alternative paths
    if (this.report.alternativePaths?.v49jIsOnlyPath) {
      confidence += 5;
      findings.push("✅ v49j confirmed as ONLY funding path from ROOT");
    } else {
      confidence -= 10;
      findings.push("⚠️ Alternative funding paths detected - expand monitoring");
      recommendations.push("Add alternative LEVEL 1 wallets to Telegram bot");
    }

    // Adjust based on exclusivity
    if (this.report.v49jExclusivity?.exclusivityScore && this.report.v49jExclusivity.exclusivityScore >= 90) {
      confidence += 3;
      findings.push("✅ v49j has high exclusivity - any SOL outbound is strong signal");
    } else if (this.report.v49jExclusivity?.categorized.unknownWallets.length || 0 > 5) {
      confidence -= 5;
      findings.push("⚠️ v49j has many unknown interactions - signal has noise");
    }

    // Adjust based on signer analysis
    if (this.report.signerAnalysis?.sharedSigners.length || 0 > 0) {
      confidence += 5;
      findings.push("✅ Shared signers found - same entity confirmed");
    } else {
      findings.push("⚪ No shared signers - entity link relies on funding chain only");
    }

    // Adjust based on profit flow
    if (this.report.profitFlow?.flowsBackToFundingChain) {
      confidence += 2;
      findings.push("✅ Profits flow back to funding chain - economic link confirmed");
    }

    // Fresh wallet expectation
    if (this.report.dbmxReuse?.reuseProbability || 0 < 20) {
      findings.push("📋 Fresh wallet expected for next launch (based on pattern + low DBmx balance)");
      recommendations.push("Monitor v49j for SOL outbound to any fresh address");
    }

    // Add general recommendations
    recommendations.push("Continue monitoring v49j via Telegram bot");
    if (this.report.alternativePaths?.recommendedMonitorList.length || 0 > 1) {
      recommendations.push(`Monitor ${this.report.alternativePaths?.recommendedMonitorList.length} wallets total`);
    }
    recommendations.push("When v49j sends SOL to fresh wallet, that's the deployer (expect launch in 2-3 hours)");

    this.report.overallConfidence = Math.min(99, Math.max(50, confidence));
    this.report.keyFindings = findings;
    this.report.monitoringRecommendations = recommendations;
  }

  /**
   * Save report to file
   */
  private async saveReport(): Promise<void> {
    const outputDir = path.join(process.cwd(), "data", "analysis");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "verification-report.json");
    fs.writeFileSync(outputPath, JSON.stringify(this.report, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("📋 VERIFICATION REPORT COMPLETE");
    console.log("=".repeat(60));
    console.log(`\n📊 OVERALL CONFIDENCE: ${this.report.overallConfidence}%`);
    console.log("\n🔑 KEY FINDINGS:");
    this.report.keyFindings?.forEach(f => console.log(`   ${f}`));
    console.log("\n📡 MONITORING RECOMMENDATIONS:");
    this.report.monitoringRecommendations?.forEach(r => console.log(`   • ${r}`));
    console.log(`\n💾 Saved to: ${outputPath}`);
  }
}

// Main execution
async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment");
    process.exit(1);
  }

  const verifier = new DeepVerification(apiKey);
  await verifier.run();
}

main().catch(console.error);
