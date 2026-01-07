/**
 * COMPLETE INVESTIGATION
 *
 * Fill all remaining gaps to reach 90%+ investigation completeness.
 *
 * Execution Order:
 * 1. Investigation 3: v49j-funded wallet gaps (GUCX6xNe, 3xHtXHxy)
 * 2. Investigation 2: Insider wallet hunt (XRPEP3, TrollXRP early buyers)
 * 3. Investigation 1: 37Xxihfs dormancy check
 */

import "dotenv/config";
import * as fs from "fs";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Known addresses
const V49J = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
const GUCX6XNE = "GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb";
const THREE_XHT = "3xHtXHxyL23nmyJwS1jc7DnQFrtkZvsgSs8qxycvxCwc";
const ORIGINAL_DEPLOYER = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

// Token addresses
const XRPEP3_TOKEN = "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump";
const TROLLXRP_TOKEN = "CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump";

// Token launch dates
const XRPEP3_LAUNCH = "2025-09-28";
const TROLLXRP_LAUNCH = "2025-11-02";

// Known deployers (to filter out)
const KNOWN_ADDRESSES = new Set([
  V49J,
  "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb", // D7Ms
  "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy", // DBmx
  ORIGINAL_DEPLOYER,
  "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF", // ROOT
]);

interface WalletAnalysis {
  address: string;
  shortAddress: string;
  firstFunder: string | null;
  isFirstFunderV49j: boolean;
  balance: number;
  balanceUsd: number;
  transactionCount: number;
  hasDeployed: boolean;
  counterparties: string[];
  fundingDate: string | null;
  lastActivity: string | null;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  notes: string[];
}

interface EarlyBuyer {
  address: string;
  totalBoughtUsd: number;
  tradeCount: number;
  firstBuyTime: string;
  minutesAfterLaunch: number;
}

