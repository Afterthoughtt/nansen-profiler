/**
 * Deep Dive Investigation: TrollXRP Early Buyers
 *
 * Investigates 3 early buyers to determine if they are:
 * - Insiders (connected to deployer chain)
 * - Bots (high volume, many counterparties)
 * - Retail traders (random)
 *
 * For inactive wallets, performs full funder analysis to detect
 * "fresh wallet per launch" patterns.
 */

import "dotenv/config";
import * as fs from "fs";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";
import type { RelatedWallet, CounterpartyData, Transaction, CurrentBalance } from "./types.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Target wallets to investigate
const TARGET_WALLETS = [
  {
    address: "9EqrK8wW4JhSRcz8kJKSaiKaYvRfuUuNjYkkZqA7b7UX",
    name: "Wallet #1 (Position #5 TrollXRP)",
    knownPosition: { TrollXRP: 5 }
  },
  {
    address: "H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot",
    name: "Wallet #2 (Position #14 both tokens)",
    knownPosition: { XRPEP3: 14, TrollXRP: 14 }
  },
  {
    address: "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT",
    name: "Wallet #3 (Position #16 XRPEP3, #7 TrollXRP)",
    knownPosition: { XRPEP3: 16, TrollXRP: 7 }
  }
];

// Known deployer chain addresses
const KNOWN_CHAIN = {
  COINBASE_1: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
  COINBASE_2: "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q",
  ROOT: "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
  V49J: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  DEPLOYERS: [
    "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
    "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy"
  ]
};

// Bot detection thresholds
const BOT_THRESHOLDS = {
  VOLUME_USD: 1_000_000, // $1M+ total volume
  SOL_BALANCE: 100,      // 100+ SOL balance
  COUNTERPARTIES: 500    // 500+ unique counterparties
};

