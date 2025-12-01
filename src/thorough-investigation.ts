/**
 * THOROUGH INVESTIGATION
 *
 * Filling the gaps:
 * 1. Verify ROOT → v49j First Funder relationship
 * 2. Find ALL wallets where v49j is First Funder (unknown deployers?)
 * 3. Investigate ALL 8 ROOT-funded wallets
 * 4. Check pump.fun program interactions
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Known addresses
const ROOT = "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF";
const V49J = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
const COINBASE_HOT = "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE";

const KNOWN_DEPLOYERS = [
  "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
  "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
  "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2"
];

// ROOT-funded wallets from previous analysis
const ROOT_FUNDED_WALLETS = [
  "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  "7gNepQgHkqw3zX1uVUQ34WMoRQjKNDro9WpToPv7WjTR",
  "6rYLG55Q9RpsPGvqdPNJs4z5WTxJVatMB8zV3WJhs5EK",
  "DFUxzyZaeimq6wffGDeR4fmdti6eJZPMe5FRu1nD5xT3",
  "DqYK6ipomA2QVr9Yk8npSC1VvgpxxYnJunYNTc9EuDMg",
  "6bPwbpP5RsK9F21oFL5UqBJTeBALcbEwwQricnDkd9QG",
  "5BYPmZoaHNsFM9LBqWvD56LLgp1eg1NT2LcfYwmS2QU",
  "2rhufnU7nej2ezaEMH8S5AUQhArV7CC1rxjVbi4E8ZVT",
  "6BEezXPT44b7dXfqCQj7g4yJ6EdgF72ECLhhFGo1D6K",
  "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q"
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

interface InvestigationResults {
  timestamp: string;

  // Gap 1: ROOT → v49j verification
  rootToV49j: {
    v49jFirstFunder: string | null;
    isRootTheFirstFunder: boolean;
    rootFirstFunder: string | null;
    fundingChainVerified: boolean;
  };

  // Gap 2: All wallets v49j is First Funder for
  v49jFundedWallets: {
    address: string;
    isKnownDeployer: boolean;
    hasDeployedTokens: boolean;
    deployedVia?: string;
    isFresh: boolean;
    currentBalance: number;
  }[];

  // Gap 3: All ROOT-funded wallets investigation
  rootFundedWalletsAnalysis: {
    address: string;
    firstFunder: string | null;
    isFirstFunderRoot: boolean;
    hasDeployedTokens: boolean;
    hasFundedDeployers: boolean;
    recentActivity: boolean;
    currentBalance: number;
    riskLevel: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  }[];

  // Gap 4: pump.fun interactions
  pumpFunDeployers: {
    address: string;
    deployedVia: string;
    isConnectedToV49j: boolean;
    isConnectedToRoot: boolean;
  }[];

  // Conclusions
  conclusions: string[];
  newWalletsToMonitor: string[];
  confidenceLevel: number;
}

const results: InvestigationResults = {
  timestamp: new Date().toISOString(),
  rootToV49j: {
    v49jFirstFunder: null,
    isRootTheFirstFunder: false,
    rootFirstFunder: null,
    fundingChainVerified: false
  },
  v49jFundedWallets: [],
  rootFundedWalletsAnalysis: [],
  pumpFunDeployers: [],
  conclusions: [],
  newWalletsToMonitor: [],
  confidenceLevel: 0
};

async function gap1_VerifyRootToV49j(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("GAP 1: VERIFY ROOT → v49j FIRST FUNDER RELATIONSHIP");
  console.log("=".repeat(60));

  // Check v49j's First Funder
  console.log("\n1.1 Checking v49j's First Funder...");
  const v49jRelated = await client.getRelatedWallets({
    address: V49J,
    chain: "solana",
    pagination: { page: 1, per_page: 50 }
  });
  await delay(2000);

  const v49jFirstFunder = v49jRelated.find(r => r.relation === "First Funder");
  results.rootToV49j.v49jFirstFunder = v49jFirstFunder?.address || null;
  results.rootToV49j.isRootTheFirstFunder = v49jFirstFunder?.address === ROOT;

  console.log("   v49j First Funder:", v49jFirstFunder?.address || "NONE");
  console.log("   Is ROOT the First Funder?", results.rootToV49j.isRootTheFirstFunder ? "✅ YES" : "❌ NO");

  if (v49jFirstFunder && v49jFirstFunder.address !== ROOT) {
    console.log("   ⚠️ WARNING: v49j's First Funder is NOT ROOT!");
    console.log("   Actual First Funder:", v49jFirstFunder.address);
  }

  // Check ROOT's First Funder (to understand the full chain)
  console.log("\n1.2 Checking ROOT's First Funder...");
  const rootRelated = await client.getRelatedWallets({
    address: ROOT,
    chain: "solana",
    pagination: { page: 1, per_page: 50 }
  });
  await delay(2000);

  const rootFirstFunder = rootRelated.find(r => r.relation === "First Funder");
  results.rootToV49j.rootFirstFunder = rootFirstFunder?.address || null;

  console.log("   ROOT First Funder:", rootFirstFunder?.address || "NONE");

  // Show all ROOT relationships
  console.log("\n1.3 All ROOT relationships:");
  rootRelated.forEach(r => {
    console.log(`   - ${r.relation}: ${r.address.slice(0, 12)}...`);
  });

  // Verify the chain
  results.rootToV49j.fundingChainVerified = results.rootToV49j.isRootTheFirstFunder;

  console.log("\n📋 GAP 1 RESULT:");
  if (results.rootToV49j.fundingChainVerified) {
    console.log("   ✅ Funding chain VERIFIED: ROOT → v49j");
  } else {
    console.log("   ❌ Funding chain NOT as expected!");
    console.log("   Actual chain: ", rootFirstFunder?.address?.slice(0,8), "→ ROOT →", v49jFirstFunder?.address?.slice(0,8) || "?", "→ v49j");
  }
}

async function gap2_FindAllV49jFundedWallets(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("GAP 2: FIND ALL WALLETS WHERE v49j IS FIRST FUNDER");
  console.log("=".repeat(60));

  // Get v49j's transactions to find SOL outbound
  console.log("\n2.1 Fetching v49j transaction history...");

  // We need to check multiple date ranges to get full history
  const dateRanges = [
    { from: "2025-01-01", to: "2025-06-30" },
    { from: "2025-07-01", to: "2025-12-31" },
    { from: "2024-01-01", to: "2024-12-31" }
  ];

  const allRecipients = new Set<string>();

  for (const range of dateRanges) {
    console.log(`   Checking ${range.from} to ${range.to}...`);
    try {
      const txs = await client.getTransactions({
        address: V49J,
        chain: "solana",
        date: range,
        pagination: { page: 1, per_page: 100 }
      });
      await delay(2000);

      // Find all addresses v49j sent SOL to
      txs.data?.forEach(tx => {
        tx.tokens_sent?.forEach(t => {
          if (t.token_symbol === "SOL" && t.to_address && t.to_address !== V49J) {
            allRecipients.add(t.to_address);
          }
        });
      });

      console.log(`   Found ${txs.data?.length || 0} transactions`);
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }
  }

  console.log(`\n2.2 v49j has sent SOL to ${allRecipients.size} unique addresses`);

  // For each recipient, check if v49j is their First Funder
  console.log("\n2.3 Checking First Funder relationship for each recipient...");

  let checkedCount = 0;
  const recipientArray = Array.from(allRecipients);

  for (const recipient of recipientArray) {
    checkedCount++;

    // Skip known addresses
    if (recipient === ROOT || recipient === COINBASE_HOT) {
      console.log(`   [${checkedCount}/${recipientArray.length}] ${recipient.slice(0, 8)}... - Skipping (known CEX/ROOT)`);
      continue;
    }

    try {
      const related = await client.getRelatedWallets({
        address: recipient,
        chain: "solana",
        pagination: { page: 1, per_page: 20 }
      });
      await delay(2000);

      const firstFunder = related.find(r => r.relation === "First Funder");
      const deployedVia = related.find(r => r.relation === "Deployed via");

      const isV49jFirstFunder = firstFunder?.address === V49J;
      const isKnownDeployer = KNOWN_DEPLOYERS.includes(recipient);

      if (isV49jFirstFunder) {
        console.log(`   [${checkedCount}/${recipientArray.length}] ${recipient.slice(0, 8)}... - ✅ v49j IS First Funder${isKnownDeployer ? " (KNOWN DEPLOYER)" : ""}`);

        // Get more details
        let isFresh = false;
        let balance = 0;

        try {
          isFresh = await client.isWalletFresh(recipient, 30);
          await delay(1500);

          const balanceData = await client.getCurrentBalance({
            address: recipient,
            chain: "solana"
          });
          await delay(1500);

          balance = balanceData.find(b => b.token_symbol === "SOL")?.token_amount || 0;
        } catch (e) {
          // Ignore errors
        }

        results.v49jFundedWallets.push({
          address: recipient,
          isKnownDeployer,
          hasDeployedTokens: !!deployedVia,
          deployedVia: deployedVia?.address,
          isFresh,
          currentBalance: balance
        });

        if (deployedVia) {
          console.log(`      🎯 HAS DEPLOYED TOKENS via ${deployedVia.address.slice(0, 12)}`);
        }

        if (!isKnownDeployer && deployedVia) {
          console.log(`      ⚠️ UNKNOWN DEPLOYER FOUND!`);
        }
      } else {
        console.log(`   [${checkedCount}/${recipientArray.length}] ${recipient.slice(0, 8)}... - First Funder: ${firstFunder?.address?.slice(0, 8) || "None"}`);
      }

    } catch (e: any) {
      console.log(`   [${checkedCount}/${recipientArray.length}] ${recipient.slice(0, 8)}... - Error: ${e.message?.slice(0, 50)}`);
    }
  }

  console.log("\n📋 GAP 2 RESULT:");
  console.log(`   Total wallets v49j is First Funder for: ${results.v49jFundedWallets.length}`);
  console.log(`   Known deployers: ${results.v49jFundedWallets.filter(w => w.isKnownDeployer).length}`);
  console.log(`   Unknown deployers (have deployed tokens): ${results.v49jFundedWallets.filter(w => !w.isKnownDeployer && w.hasDeployedTokens).length}`);
  console.log(`   Fresh wallets (potential future deployers): ${results.v49jFundedWallets.filter(w => w.isFresh && !w.isKnownDeployer).length}`);

  // List unknown deployers
  const unknownDeployers = results.v49jFundedWallets.filter(w => !w.isKnownDeployer && w.hasDeployedTokens);
  if (unknownDeployers.length > 0) {
    console.log("\n   ⚠️ UNKNOWN DEPLOYERS FOUND:");
    unknownDeployers.forEach(w => {
      console.log(`      - ${w.address}`);
    });
  }
}

async function gap3_InvestigateAllRootFundedWallets(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("GAP 3: INVESTIGATE ALL ROOT-FUNDED WALLETS");
  console.log("=".repeat(60));

  // Skip v49j and FpwQQhQQ (Coinbase - ROOT's funder)
  const walletsToCheck = ROOT_FUNDED_WALLETS.filter(w =>
    w !== V49J &&
    w !== "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q"
  );

  console.log(`\nInvestigating ${walletsToCheck.length} wallets (excluding v49j and ROOT's funder)...\n`);

  for (const wallet of walletsToCheck) {
    console.log(`--- ${wallet.slice(0, 12)}... ---`);

    const analysis: InvestigationResults["rootFundedWalletsAnalysis"][0] = {
      address: wallet,
      firstFunder: null,
      isFirstFunderRoot: false,
      hasDeployedTokens: false,
      hasFundedDeployers: false,
      recentActivity: false,
      currentBalance: 0,
      riskLevel: "NONE"
    };

    try {
      // 1. Check First Funder
      const related = await client.getRelatedWallets({
        address: wallet,
        chain: "solana",
        pagination: { page: 1, per_page: 30 }
      });
      await delay(2000);

      const firstFunder = related.find(r => r.relation === "First Funder");
      const deployedVia = related.find(r => r.relation === "Deployed via");

      analysis.firstFunder = firstFunder?.address || null;
      analysis.isFirstFunderRoot = firstFunder?.address === ROOT;
      analysis.hasDeployedTokens = !!deployedVia;

      console.log(`   First Funder: ${firstFunder?.address?.slice(0, 12) || "None"} ${analysis.isFirstFunderRoot ? "(ROOT ✅)" : ""}`);

      if (deployedVia) {
        console.log(`   🎯 HAS DEPLOYED TOKENS via ${deployedVia.address.slice(0, 12)}`);
      }

      // 2. Check if this wallet has funded any deployers
      // Get wallets this address has sent SOL to
      const txs = await client.getTransactions({
        address: wallet,
        chain: "solana",
        date: { from: "2025-01-01", to: "2025-12-31" },
        pagination: { page: 1, per_page: 50 }
      });
      await delay(2000);

      analysis.recentActivity = (txs.data?.length || 0) > 0;
      console.log(`   Recent transactions (2025): ${txs.data?.length || 0}`);

      // Check recipients
      const recipients = new Set<string>();
      txs.data?.forEach(tx => {
        tx.tokens_sent?.forEach(t => {
          if (t.token_symbol === "SOL" && t.to_address) {
            recipients.add(t.to_address);
          }
        });
      });

      // Check if any recipient is a known deployer
      for (const recipient of recipients) {
        if (KNOWN_DEPLOYERS.includes(recipient)) {
          analysis.hasFundedDeployers = true;
          console.log(`   ⚠️ HAS FUNDED KNOWN DEPLOYER: ${recipient.slice(0, 12)}`);
        }
      }

      // 3. Get current balance
      const balance = await client.getCurrentBalance({
        address: wallet,
        chain: "solana"
      });
      await delay(2000);

      analysis.currentBalance = balance.find(b => b.token_symbol === "SOL")?.token_amount || 0;
      console.log(`   Current SOL balance: ${analysis.currentBalance.toFixed(4)}`);

      // 4. Determine risk level
      if (analysis.isFirstFunderRoot && analysis.hasFundedDeployers) {
        analysis.riskLevel = "HIGH";
        console.log(`   ⚠️ RISK: HIGH - ROOT-funded AND has funded deployers`);
      } else if (analysis.isFirstFunderRoot && analysis.recentActivity && analysis.currentBalance > 0.1) {
        analysis.riskLevel = "MEDIUM";
        console.log(`   ⚠️ RISK: MEDIUM - ROOT-funded with recent activity and balance`);
      } else if (analysis.hasDeployedTokens) {
        analysis.riskLevel = "MEDIUM";
        console.log(`   ⚠️ RISK: MEDIUM - Has deployed tokens`);
      } else if (analysis.isFirstFunderRoot) {
        analysis.riskLevel = "LOW";
        console.log(`   RISK: LOW - ROOT-funded but no deployer activity`);
      } else {
        analysis.riskLevel = "NONE";
        console.log(`   RISK: NONE - Not ROOT-funded`);
      }

    } catch (e: any) {
      console.log(`   Error: ${e.message?.slice(0, 50)}`);
    }

    results.rootFundedWalletsAnalysis.push(analysis);
    console.log("");
  }

  console.log("\n📋 GAP 3 RESULT:");
  const highRisk = results.rootFundedWalletsAnalysis.filter(w => w.riskLevel === "HIGH");
  const mediumRisk = results.rootFundedWalletsAnalysis.filter(w => w.riskLevel === "MEDIUM");
  const rootFunded = results.rootFundedWalletsAnalysis.filter(w => w.isFirstFunderRoot);

  console.log(`   ROOT-funded wallets (confirmed): ${rootFunded.length}`);
  console.log(`   HIGH RISK wallets: ${highRisk.length}`);
  console.log(`   MEDIUM RISK wallets: ${mediumRisk.length}`);

  if (highRisk.length > 0) {
    console.log("\n   ⚠️ HIGH RISK WALLETS TO MONITOR:");
    highRisk.forEach(w => console.log(`      - ${w.address}`));
  }

  if (mediumRisk.length > 0) {
    console.log("\n   ⚠️ MEDIUM RISK WALLETS:");
    mediumRisk.forEach(w => console.log(`      - ${w.address} (${w.hasDeployedTokens ? "deployed tokens" : "active"})`));
  }
}

async function gap4_CheckPumpFunInteractions(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("GAP 4: CHECK PUMP.FUN PROGRAM INTERACTIONS");
  console.log("=".repeat(60));

  // Check known deployers for their "Deployed via" relationships
  console.log("\n4.1 Checking 'Deployed via' relationships for known deployers...");

  const pumpFunPrograms = new Set<string>();

  for (const deployer of KNOWN_DEPLOYERS) {
    console.log(`\n   Checking ${deployer.slice(0, 12)}...`);

    const related = await client.getRelatedWallets({
      address: deployer,
      chain: "solana",
      pagination: { page: 1, per_page: 30 }
    });
    await delay(2000);

    const deployedVia = related.filter(r => r.relation === "Deployed via");

    deployedVia.forEach(d => {
      console.log(`      Deployed via: ${d.address}`);
      pumpFunPrograms.add(d.address);
    });

    // Also check for other pump.fun related relations
    const pumpRelated = related.filter(r =>
      r.address.toLowerCase().includes("pump") ||
      r.relation.toLowerCase().includes("pump")
    );

    pumpRelated.forEach(p => {
      console.log(`      Pump-related: ${p.relation} - ${p.address.slice(0, 20)}`);
    });
  }

  console.log(`\n4.2 Found ${pumpFunPrograms.size} unique deployment programs`);

  // For each v49j-funded wallet, check if they have deployed via these programs
  console.log("\n4.3 Cross-referencing v49j-funded wallets with pump.fun...");

  for (const wallet of results.v49jFundedWallets) {
    if (wallet.deployedVia && pumpFunPrograms.has(wallet.deployedVia)) {
      console.log(`   ✅ ${wallet.address.slice(0, 12)}... deployed via pump.fun`);

      results.pumpFunDeployers.push({
        address: wallet.address,
        deployedVia: wallet.deployedVia,
        isConnectedToV49j: true,
        isConnectedToRoot: true // Assumes v49j is ROOT-funded
      });
    }
  }

  console.log("\n📋 GAP 4 RESULT:");
  console.log(`   pump.fun deployers connected to v49j: ${results.pumpFunDeployers.length}`);
  results.pumpFunDeployers.forEach(d => {
    const isKnown = KNOWN_DEPLOYERS.includes(d.address);
    console.log(`      - ${d.address.slice(0, 12)}... ${isKnown ? "(KNOWN)" : "⚠️ NEW"}`);
  });
}

async function generateConclusions(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("FINAL CONCLUSIONS");
  console.log("=".repeat(60));

  const conclusions: string[] = [];
  let confidence = 90;

  // Gap 1 conclusions
  if (results.rootToV49j.fundingChainVerified) {
    conclusions.push("✅ ROOT → v49j funding chain VERIFIED");
    confidence += 5;
  } else {
    conclusions.push(`❌ ROOT → v49j chain NOT verified. v49j's First Funder is: ${results.rootToV49j.v49jFirstFunder}`);
    confidence -= 20;
  }

  // Gap 2 conclusions
  const unknownDeployers = results.v49jFundedWallets.filter(w => !w.isKnownDeployer && w.hasDeployedTokens);
  const freshWallets = results.v49jFundedWallets.filter(w => w.isFresh && !w.isKnownDeployer && !w.hasDeployedTokens);

  if (unknownDeployers.length > 0) {
    conclusions.push(`⚠️ Found ${unknownDeployers.length} UNKNOWN DEPLOYERS funded by v49j`);
    unknownDeployers.forEach(w => results.newWalletsToMonitor.push(w.address));
    confidence -= 10;
  } else {
    conclusions.push("✅ All v49j-funded deployers are accounted for");
  }

  if (freshWallets.length > 0) {
    conclusions.push(`📋 Found ${freshWallets.length} fresh wallets funded by v49j (potential future deployers)`);
    freshWallets.forEach(w => {
      if (w.currentBalance > 0.01) {
        results.newWalletsToMonitor.push(w.address);
      }
    });
  }

  // Gap 3 conclusions
  const highRiskWallets = results.rootFundedWalletsAnalysis.filter(w => w.riskLevel === "HIGH");
  const mediumRiskWallets = results.rootFundedWalletsAnalysis.filter(w => w.riskLevel === "MEDIUM");

  if (highRiskWallets.length > 0) {
    conclusions.push(`⚠️ Found ${highRiskWallets.length} HIGH RISK alternative LEVEL 1 wallets`);
    highRiskWallets.forEach(w => results.newWalletsToMonitor.push(w.address));
    confidence -= 15;
  } else {
    conclusions.push("✅ No high-risk alternative LEVEL 1 wallets found");
    confidence += 5;
  }

  if (mediumRiskWallets.length > 0) {
    conclusions.push(`⚠️ Found ${mediumRiskWallets.length} MEDIUM RISK wallets requiring attention`);
  }

  // Gap 4 conclusions
  const newPumpDeployers = results.pumpFunDeployers.filter(d => !KNOWN_DEPLOYERS.includes(d.address));
  if (newPumpDeployers.length > 0) {
    conclusions.push(`⚠️ Found ${newPumpDeployers.length} NEW pump.fun deployers connected to funding chain`);
  } else {
    conclusions.push("✅ All pump.fun deployers in funding chain are known");
  }

  results.conclusions = conclusions;
  results.confidenceLevel = Math.max(0, Math.min(100, confidence));

  // Remove duplicates from monitor list
  results.newWalletsToMonitor = [...new Set(results.newWalletsToMonitor)];

  // Print conclusions
  console.log("\n📋 CONCLUSIONS:");
  conclusions.forEach(c => console.log(`   ${c}`));

  console.log(`\n📊 CONFIDENCE LEVEL: ${results.confidenceLevel}%`);

  if (results.newWalletsToMonitor.length > 0) {
    console.log("\n🎯 NEW WALLETS TO MONITOR:");
    results.newWalletsToMonitor.forEach(w => console.log(`   - ${w}`));
  } else {
    console.log("\n✅ No new wallets to add to monitoring");
  }

  // Save results
  const outputPath = path.join(process.cwd(), "data", "analysis", "thorough-investigation.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
}

async function main() {
  console.log("🔬 THOROUGH INVESTIGATION - FILLING ALL GAPS");
  console.log("=".repeat(60));
  console.log("This investigation will:");
  console.log("1. Verify ROOT → v49j First Funder relationship");
  console.log("2. Find ALL wallets where v49j is First Funder");
  console.log("3. Investigate ALL ROOT-funded wallets");
  console.log("4. Check pump.fun program interactions");
  console.log("=".repeat(60));

  await gap1_VerifyRootToV49j();
  await gap2_FindAllV49jFundedWallets();
  await gap3_InvestigateAllRootFundedWallets();
  await gap4_CheckPumpFunInteractions();
  await generateConclusions();
}

main().catch(console.error);