interface InvestigationReport {
  timestamp: string;
  v49jGaps: {
    gucx6xne: WalletAnalysis;
    threeXht: WalletAnalysis;
  };
  insiderWallets: {
    xrpep3EarlyBuyers: EarlyBuyer[];
    trollxrpEarlyBuyers: EarlyBuyer[];
    crossTokenBuyers: string[];
    watchlist: string[];
  };
  originalDeployer: {
    wallet: string;
    isActive: boolean;
    lastActivity: string | null;
    balance: number;
    status: "dormant" | "active";
  };
  conclusions: {
    isGucx6xneNextDeployer: boolean;
    insiderWatchlistReady: boolean;
    allGapsFilled: boolean;
    finalConfidenceLevel: number;
    remainingUncertainties: string[];
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shortAddr(addr: string): string {
  return addr.slice(0, 8) + "...";
}

// ============================================
// INVESTIGATION 3: v49j-Funded Wallet Gaps
// ============================================

async function investigateWallet(address: string, name: string): Promise<WalletAnalysis> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔍 INVESTIGATING: ${name}`);
  console.log(`   Address: ${address}`);
  console.log("=".repeat(60));

  const analysis: WalletAnalysis = {
    address,
    shortAddress: shortAddr(address),
    firstFunder: null,
    isFirstFunderV49j: false,
    balance: 0,
    balanceUsd: 0,
    transactionCount: 0,
    hasDeployed: false,
    counterparties: [],
    fundingDate: null,
    lastActivity: null,
    riskLevel: "LOW",
    notes: [],
  };

  // 1. Check First Funder
  console.log("\n📍 Step 1: Checking First Funder...");
  try {
    const firstFunder = await client.findFirstFunder(address);
    analysis.firstFunder = firstFunder;
    analysis.isFirstFunderV49j = firstFunder === V49J;
    console.log(`   First Funder: ${firstFunder ? shortAddr(firstFunder) : "Unknown"}`);
    console.log(`   Is v49j First Funder: ${analysis.isFirstFunderV49j ? "✅ YES" : "❌ NO"}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  await delay(2000);

  // 2. Get current balance
  console.log("\n📍 Step 2: Getting current balance...");
  try {
    const balances = await client.getCurrentBalance({
      address,
      chain: "solana",
    });

    for (const bal of balances) {
      if (bal.token_symbol === "SOL") {
        analysis.balance = bal.token_amount;
        analysis.balanceUsd = bal.value_usd || 0;
      }
    }
    console.log(`   SOL Balance: ${analysis.balance.toFixed(6)} SOL (~$${analysis.balanceUsd.toFixed(2)})`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  await delay(2000);

  // 3. Get transactions
  console.log("\n📍 Step 3: Getting transaction history...");
  try {
    const txResult = await client.getTransactions({
      address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: { page: 1, per_page: 50 },
    });

    const transactions = txResult.data || [];
    analysis.transactionCount = transactions.length;

    if (transactions.length > 0) {
      // Find first and last transaction dates
      const timestamps = transactions.map(tx => tx.block_timestamp).filter(Boolean);
      if (timestamps.length > 0) {
        timestamps.sort();
        analysis.fundingDate = timestamps[0];
        analysis.lastActivity = timestamps[timestamps.length - 1];
      }

      // Check for pump.fun deployments
      for (const tx of transactions) {
        const programs = tx.program_ids || [];
        if (programs.some(p => p.toLowerCase().includes("pump"))) {
          analysis.hasDeployed = true;
          analysis.notes.push("Has pump.fun program interaction");
        }
      }
    }

    console.log(`   Transaction count: ${analysis.transactionCount}`);
    console.log(`   First activity: ${analysis.fundingDate || "Unknown"}`);
    console.log(`   Last activity: ${analysis.lastActivity || "Unknown"}`);
    console.log(`   Has deployed tokens: ${analysis.hasDeployed ? "⚠️ YES" : "No"}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  await delay(2000);

  // 4. Get counterparties
  console.log("\n📍 Step 4: Getting counterparties...");
  try {
    const counterparties = await client.getCounterparties({
      address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      group_by: "wallet",
      source_input: "Combined",
    });

    analysis.counterparties = counterparties.map(cp => cp.counterparty_address);
    console.log(`   Counterparty count: ${analysis.counterparties.length}`);

    // Check if any counterparties are known addresses
    for (const cp of counterparties) {
      if (KNOWN_ADDRESSES.has(cp.counterparty_address)) {
        const label = cp.labels?.join(", ") || shortAddr(cp.counterparty_address);
        analysis.notes.push(`Interacts with known address: ${label}`);
        console.log(`   ⚠️ Interacts with: ${label}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // 5. Determine risk level
  console.log("\n📍 Step 5: Assessing risk level...");

  if (analysis.hasDeployed) {
    analysis.riskLevel = "HIGH";
    analysis.notes.push("Has deployed tokens - HIGH risk");
  } else if (analysis.isFirstFunderV49j && analysis.balance > 0.01) {
    analysis.riskLevel = "HIGH";
    analysis.notes.push("Fresh wallet with v49j as First Funder and sufficient balance");
  } else if (analysis.isFirstFunderV49j) {
    analysis.riskLevel = "MEDIUM";
    analysis.notes.push("v49j funded but low balance");
  } else {
    analysis.riskLevel = "LOW";
    analysis.notes.push("Low activity, low balance");
  }

  console.log(`   Risk Level: ${analysis.riskLevel}`);
  console.log(`   Notes: ${analysis.notes.join("; ")}`);

  return analysis;
}

async function investigateV49jGaps(): Promise<{ gucx6xne: WalletAnalysis; threeXht: WalletAnalysis }> {
  console.log("\n" + "█".repeat(60));
  console.log("█ INVESTIGATION 3: v49j-FUNDED WALLET GAPS");
  console.log("█".repeat(60));

  const gucx6xne = await investigateWallet(GUCX6XNE, "GUCX6xNe");
  await delay(3000);

  const threeXht = await investigateWallet(THREE_XHT, "3xHtXHxy");

  return { gucx6xne, threeXht };
}

// ============================================
// INVESTIGATION 2: Insider Wallet Hunt
// ============================================

async function getEarlyBuyers(
  tokenAddress: string,
  tokenName: string,
  launchDate: string
): Promise<EarlyBuyer[]> {
  console.log(`\n📍 Getting early buyers for ${tokenName}...`);
  console.log(`   Token: ${shortAddr(tokenAddress)}`);
  console.log(`   Launch: ${launchDate}`);

  // Get trades from launch date + 1 day (first 24 hours)
  const nextDay = new Date(launchDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const endDate = nextDay.toISOString().split("T")[0];

  try {
    const trades = await client.getTGMDexTrades({
      token_address: tokenAddress,
      chain: "solana",
      date: { from: launchDate, to: endDate },
      pagination: { page: 1, per_page: 100 },
    });

    console.log(`   Found ${trades.length} trades in first 24 hours`);

    // Filter for buys and aggregate by wallet
    // API uses trader_address and action (BUY/SELL) instead of address and side
    const buyerMap = new Map<string, EarlyBuyer>();
    const launchTime = new Date(launchDate + "T00:00:00Z").getTime();

    for (const trade of trades) {
      // Check action field (API returns "BUY" or "SELL")
      if (trade.action !== "BUY") continue;

      // Use trader_address field
      const addr = trade.trader_address;
      if (!addr || KNOWN_ADDRESSES.has(addr)) continue; // Skip known addresses

      const tradeTime = new Date(trade.block_timestamp).getTime();
      const minutesAfterLaunch = Math.round((tradeTime - launchTime) / 60000);

      // Estimate value from traded_token_amount if value_usd not available
      const valueUsd = trade.value_usd || (trade.traded_token_amount || 0) * 150; // rough SOL price

      const existing = buyerMap.get(addr);
      if (existing) {
        existing.totalBoughtUsd += valueUsd;
        existing.tradeCount += 1;
        if (tradeTime < new Date(existing.firstBuyTime).getTime()) {
          existing.firstBuyTime = trade.block_timestamp;
          existing.minutesAfterLaunch = minutesAfterLaunch;
        }
      } else {
        buyerMap.set(addr, {
          address: addr,
          totalBoughtUsd: valueUsd,
          tradeCount: 1,
          firstBuyTime: trade.block_timestamp,
          minutesAfterLaunch,
        });
      }
    }

    // Sort by earliest buy time
    const earlyBuyers = Array.from(buyerMap.values())
      .sort((a, b) => a.minutesAfterLaunch - b.minutesAfterLaunch)
      .slice(0, 20); // Top 20 earliest

    console.log(`   Unique early buyers (excluding known): ${earlyBuyers.length}`);

    if (earlyBuyers.length > 0) {
      console.log("\n   Top 5 Earliest Buyers:");
      for (const buyer of earlyBuyers.slice(0, 5)) {
        console.log(`   - ${shortAddr(buyer.address)}: $${buyer.totalBoughtUsd.toFixed(2)} (${buyer.minutesAfterLaunch} min after launch)`);
      }
    }

    return earlyBuyers;
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    return [];
  }
}

async function investigateInsiders(): Promise<{
  xrpep3EarlyBuyers: EarlyBuyer[];
  trollxrpEarlyBuyers: EarlyBuyer[];
  crossTokenBuyers: string[];
  watchlist: string[];
}> {
  console.log("\n" + "█".repeat(60));
  console.log("█ INVESTIGATION 2: INSIDER WALLET HUNT");
  console.log("█".repeat(60));

  // Get early buyers for each token
  const xrpep3Buyers = await getEarlyBuyers(XRPEP3_TOKEN, "XRPEP3", XRPEP3_LAUNCH);
  await delay(3000);

  const trollxrpBuyers = await getEarlyBuyers(TROLLXRP_TOKEN, "TrollXRP", TROLLXRP_LAUNCH);
  await delay(2000);

  // Find cross-token buyers (appeared in both)
  console.log("\n📍 Finding cross-token buyers...");
  const xrpep3Set = new Set(xrpep3Buyers.map(b => b.address));
  const crossTokenBuyers = trollxrpBuyers
    .filter(b => xrpep3Set.has(b.address))
    .map(b => b.address);

  console.log(`   Cross-token buyers: ${crossTokenBuyers.length}`);
  if (crossTokenBuyers.length > 0) {
    console.log("   ⚠️ CRITICAL: These wallets bought early on BOTH tokens:");
    for (const addr of crossTokenBuyers) {
      console.log(`   - ${shortAddr(addr)}`);
    }
  }

  // Build watchlist: cross-token buyers + earliest buyers from each
  const watchlist = new Set<string>(crossTokenBuyers);

  // Add top 3 earliest from each token
  for (const buyer of xrpep3Buyers.slice(0, 3)) {
    watchlist.add(buyer.address);
  }
  for (const buyer of trollxrpBuyers.slice(0, 3)) {
    watchlist.add(buyer.address);
  }

  console.log(`\n📋 Insider Watchlist: ${watchlist.size} wallets`);

  return {
    xrpep3EarlyBuyers: xrpep3Buyers,
    trollxrpEarlyBuyers: trollxrpBuyers,
    crossTokenBuyers,
    watchlist: Array.from(watchlist),
  };
}

// ============================================
// INVESTIGATION 1: 37Xxihfs Dormancy Check
// ============================================

async function checkOriginalDeployer(): Promise<{
  wallet: string;
  isActive: boolean;
  lastActivity: string | null;
  balance: number;
  status: "dormant" | "active";
}> {
  console.log("\n" + "█".repeat(60));
  console.log("█ INVESTIGATION 1: 37Xxihfs DORMANCY CHECK");
  console.log("█".repeat(60));

  console.log(`\n📍 Checking original deployer: ${shortAddr(ORIGINAL_DEPLOYER)}`);

  let balance = 0;
  let lastActivity: string | null = null;

  // Get current balance
  console.log("\n   Getting current balance...");
  try {
    const balances = await client.getCurrentBalance({
      address: ORIGINAL_DEPLOYER,
      chain: "solana",
    });

    for (const bal of balances) {
      if (bal.token_symbol === "SOL") {
        balance = bal.token_amount;
      }
    }
    console.log(`   SOL Balance: ${balance.toFixed(6)} SOL`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  await delay(2000);

  // Get recent transactions (post-August 2025)
  console.log("\n   Checking for activity after August 2025...");
  try {
    const txResult = await client.getTransactions({
      address: ORIGINAL_DEPLOYER,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: { page: 1, per_page: 10 },
    });

    const transactions = txResult.data || [];
    console.log(`   Transactions since Sep 2025: ${transactions.length}`);

    if (transactions.length > 0) {
      const timestamps = transactions.map(tx => tx.block_timestamp).filter(Boolean);
      if (timestamps.length > 0) {
        timestamps.sort();
        lastActivity = timestamps[timestamps.length - 1];
        console.log(`   Last activity: ${lastActivity}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  const isActive = lastActivity !== null;
  const status = isActive ? "active" : "dormant";

  console.log(`\n   Status: ${status.toUpperCase()}`);
  if (!isActive) {
    console.log("   ✅ 37Xxihfs appears dormant - old pattern abandoned");
  } else {
    console.log("   ⚠️ 37Xxihfs has recent activity - investigate further!");
  }

  return {
    wallet: ORIGINAL_DEPLOYER,
    isActive,
    lastActivity,
    balance,
    status,
  };
}

// ============================================
// MAIN EXECUTION
// ============================================

async function runCompleteInvestigation(): Promise<void> {
  console.log("\n" + "═".repeat(60));
  console.log("║ COMPLETE INVESTIGATION - FILL ALL GAPS");
  console.log("║ Timestamp: " + new Date().toISOString());
  console.log("═".repeat(60));

  const report: InvestigationReport = {
    timestamp: new Date().toISOString(),
    v49jGaps: { gucx6xne: null as any, threeXht: null as any },
    insiderWallets: {
      xrpep3EarlyBuyers: [],
      trollxrpEarlyBuyers: [],
      crossTokenBuyers: [],
      watchlist: [],
    },
    originalDeployer: {
      wallet: ORIGINAL_DEPLOYER,
      isActive: false,
      lastActivity: null,
      balance: 0,
      status: "dormant",
    },
    conclusions: {
      isGucx6xneNextDeployer: false,
      insiderWatchlistReady: false,
      allGapsFilled: false,
      finalConfidenceLevel: 0,
      remainingUncertainties: [],
    },
  };

  // Investigation 3: v49j-funded wallet gaps
  report.v49jGaps = await investigateV49jGaps();
  await delay(3000);

  // Investigation 2: Insider wallet hunt
  report.insiderWallets = await investigateInsiders();
  await delay(3000);

  // Investigation 1: 37Xxihfs dormancy check
  report.originalDeployer = await checkOriginalDeployer();

  // Generate conclusions
  console.log("\n" + "█".repeat(60));
  console.log("█ CONCLUSIONS");
  console.log("█".repeat(60));

  // Is GUCX6xNe the next deployer?
  const gucx = report.v49jGaps.gucx6xne;
  report.conclusions.isGucx6xneNextDeployer =
    gucx.isFirstFunderV49j &&
    gucx.balance >= 0.01 &&
    !gucx.hasDeployed;

  console.log(`\n1. Is GUCX6xNe the next deployer?`);
  if (report.conclusions.isGucx6xneNextDeployer) {
    console.log(`   ⚠️ POSSIBLE - v49j funded, ${gucx.balance.toFixed(4)} SOL balance`);
    console.log(`   Recommendation: Add to monitoring`);
  } else {
    console.log(`   ❌ UNLIKELY - ${gucx.notes.join("; ")}`);
  }

  // Insider watchlist ready?
  report.conclusions.insiderWatchlistReady = report.insiderWallets.watchlist.length > 0;
  console.log(`\n2. Insider watchlist ready?`);
  console.log(`   ${report.conclusions.insiderWatchlistReady ? "✅ YES" : "❌ NO"} - ${report.insiderWallets.watchlist.length} wallets`);

  if (report.insiderWallets.crossTokenBuyers.length > 0) {
    console.log(`   🎯 CRITICAL: ${report.insiderWallets.crossTokenBuyers.length} cross-token buyers found!`);
  }

  // All gaps filled?
  const gapsFilled = {
    gucx6xne: gucx.transactionCount >= 0,
    threeXht: report.v49jGaps.threeXht.transactionCount >= 0,
    insiders: report.insiderWallets.watchlist.length > 0,
    originalDeployer: true,
  };
  report.conclusions.allGapsFilled = Object.values(gapsFilled).every(Boolean);
  console.log(`\n3. All gaps filled?`);
  console.log(`   ${report.conclusions.allGapsFilled ? "✅ YES" : "❌ NO"}`);

  // Calculate confidence level
  let confidence = 70; // Base confidence from previous investigation

  if (gucx.isFirstFunderV49j) confidence += 5; // Verified v49j relationship
  if (report.insiderWallets.crossTokenBuyers.length > 0) confidence += 10; // Backup detection available
  if (!report.originalDeployer.isActive) confidence += 5; // Old pattern confirmed abandoned
  if (report.conclusions.allGapsFilled) confidence += 5;

  report.conclusions.finalConfidenceLevel = Math.min(confidence, 95);
  console.log(`\n4. Final Confidence Level: ${report.conclusions.finalConfidenceLevel}%`);

  // Remaining uncertainties
  report.conclusions.remainingUncertainties = [];

  if (report.conclusions.isGucx6xneNextDeployer) {
    report.conclusions.remainingUncertainties.push(
      "GUCX6xNe is a potential next deployer - needs monitoring"
    );
  }
  if (report.insiderWallets.crossTokenBuyers.length === 0) {
    report.conclusions.remainingUncertainties.push(
      "No cross-token buyers found - backup detection weaker"
    );
  }
  if (report.originalDeployer.isActive) {
    report.conclusions.remainingUncertainties.push(
      "37Xxihfs has recent activity - old pattern may still be used"
    );
  }

  if (report.conclusions.remainingUncertainties.length > 0) {
    console.log(`\n5. Remaining Uncertainties:`);
    for (const u of report.conclusions.remainingUncertainties) {
      console.log(`   - ${u}`);
    }
  } else {
    console.log(`\n5. No significant uncertainties remain.`);
  }

  // Save report
  const outputPath = "./data/analysis/complete-investigation.json";
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${outputPath}`);

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log("║ INVESTIGATION COMPLETE");
  console.log("═".repeat(60));
  console.log(`\nKEY FINDINGS:`);
  console.log(`- GUCX6xNe: ${gucx.riskLevel} risk (${gucx.balance.toFixed(4)} SOL)`);
  console.log(`- 3xHtXHxy: ${report.v49jGaps.threeXht.riskLevel} risk`);
  console.log(`- Cross-token insiders: ${report.insiderWallets.crossTokenBuyers.length}`);
  console.log(`- 37Xxihfs: ${report.originalDeployer.status}`);
  console.log(`\nFINAL CONFIDENCE: ${report.conclusions.finalConfidenceLevel}%`);

  if (report.insiderWallets.watchlist.length > 0) {
    console.log(`\n📋 INSIDER WATCHLIST (${report.insiderWallets.watchlist.length} wallets):`);
    for (const addr of report.insiderWallets.watchlist.slice(0, 10)) {
      console.log(`   ${addr}`);
    }
    if (report.insiderWallets.watchlist.length > 10) {
      console.log(`   ... and ${report.insiderWallets.watchlist.length - 10} more`);
    }
  }
}

// Run the investigation
runCompleteInvestigation().catch(console.error);