// Token addresses for cross-token check
const TOKENS = {
  XRPEP3: "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump",
  TrollXRP: "CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump"
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Result interface
interface EarlyBuyerInvestigation {
  wallet: string;
  name: string;

  // Phase 1: Funding
  firstFunder: string | null;
  fundingChain: string[];
  connectedToDeployerChain: boolean;
  connectionPath?: string;

  // Phase 2: Activity
  currentBalanceSOL: number;
  currentBalanceUSD: number;
  lastActivity: string | null;
  totalTransactions: number;
  isActive: boolean;

  // Phase 3: Bot Status
  isBot: boolean;
  botReasons: string[];
  totalVolumeUsd: number;
  counterpartyCount: number;

  // Phase 4: Insider Score
  tokensBought: string[];
  positions: Record<string, number>;
  avgBuyPosition: number;
  insiderScore: number;

  // Phase 5: Funder Analysis (if inactive)
  funderAnalysis?: {
    funderAddress: string;
    walletsCreated: string[];
    earlyBuyerWallets: string[];
    pattern: "fresh-wallet-per-launch" | "single-wallet" | "unknown";
  };

  // Conclusion
  verdict: "INSIDER" | "BOT" | "RETAIL" | "UNKNOWN";
  confidence: number;
  recommendation: string;
}

function isInDeployerChain(address: string): boolean {
  return (
    address === KNOWN_CHAIN.COINBASE_1 ||
    address === KNOWN_CHAIN.COINBASE_2 ||
    address === KNOWN_CHAIN.ROOT ||
    address === KNOWN_CHAIN.V49J ||
    KNOWN_CHAIN.DEPLOYERS.includes(address)
  );
}

function getChainConnectionPath(address: string): string {
  if (address === KNOWN_CHAIN.COINBASE_1 || address === KNOWN_CHAIN.COINBASE_2) return "Coinbase";
  if (address === KNOWN_CHAIN.ROOT) return "ROOT";
  if (address === KNOWN_CHAIN.V49J) return "v49j";
  if (KNOWN_CHAIN.DEPLOYERS.includes(address)) return "Known Deployer";
  return "";
}

async function investigateWallet(
  wallet: typeof TARGET_WALLETS[0],
  existingEarlyBuyers: Set<string>
): Promise<EarlyBuyerInvestigation> {
  console.log("\n" + "=".repeat(70));
  console.log(`🔍 INVESTIGATING: ${wallet.name}`);
  console.log(`   Address: ${wallet.address}`);
  console.log("=".repeat(70));

  const result: EarlyBuyerInvestigation = {
    wallet: wallet.address,
    name: wallet.name,
    firstFunder: null,
    fundingChain: [],
    connectedToDeployerChain: false,
    currentBalanceSOL: 0,
    currentBalanceUSD: 0,
    lastActivity: null,
    totalTransactions: 0,
    isActive: false,
    isBot: false,
    botReasons: [],
    totalVolumeUsd: 0,
    counterpartyCount: 0,
    tokensBought: Object.keys(wallet.knownPosition),
    positions: wallet.knownPosition,
    avgBuyPosition: 0,
    insiderScore: 0,
    verdict: "UNKNOWN",
    confidence: 0,
    recommendation: ""
  };

  // Calculate average position
  const positions = Object.values(wallet.knownPosition);
  result.avgBuyPosition = positions.reduce((a, b) => a + b, 0) / positions.length;

  // ==============================
  // PHASE 1: FUNDING CHAIN (3 levels)
  // ==============================
  console.log("\n📍 PHASE 1: Funding Chain Analysis");
  console.log("-".repeat(50));

  try {
    // Level 1: Get First Funder
    const related = await client.getRelatedWallets({
      address: wallet.address,
      chain: "solana",
      pagination: { page: 1, per_page: 50 }
    });
    await delay(2000);

    const firstFunderRel = related.find(r => r.relation === "First Funder");
    result.firstFunder = firstFunderRel?.address || null;

    if (result.firstFunder) {
      result.fundingChain.push(result.firstFunder);
      console.log(`   L1 First Funder: ${result.firstFunder.slice(0, 20)}...`);

      if (isInDeployerChain(result.firstFunder)) {
        result.connectedToDeployerChain = true;
        result.connectionPath = `Direct → ${getChainConnectionPath(result.firstFunder)}`;
        console.log(`   ⚠️ CONNECTED TO DEPLOYER CHAIN: ${result.connectionPath}`);
      }

      // Level 2: Get funder's First Funder
      const funderRelated = await client.getRelatedWallets({
        address: result.firstFunder,
        chain: "solana",
        pagination: { page: 1, per_page: 50 }
      });
      await delay(2000);

      const level2Funder = funderRelated.find(r => r.relation === "First Funder");
      if (level2Funder) {
        result.fundingChain.unshift(level2Funder.address);
        console.log(`   L2 Funder's Funder: ${level2Funder.address.slice(0, 20)}...`);

        if (!result.connectedToDeployerChain && isInDeployerChain(level2Funder.address)) {
          result.connectedToDeployerChain = true;
          result.connectionPath = `L2 → ${getChainConnectionPath(level2Funder.address)}`;
          console.log(`   ⚠️ CONNECTED TO DEPLOYER CHAIN: ${result.connectionPath}`);
        }

        // Level 3: Go one more level
        const level3Related = await client.getRelatedWallets({
          address: level2Funder.address,
          chain: "solana",
          pagination: { page: 1, per_page: 50 }
        });
        await delay(2000);

        const level3Funder = level3Related.find(r => r.relation === "First Funder");
        if (level3Funder) {
          result.fundingChain.unshift(level3Funder.address);
          console.log(`   L3 Root Funder: ${level3Funder.address.slice(0, 20)}...`);

          if (!result.connectedToDeployerChain && isInDeployerChain(level3Funder.address)) {
            result.connectedToDeployerChain = true;
            result.connectionPath = `L3 → ${getChainConnectionPath(level3Funder.address)}`;
            console.log(`   ⚠️ CONNECTED TO DEPLOYER CHAIN: ${result.connectionPath}`);
          }
        }
      }
    }

    // Add target wallet to end of chain
    result.fundingChain.push(wallet.address);
    console.log(`\n   Full chain: ${result.fundingChain.map(a => a.slice(0, 8)).join(" → ")}`);

  } catch (e: any) {
    console.log(`   ❌ Error in funding chain: ${e.message}`);
  }

  // ==============================
  // PHASE 2: ACTIVITY ANALYSIS
  // ==============================
  console.log("\n📍 PHASE 2: Activity Analysis");
  console.log("-".repeat(50));

  try {
    // Get current balance
    const balance = await client.getCurrentBalance({
      address: wallet.address,
      chain: "solana"
    });
    await delay(2000);

    const solBalance = balance.find(b => b.token_symbol === "SOL");
    result.currentBalanceSOL = solBalance?.token_amount || 0;
    result.currentBalanceUSD = balance.reduce((sum, b) => sum + (b.value_usd || 0), 0);

    console.log(`   SOL Balance: ${result.currentBalanceSOL.toFixed(4)} SOL`);
    console.log(`   Total USD Value: $${result.currentBalanceUSD.toFixed(2)}`);

    // Get transaction history
    const txResult = await client.getTransactions({
      address: wallet.address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: { page: 1, per_page: 100 }
    });
    await delay(2000);

    const transactions = txResult.data || [];
    result.totalTransactions = transactions.length;
    console.log(`   Total Transactions: ${result.totalTransactions}`);

    if (transactions.length > 0) {
      // Sort by timestamp descending
      transactions.sort((a, b) =>
        new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
      );

      result.lastActivity = transactions[0].block_timestamp;
      console.log(`   Last Activity: ${result.lastActivity}`);

      // Check if active in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result.isActive = new Date(result.lastActivity) > thirtyDaysAgo;
      console.log(`   Active (last 30 days): ${result.isActive ? "✅ YES" : "❌ NO"}`);
    }

  } catch (e: any) {
    console.log(`   ❌ Error in activity analysis: ${e.message}`);
  }

  // ==============================
  // PHASE 3: BOT DETECTION
  // ==============================
  console.log("\n📍 PHASE 3: Bot Detection");
  console.log("-".repeat(50));

  try {
    const counterparties = await client.getCounterparties({
      address: wallet.address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      group_by: "wallet",
      source_input: "Combined"
    });
    await delay(2000);

    result.counterpartyCount = counterparties.length;
    result.totalVolumeUsd = counterparties.reduce((sum, cp) => sum + (cp.total_volume_usd || 0), 0);

    console.log(`   Counterparties: ${result.counterpartyCount}`);
    console.log(`   Total Volume: $${result.totalVolumeUsd.toLocaleString()}`);

    // Bot detection checks
    if (result.totalVolumeUsd > BOT_THRESHOLDS.VOLUME_USD) {
      result.isBot = true;
      result.botReasons.push(`High volume: $${(result.totalVolumeUsd / 1_000_000).toFixed(1)}M`);
    }
    if (result.currentBalanceSOL > BOT_THRESHOLDS.SOL_BALANCE) {
      result.isBot = true;
      result.botReasons.push(`High SOL balance: ${result.currentBalanceSOL.toFixed(1)}`);
    }
    if (result.counterpartyCount > BOT_THRESHOLDS.COUNTERPARTIES) {
      result.isBot = true;
      result.botReasons.push(`Many counterparties: ${result.counterpartyCount}`);
    }

    // Check for bot-labeled counterparties
    const botLabels = counterparties.filter(cp =>
      cp.counterparty_address_label?.some(l =>
        l.toLowerCase().includes("bot") ||
        l.toLowerCase().includes("mev") ||
        l.toLowerCase().includes("arbitrage")
      )
    );
    if (botLabels.length > counterparties.length * 0.3) {
      result.isBot = true;
      result.botReasons.push(`30%+ bot counterparties`);
    }

    console.log(`   Is Bot: ${result.isBot ? "⚠️ YES" : "✅ NO"}`);
    if (result.botReasons.length > 0) {
      console.log(`   Bot Reasons: ${result.botReasons.join(", ")}`);
    }

    // Show top counterparties
    console.log("\n   Top 5 Counterparties:");
    const topCps = counterparties
      .sort((a, b) => (b.total_volume_usd || 0) - (a.total_volume_usd || 0))
      .slice(0, 5);

    for (const cp of topCps) {
      const labels = cp.counterparty_address_label?.join(", ") || "";
      let note = "";
      if (isInDeployerChain(cp.counterparty_address)) {
        note = " ← DEPLOYER CHAIN!";
        if (!result.connectedToDeployerChain) {
          result.connectedToDeployerChain = true;
          result.connectionPath = `Counterparty → ${getChainConnectionPath(cp.counterparty_address)}`;
        }
      }
      console.log(`      ${cp.counterparty_address.slice(0, 12)}... | $${(cp.total_volume_usd || 0).toFixed(2)} | ${labels}${note}`);
    }

  } catch (e: any) {
    console.log(`   ❌ Error in bot detection: ${e.message}`);
  }

  // ==============================
  // PHASE 4: INSIDER SCORE
  // ==============================
  console.log("\n📍 PHASE 4: Insider Score Calculation");
  console.log("-".repeat(50));

  // Base score from positions
  let score = 0;

  // Cross-token bonus (bought both v49j-chain tokens)
  if (result.tokensBought.includes("XRPEP3") && result.tokensBought.includes("TrollXRP")) {
    score += 40;
    console.log(`   +40: Cross-token buyer (both XRPEP3 & TrollXRP)`);
  }

  // Position bonus (lower position = higher score)
  if (result.avgBuyPosition <= 10) {
    score += 30;
    console.log(`   +30: Top 10 average position (${result.avgBuyPosition.toFixed(1)})`);
  } else if (result.avgBuyPosition <= 20) {
    score += 20;
    console.log(`   +20: Top 20 average position (${result.avgBuyPosition.toFixed(1)})`);
  }

  // Deployer chain connection
  if (result.connectedToDeployerChain) {
    score += 30;
    console.log(`   +30: Connected to deployer chain (${result.connectionPath})`);
  }

  // Bot penalty
  if (result.isBot) {
    score -= 50;
    console.log(`   -50: Bot detected`);
  }

  result.insiderScore = Math.max(0, Math.min(100, score));
  console.log(`\n   Final Insider Score: ${result.insiderScore}/100`);

  // ==============================
  // PHASE 5: FUNDER ANALYSIS (if inactive)
  // ==============================
  if (!result.isActive && result.firstFunder && result.currentBalanceSOL < 0.1) {
    console.log("\n📍 PHASE 5: Full Funder Analysis (wallet inactive)");
    console.log("-".repeat(50));

    try {
      // Get all wallets the funder created
      const funderRelated = await client.getRelatedWallets({
        address: result.firstFunder,
        chain: "solana",
        pagination: { page: 1, per_page: 100 }
      });
      await delay(2000);

      // Find wallets where this funder is "First Funder"
      // We need to check inverse - wallets that have this address as their First Funder
      // This requires checking transactions outbound from funder
      const funderTxs = await client.getTransactions({
        address: result.firstFunder,
        chain: "solana",
        date: DATES.FULL_HISTORY,
        pagination: { page: 1, per_page: 100 }
      });
      await delay(2000);

      // Extract unique recipients
      const recipients = new Set<string>();
      for (const tx of funderTxs.data || []) {
        for (const sent of tx.tokens_sent || []) {
          if (sent.to_address && sent.token_symbol === "SOL") {
            recipients.add(sent.to_address);
          }
        }
      }

      const walletsCreated = Array.from(recipients);
      console.log(`   Funder has sent SOL to ${walletsCreated.length} wallets`);

      // Check which of these wallets are also early buyers
      const earlyBuyerWallets = walletsCreated.filter(w => existingEarlyBuyers.has(w));
      console.log(`   Of those, ${earlyBuyerWallets.length} are also early buyers`);

      result.funderAnalysis = {
        funderAddress: result.firstFunder,
        walletsCreated,
        earlyBuyerWallets,
        pattern: earlyBuyerWallets.length >= 2 ? "fresh-wallet-per-launch" :
                 earlyBuyerWallets.length === 1 ? "single-wallet" : "unknown"
      };

      console.log(`   Pattern: ${result.funderAnalysis.pattern}`);

      if (earlyBuyerWallets.length > 0) {
        console.log(`\n   ⚠️ FUNDER'S OTHER EARLY BUYER WALLETS:`);
        for (const w of earlyBuyerWallets.slice(0, 5)) {
          console.log(`      ${w}`);
        }
      }

    } catch (e: any) {
      console.log(`   ❌ Error in funder analysis: ${e.message}`);
    }
  }

  // ==============================
  // CONCLUSION
  // ==============================
  console.log("\n📍 CONCLUSION");
  console.log("-".repeat(50));

  // Determine verdict
  if (result.isBot) {
    result.verdict = "BOT";
    result.confidence = 80;
    result.recommendation = "Ignore - automated trading bot";
  } else if (result.insiderScore >= 60) {
    result.verdict = "INSIDER";
    result.confidence = Math.min(95, result.insiderScore + 20);
    result.recommendation = result.isActive
      ? "MONITOR - Active insider, watch for next launch"
      : result.funderAnalysis?.pattern === "fresh-wallet-per-launch"
        ? "MONITOR FUNDER - Uses fresh wallets per launch"
        : "Watch - Potential insider but inactive";
  } else if (result.insiderScore >= 30) {
    result.verdict = "UNKNOWN";
    result.confidence = 50;
    result.recommendation = "Low priority - Some insider signals but inconclusive";
  } else {
    result.verdict = "RETAIL";
    result.confidence = 70;
    result.recommendation = "Ignore - Likely retail trader";
  }

  console.log(`   Verdict: ${result.verdict}`);
  console.log(`   Confidence: ${result.confidence}%`);
  console.log(`   Recommendation: ${result.recommendation}`);

  return result;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║     DEEP DIVE: TrollXRP Early Buyers Investigation                 ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");

  // Load existing early buyers from insider-v3.json for cross-reference
  let existingEarlyBuyers = new Set<string>();
  try {
    const insiderV3 = JSON.parse(fs.readFileSync("data/analysis/insider-v3.json", "utf-8"));
    // Add all first 20 buyers from both tokens
    for (const token of Object.values(insiderV3.tokens) as any[]) {
      for (const buyer of token.first20Buyers || []) {
        existingEarlyBuyers.add(buyer.address);
      }
    }
    console.log(`\nLoaded ${existingEarlyBuyers.size} known early buyers for cross-reference`);
  } catch (e) {
    console.log("\nCouldn't load insider-v3.json for cross-reference");
  }

  const results: EarlyBuyerInvestigation[] = [];

  for (const wallet of TARGET_WALLETS) {
    const result = await investigateWallet(wallet, existingEarlyBuyers);
    results.push(result);
  }

  // Summary
  console.log("\n\n" + "═".repeat(70));
  console.log("                           SUMMARY");
  console.log("═".repeat(70));

  console.log("\n┌─────────────────────────┬───────────┬────────┬────────────────────────────┐");
  console.log("│ Wallet                  │ Verdict   │ Score  │ Recommendation             │");
  console.log("├─────────────────────────┼───────────┼────────┼────────────────────────────┤");

  for (const r of results) {
    const addr = r.wallet.slice(0, 8) + "...";
    const verdict = r.verdict.padEnd(9);
    const score = `${r.insiderScore}/100`.padStart(6);
    const rec = r.recommendation.slice(0, 26).padEnd(26);
    console.log(`│ ${addr.padEnd(23)} │ ${verdict} │ ${score} │ ${rec} │`);
  }

  console.log("└─────────────────────────┴───────────┴────────┴────────────────────────────┘");

  // Wallets to monitor
  const toMonitor = results.filter(r =>
    r.verdict === "INSIDER" ||
    r.funderAnalysis?.pattern === "fresh-wallet-per-launch"
  );

  if (toMonitor.length > 0) {
    console.log("\n🎯 WALLETS/FUNDERS TO MONITOR:");
    for (const r of toMonitor) {
      if (r.isActive) {
        console.log(`   ${r.wallet} (active insider)`);
      } else if (r.funderAnalysis?.pattern === "fresh-wallet-per-launch") {
        console.log(`   ${r.funderAnalysis.funderAddress} (funder uses fresh wallets)`);
      }
    }
  }

  // Deployer chain connections
  const chainConnected = results.filter(r => r.connectedToDeployerChain);
  if (chainConnected.length > 0) {
    console.log("\n🔗 DEPLOYER CHAIN CONNECTIONS:");
    for (const r of chainConnected) {
      console.log(`   ${r.wallet.slice(0, 12)}... → ${r.connectionPath}`);
    }
  }

  // Save results
  const output = {
    timestamp: new Date().toISOString(),
    targetWallets: TARGET_WALLETS.map(w => w.address),
    investigations: results,
    summary: {
      total: results.length,
      insiders: results.filter(r => r.verdict === "INSIDER").length,
      bots: results.filter(r => r.verdict === "BOT").length,
      retail: results.filter(r => r.verdict === "RETAIL").length,
      unknown: results.filter(r => r.verdict === "UNKNOWN").length,
      chainConnections: chainConnected.length,
      toMonitor: toMonitor.map(r => r.isActive ? r.wallet : r.funderAnalysis?.funderAddress)
    }
  };

  fs.writeFileSync(
    "data/analysis/early-buyer-investigation.json",
    JSON.stringify(output, null, 2)
  );
  console.log("\n✅ Results saved to data/analysis/early-buyer-investigation.json");
}

main().catch(console.error);
