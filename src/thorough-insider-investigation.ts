/**
 * Thorough Insider Investigation
 *
 * 8-phase deep dive on suspected insider wallets:
 * 1. Extended Funding Chain (until CEX/dead-end)
 * 2. Reverse Funding Analysis (sibling wallets)
 * 3. Cross-Token Activity (all 5 XRP tokens)
 * 4. Profit Flow Tracking
 * 5. Temporal Correlation
 * 6. Entity Clustering
 * 7. CHOCO Quick Check
 * 8. Counterparty Network
 */

import "dotenv/config";
import * as fs from "fs";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";
import type { RelatedWallet, CounterpartyData, Transaction, TGMDexTrade } from "./types.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// =============================================================================
// CONFIGURATION
// =============================================================================

const TARGET_WALLETS = [
  {
    address: "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT",
    name: "Wallet #1",
    knownPositions: { XRPEP3: 16, TrollXRP: 7 },
  },
  {
    address: "H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot",
    name: "Wallet #2 (CHOCO Funder)",
    knownPositions: { XRPEP3: 14, TrollXRP: 14 },
  },
  {
    address: "9EqrK8wW4JhSRcz8kJKSaiKaYvRfuUuNjYkkZqA7b7UX",
    name: "Wallet #3",
    knownPositions: { TrollXRP: 5 },
  },
];

// Known deployer chain addresses
const DEPLOYER_CHAIN = {
  COINBASE_1: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
  COINBASE_2: "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q",
  ROOT: "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
  V49J: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  DEPLOYERS: [
    "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
    "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
  ],
};

// All deployer chain addresses for quick lookup
const ALL_DEPLOYER_CHAIN_ADDRESSES = new Set([
  DEPLOYER_CHAIN.COINBASE_1,
  DEPLOYER_CHAIN.COINBASE_2,
  DEPLOYER_CHAIN.ROOT,
  DEPLOYER_CHAIN.V49J,
  ...DEPLOYER_CHAIN.DEPLOYERS,
]);

// XRP-themed tokens to check
const XRP_TOKENS = [
  { ticker: "ArkXRP", address: "2rQcoMECcsU3UBNfpsUxegnHc9js7usb2XagwUK3pump", launchDate: "2025-06-15" },
  { ticker: "DogwifXRP", address: "8mETm8mxyn7gP1igZLv4DryquuYLjcekkrQBVpZpFHvC", launchDate: "2025-07-20" },
  { ticker: "WFXRP", address: "FnzYzrkRL1JLHmxS8QctidKDGJgJRa6BN4QH3hkVpump", launchDate: "2025-08-24" },
  { ticker: "XRPEP3", address: "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump", launchDate: "2025-09-28" },
  { ticker: "TrollXRP", address: "CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump", launchDate: "2025-11-02" },
];

// Bot detection thresholds
const BOT_THRESHOLDS = {
  VOLUME_USD: 1_000_000,
  SOL_BALANCE: 100,
  COUNTERPARTIES: 500,
};

// =============================================================================
// TYPES
// =============================================================================

interface FundingChainLevel {
  address: string;
  level: number;
  label?: string;
  isDeployerChain: boolean;
  role?: string;
}

interface TokenBuyInfo {
  token: string;
  tokenAddress: string;
  position?: number;
  buyTimestamp: string;
  amountUsd: number;
  secondsAfterFirstTrade?: number;
}

interface ProfitDestination {
  address: string;
  amount: number;
  label?: string;
  isDeployerChain: boolean;
}

interface ThoroughInvestigation {
  wallet: string;
  name: string;
  investigatedAt: string;

  // Phase 1: Extended funding chain
  fundingChain: FundingChainLevel[];
  chainDepth: number;
  chainTermination: "CEX" | "DeadEnd" | "Circular" | "DeployerChainHit" | "MaxDepth";
  deployerChainConnection?: { level: number; address: string; role: string };

  // Phase 2: Sibling wallets
  firstFunder?: string;
  siblingWallets: string[];
  siblingEarlyBuyers: string[];
  funderPattern: "fresh-wallet-per-launch" | "single-wallet" | "unknown";

  // Phase 3: Cross-token activity
  tokensBought: TokenBuyInfo[];
  crossTokenScore: number;

  // Phase 4: Profit flow
  profitDestinations: ProfitDestination[];
  profitToDeployerChain: boolean;
  totalProfitUsd: number;

  // Phase 5: Temporal correlation
  buyTimestamps: Record<string, string>;
  correlationWithOtherTargets: { wallet: string; deltaSeconds: number }[];

  // Phase 6: Entity clustering
  sharedCounterparties: string[];
  behaviorSimilarityScore: number;
  counterpartyOverlapPercent: number;

  // Phase 7: CHOCO quick check
  chocoDeployerInChain: boolean;
  chocoFirstFunder?: string;

  // Phase 8: Counterparty network
  counterpartyCount: number;
  deployerChainInCounterparties: string[];
  totalVolumeUsd: number;
  topCounterparties: { address: string; volumeUsd: number; label?: string }[];

  // Bot detection
  isBot: boolean;
  botReasons: string[];

  // Final scoring
  finalScore: number;
  scoreBreakdown: { factor: string; points: number; reason: string }[];
  verdict: "CONFIRMED_INSIDER" | "LIKELY_INSIDER" | "POSSIBLE_INSIDER" | "UNLIKELY" | "RETAIL";
  confidence: number;
  keyFindings: string[];
  recommendation: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isInDeployerChain(address: string): boolean {
  return ALL_DEPLOYER_CHAIN_ADDRESSES.has(address);
}

function getDeployerChainRole(address: string): string {
  if (address === DEPLOYER_CHAIN.COINBASE_1 || address === DEPLOYER_CHAIN.COINBASE_2) return "Coinbase";
  if (address === DEPLOYER_CHAIN.ROOT) return "ROOT";
  if (address === DEPLOYER_CHAIN.V49J) return "v49j";
  if (DEPLOYER_CHAIN.DEPLOYERS.includes(address)) return "Deployer";
  return "";
}

function isCEXLabel(label?: string): boolean {
  if (!label) return false;
  const cexKeywords = ["coinbase", "binance", "kraken", "ftx", "gemini", "okx", "bybit", "kucoin", "exchange"];
  return cexKeywords.some((kw) => label.toLowerCase().includes(kw));
}

// =============================================================================
// PHASE 1: EXTENDED FUNDING CHAIN
// =============================================================================

async function traceFundingChainExtended(
  address: string,
  maxDepth: number = 20
): Promise<{
  chain: FundingChainLevel[];
  termination: "CEX" | "DeadEnd" | "Circular" | "DeployerChainHit" | "MaxDepth";
  deployerConnection?: { level: number; address: string; role: string };
}> {
  console.log("   Tracing funding chain...");

  const chain: FundingChainLevel[] = [];
  const visited = new Set<string>();
  let currentAddress = address;
  let deployerConnection: { level: number; address: string; role: string } | undefined;
  let termination: "CEX" | "DeadEnd" | "Circular" | "DeployerChainHit" | "MaxDepth" = "MaxDepth";

  for (let level = 0; level < maxDepth; level++) {
    if (visited.has(currentAddress)) {
      termination = "Circular";
      break;
    }
    visited.add(currentAddress);

    try {
      const related = await client.getRelatedWallets({
        address: currentAddress,
        chain: "solana",
        pagination: { page: 1, per_page: 50 },
      });
      await delay(2000);

      const firstFunderRel = related.find((r) => r.relation === "First Funder");

      if (!firstFunderRel) {
        termination = "DeadEnd";
        break;
      }

      const funderAddress = firstFunderRel.address;
      const label = firstFunderRel.address_label || undefined;
      const isDeployer = isInDeployerChain(funderAddress);
      const role = getDeployerChainRole(funderAddress);

      chain.push({
        address: funderAddress,
        level: level + 1,
        label,
        isDeployerChain: isDeployer,
        role: role || undefined,
      });

      console.log(`      L${level + 1}: ${funderAddress.slice(0, 12)}... ${label ? `(${label})` : ""} ${isDeployer ? "⚠️ DEPLOYER CHAIN" : ""}`);

      // Check for deployer chain connection
      if (isDeployer && !deployerConnection) {
        deployerConnection = { level: level + 1, address: funderAddress, role };
        termination = "DeployerChainHit";
        // Continue tracing to see full path
      }

      // Check for CEX
      if (isCEXLabel(label)) {
        termination = "CEX";
        break;
      }

      currentAddress = funderAddress;
    } catch (error) {
      console.log(`      Error at level ${level + 1}: ${error}`);
      termination = "DeadEnd";
      break;
    }
  }

  return { chain, termination, deployerConnection };
}

// =============================================================================
// PHASE 2: REVERSE FUNDING ANALYSIS
// =============================================================================

async function analyzeFirstFunderSiblings(
  firstFunder: string,
  knownEarlyBuyers: Set<string>
): Promise<{
  siblingWallets: string[];
  siblingEarlyBuyers: string[];
  pattern: "fresh-wallet-per-launch" | "single-wallet" | "unknown";
}> {
  console.log("   Analyzing first funder's other wallets...");

  try {
    // Get transactions from the funder to find all wallets they sent SOL to
    const txResult = await client.getTransactions({
      address: firstFunder,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: { page: 1, per_page: 100 },
    });
    await delay(2000);

    const siblingWallets = new Set<string>();
    for (const tx of txResult.data || []) {
      for (const sent of tx.tokens_sent || []) {
        if (sent.to_address && sent.to_address !== firstFunder && sent.token_symbol === "SOL") {
          siblingWallets.add(sent.to_address);
        }
      }
    }

    const siblings = Array.from(siblingWallets);
    const siblingEarlyBuyers = siblings.filter((w) => knownEarlyBuyers.has(w));

    console.log(`      Found ${siblings.length} sibling wallets`);
    console.log(`      ${siblingEarlyBuyers.length} are known early buyers`);

    let pattern: "fresh-wallet-per-launch" | "single-wallet" | "unknown" = "unknown";
    if (siblingEarlyBuyers.length >= 2) {
      pattern = "fresh-wallet-per-launch";
    } else if (siblingEarlyBuyers.length === 1) {
      pattern = "single-wallet";
    }

    return { siblingWallets: siblings, siblingEarlyBuyers, pattern };
  } catch (error) {
    console.log(`      Error: ${error}`);
    return { siblingWallets: [], siblingEarlyBuyers: [], pattern: "unknown" };
  }
}

// =============================================================================
// PHASE 3: CROSS-TOKEN ACTIVITY
// =============================================================================

async function analyzeCrossTokenActivity(address: string): Promise<TokenBuyInfo[]> {
  console.log("   Checking cross-token activity...");
  const tokensBought: TokenBuyInfo[] = [];

  for (const token of XRP_TOKENS) {
    try {
      // Get trades for this token
      const launchDate = token.launchDate;
      const nextDay = new Date(new Date(launchDate).getTime() + 7 * 86400000).toISOString().split("T")[0];

      const trades = await client.getTGMDexTrades({
        token_address: token.address,
        chain: "solana",
        date: { from: launchDate, to: nextDay },
        pagination: { page: 1, per_page: 100 },
      });
      await delay(1500);

      // Find buys by this address
      const buys = trades.filter(
        (t) => t.trader_address === address && t.action === "BUY"
      );

      if (buys.length > 0) {
        // Get earliest buy
        buys.sort((a, b) => new Date(a.block_timestamp).getTime() - new Date(b.block_timestamp).getTime());
        const firstBuy = buys[0];
        const totalBoughtUsd = buys.reduce((sum, b) => sum + (b.value_usd || 0), 0);

        tokensBought.push({
          token: token.ticker,
          tokenAddress: token.address,
          buyTimestamp: firstBuy.block_timestamp,
          amountUsd: totalBoughtUsd,
        });

        console.log(`      ✅ ${token.ticker}: Bought $${totalBoughtUsd.toFixed(2)} at ${firstBuy.block_timestamp}`);
      } else {
        console.log(`      ❌ ${token.ticker}: No buys found`);
      }
    } catch (error) {
      console.log(`      ⚠️ ${token.ticker}: Error - ${error}`);
    }
  }

  return tokensBought;
}

// =============================================================================
// PHASE 4: PROFIT FLOW TRACKING
// =============================================================================

async function trackProfitFlow(address: string): Promise<{
  destinations: ProfitDestination[];
  profitToDeployerChain: boolean;
  totalProfitUsd: number;
}> {
  console.log("   Tracking profit flow...");

  try {
    const txResult = await client.getTransactions({
      address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: { page: 1, per_page: 100 },
    });
    await delay(2000);

    const destinations: ProfitDestination[] = [];
    let profitToDeployerChain = false;
    let totalProfitUsd = 0;

    for (const tx of txResult.data || []) {
      for (const sent of tx.tokens_sent || []) {
        if (sent.to_address && sent.to_address !== address) {
          const valueUsd = sent.value_usd || 0;
          const isDeployer = isInDeployerChain(sent.to_address);

          if (isDeployer) {
            profitToDeployerChain = true;
          }

          // Aggregate by destination
          const existing = destinations.find((d) => d.address === sent.to_address);
          if (existing) {
            existing.amount += valueUsd;
          } else {
            destinations.push({
              address: sent.to_address,
              amount: valueUsd,
              label: sent.to_address_label,
              isDeployerChain: isDeployer,
            });
          }

          totalProfitUsd += valueUsd;
        }
      }
    }

    // Sort by amount descending
    destinations.sort((a, b) => b.amount - a.amount);

    console.log(`      Total outflow: $${totalProfitUsd.toFixed(2)}`);
    console.log(`      Profit to deployer chain: ${profitToDeployerChain ? "⚠️ YES" : "No"}`);

    return { destinations: destinations.slice(0, 10), profitToDeployerChain, totalProfitUsd };
  } catch (error) {
    console.log(`      Error: ${error}`);
    return { destinations: [], profitToDeployerChain: false, totalProfitUsd: 0 };
  }
}

// =============================================================================
// PHASE 5: TEMPORAL CORRELATION (runs after all wallets processed)
// =============================================================================

function analyzeTemporalCorrelation(
  results: ThoroughInvestigation[]
): Map<string, { wallet: string; deltaSeconds: number }[]> {
  const correlations = new Map<string, { wallet: string; deltaSeconds: number }[]>();

  for (const r1 of results) {
    const thisCorrelations: { wallet: string; deltaSeconds: number }[] = [];

    for (const r2 of results) {
      if (r1.wallet === r2.wallet) continue;

      // Compare buy timestamps for common tokens
      for (const [token, ts1] of Object.entries(r1.buyTimestamps)) {
        const ts2 = r2.buyTimestamps[token];
        if (ts2) {
          const delta = Math.abs(new Date(ts1).getTime() - new Date(ts2).getTime()) / 1000;
          thisCorrelations.push({ wallet: r2.wallet, deltaSeconds: delta });
        }
      }
    }

    correlations.set(r1.wallet, thisCorrelations);
  }

  return correlations;
}

// =============================================================================
// PHASE 6: ENTITY CLUSTERING
// =============================================================================

async function analyzeEntityClustering(
  address: string,
  allCounterparties: Map<string, Set<string>>
): Promise<{
  sharedCounterparties: string[];
  overlapPercent: number;
  similarityScore: number;
}> {
  console.log("   Analyzing entity clustering...");

  const thisCounterparties = allCounterparties.get(address) || new Set<string>();
  const sharedCounterparties: string[] = [];
  let maxOverlap = 0;

  for (const [otherWallet, otherCps] of allCounterparties) {
    if (otherWallet === address) continue;

    const shared = [...thisCounterparties].filter((cp) => otherCps.has(cp));
    sharedCounterparties.push(...shared);

    const overlapPercent = (shared.length / Math.min(thisCounterparties.size, otherCps.size)) * 100;
    if (overlapPercent > maxOverlap) {
      maxOverlap = overlapPercent;
    }
  }

  const uniqueShared = [...new Set(sharedCounterparties)];
  console.log(`      Shared counterparties: ${uniqueShared.length}`);
  console.log(`      Max overlap: ${maxOverlap.toFixed(1)}%`);

  return {
    sharedCounterparties: uniqueShared,
    overlapPercent: maxOverlap,
    similarityScore: Math.min(100, maxOverlap * 2), // Scale to 0-100
  };
}

// =============================================================================
// PHASE 7: CHOCO QUICK CHECK
// =============================================================================

async function checkChocoConnection(fundingChain: FundingChainLevel[]): Promise<{
  chocoDeployerInChain: boolean;
  chocoFirstFunder?: string;
}> {
  console.log("   Quick CHOCO check...");

  // Look for "CHOCO" in any label
  const chocoLevel = fundingChain.find((l) => l.label?.toLowerCase().includes("choco"));

  if (chocoLevel) {
    console.log(`      Found CHOCO connection at level ${chocoLevel.level}: ${chocoLevel.address.slice(0, 12)}...`);

    // Check if CHOCO deployer's first funder is in our chain
    try {
      const chocoFunder = await client.findFirstFunder(chocoLevel.address);
      await delay(2000);

      if (chocoFunder) {
        console.log(`      CHOCO's first funder: ${chocoFunder.slice(0, 12)}...`);
        const isOurChain = isInDeployerChain(chocoFunder);
        console.log(`      Connected to our chain: ${isOurChain ? "⚠️ YES" : "No"}`);
        return { chocoDeployerInChain: isOurChain, chocoFirstFunder: chocoFunder };
      }
    } catch (error) {
      console.log(`      Error checking CHOCO funder: ${error}`);
    }
  } else {
    console.log(`      No CHOCO connection in chain`);
  }

  return { chocoDeployerInChain: false };
}

// =============================================================================
// PHASE 8: COUNTERPARTY NETWORK
// =============================================================================

async function analyzeCounterpartyNetwork(address: string): Promise<{
  counterpartyCount: number;
  deployerChainInCounterparties: string[];
  totalVolumeUsd: number;
  topCounterparties: { address: string; volumeUsd: number; label?: string }[];
  isBot: boolean;
  botReasons: string[];
  allCounterpartyAddresses: Set<string>;
}> {
  console.log("   Analyzing counterparty network...");

  try {
    const counterparties = await client.getCounterparties({
      address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      group_by: "wallet",
      source_input: "Combined",
    });
    await delay(2000);

    const totalVolumeUsd = counterparties.reduce((sum, cp) => sum + (cp.total_volume_usd || 0), 0);
    const deployerChainInCounterparties = counterparties
      .filter((cp) => isInDeployerChain(cp.counterparty_address))
      .map((cp) => cp.counterparty_address);

    const topCounterparties = counterparties
      .sort((a, b) => (b.total_volume_usd || 0) - (a.total_volume_usd || 0))
      .slice(0, 10)
      .map((cp) => ({
        address: cp.counterparty_address,
        volumeUsd: cp.total_volume_usd || 0,
        label: cp.counterparty_address_label?.join(", "),
      }));

    // Bot detection
    const botReasons: string[] = [];
    let isBot = false;

    if (totalVolumeUsd > BOT_THRESHOLDS.VOLUME_USD) {
      isBot = true;
      botReasons.push(`High volume: $${(totalVolumeUsd / 1_000_000).toFixed(1)}M`);
    }
    if (counterparties.length > BOT_THRESHOLDS.COUNTERPARTIES) {
      isBot = true;
      botReasons.push(`Many counterparties: ${counterparties.length}`);
    }

    // Check for bot labels
    const botLabels = counterparties.filter((cp) =>
      cp.counterparty_address_label?.some((l) =>
        l.toLowerCase().includes("bot") ||
        l.toLowerCase().includes("mev") ||
        l.toLowerCase().includes("arbitrage")
      )
    );
    if (botLabels.length > counterparties.length * 0.3) {
      isBot = true;
      botReasons.push(`30%+ bot counterparties`);
    }

    console.log(`      Counterparties: ${counterparties.length}`);
    console.log(`      Total volume: $${totalVolumeUsd.toLocaleString()}`);
    console.log(`      Deployer chain in counterparties: ${deployerChainInCounterparties.length}`);
    console.log(`      Is bot: ${isBot ? "⚠️ YES" : "No"}`);

    return {
      counterpartyCount: counterparties.length,
      deployerChainInCounterparties,
      totalVolumeUsd,
      topCounterparties,
      isBot,
      botReasons,
      allCounterpartyAddresses: new Set(counterparties.map((cp) => cp.counterparty_address)),
    };
  } catch (error) {
    console.log(`      Error: ${error}`);
    return {
      counterpartyCount: 0,
      deployerChainInCounterparties: [],
      totalVolumeUsd: 0,
      topCounterparties: [],
      isBot: false,
      botReasons: [],
      allCounterpartyAddresses: new Set(),
    };
  }
}

// =============================================================================
// SCORING SYSTEM
// =============================================================================

function calculateFinalScore(
  investigation: Partial<ThoroughInvestigation>
): {
  score: number;
  breakdown: { factor: string; points: number; reason: string }[];
  verdict: "CONFIRMED_INSIDER" | "LIKELY_INSIDER" | "POSSIBLE_INSIDER" | "UNLIKELY" | "RETAIL";
  confidence: number;
} {
  const breakdown: { factor: string; points: number; reason: string }[] = [];
  let score = 0;

  // Funding chain hits deployer (+40)
  if (investigation.deployerChainConnection) {
    score += 40;
    breakdown.push({
      factor: "Deployer Chain Connection",
      points: 40,
      reason: `Connected at level ${investigation.deployerChainConnection.level} via ${investigation.deployerChainConnection.role}`,
    });
  }

  // Cross-token activity
  const tokenCount = investigation.tokensBought?.length || 0;
  if (tokenCount >= 3) {
    score += 30;
    breakdown.push({
      factor: "Cross-Token (3+)",
      points: 30,
      reason: `Bought ${tokenCount} of 5 XRP tokens`,
    });
  } else if (tokenCount >= 2) {
    score += 20;
    breakdown.push({
      factor: "Cross-Token (2)",
      points: 20,
      reason: `Bought ${tokenCount} of 5 XRP tokens`,
    });
  }

  // Position score (using known positions)
  const positions = Object.values(TARGET_WALLETS.find((w) => w.address === investigation.wallet)?.knownPositions || {});
  if (positions.length > 0) {
    const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
    if (avgPosition <= 10) {
      score += 20;
      breakdown.push({
        factor: "Top 10 Position",
        points: 20,
        reason: `Average position: ${avgPosition.toFixed(1)}`,
      });
    } else if (avgPosition <= 20) {
      score += 10;
      breakdown.push({
        factor: "Top 20 Position",
        points: 10,
        reason: `Average position: ${avgPosition.toFixed(1)}`,
      });
    }
  }

  // Profit flows to chain (+20)
  if (investigation.profitToDeployerChain) {
    score += 20;
    breakdown.push({
      factor: "Profit to Deployer Chain",
      points: 20,
      reason: "Funds sent to deployer chain addresses",
    });
  }

  // Sibling early buyers (+15)
  if ((investigation.siblingEarlyBuyers?.length || 0) >= 1) {
    score += 15;
    breakdown.push({
      factor: "Sibling Early Buyers",
      points: 15,
      reason: `${investigation.siblingEarlyBuyers?.length} sibling wallets are early buyers`,
    });
  }

  // Temporal correlation (+10)
  const closeCorrelations = investigation.correlationWithOtherTargets?.filter((c) => c.deltaSeconds < 10) || [];
  if (closeCorrelations.length > 0) {
    score += 10;
    breakdown.push({
      factor: "Temporal Correlation",
      points: 10,
      reason: `Bought within 10s of ${closeCorrelations.length} other targets`,
    });
  }

  // Shared counterparties (+5)
  if ((investigation.counterpartyOverlapPercent || 0) > 20) {
    score += 5;
    breakdown.push({
      factor: "Shared Counterparties",
      points: 5,
      reason: `${investigation.counterpartyOverlapPercent?.toFixed(1)}% counterparty overlap`,
    });
  }

  // Bot penalty (-50)
  if (investigation.isBot) {
    score -= 50;
    breakdown.push({
      factor: "Bot Penalty",
      points: -50,
      reason: investigation.botReasons?.join(", ") || "Bot detected",
    });
  }

  // Determine verdict
  let verdict: "CONFIRMED_INSIDER" | "LIKELY_INSIDER" | "POSSIBLE_INSIDER" | "UNLIKELY" | "RETAIL";
  let confidence: number;

  if (score >= 70) {
    verdict = "CONFIRMED_INSIDER";
    confidence = Math.min(95, 70 + score / 5);
  } else if (score >= 50) {
    verdict = "LIKELY_INSIDER";
    confidence = Math.min(85, 50 + score / 3);
  } else if (score >= 30) {
    verdict = "POSSIBLE_INSIDER";
    confidence = Math.min(70, 30 + score / 2);
  } else if (score >= 10) {
    verdict = "UNLIKELY";
    confidence = 50;
  } else {
    verdict = "RETAIL";
    confidence = 60;
  }

  return { score, breakdown, verdict, confidence };
}

// =============================================================================
// MAIN INVESTIGATION
// =============================================================================

async function investigateWallet(
  wallet: typeof TARGET_WALLETS[0],
  knownEarlyBuyers: Set<string>,
  allCounterparties: Map<string, Set<string>>
): Promise<ThoroughInvestigation> {
  console.log("\n" + "═".repeat(70));
  console.log(`🔍 INVESTIGATING: ${wallet.name}`);
  console.log(`   Address: ${wallet.address}`);
  console.log("═".repeat(70));

  const result: Partial<ThoroughInvestigation> = {
    wallet: wallet.address,
    name: wallet.name,
    investigatedAt: new Date().toISOString(),
  };

  // PHASE 1: Extended Funding Chain
  console.log("\n📍 PHASE 1: Extended Funding Chain");
  console.log("-".repeat(50));
  const chainResult = await traceFundingChainExtended(wallet.address);
  result.fundingChain = chainResult.chain;
  result.chainDepth = chainResult.chain.length;
  result.chainTermination = chainResult.termination;
  result.deployerChainConnection = chainResult.deployerConnection;
  result.firstFunder = chainResult.chain[0]?.address;

  // PHASE 2: Reverse Funding Analysis
  console.log("\n📍 PHASE 2: Reverse Funding Analysis");
  console.log("-".repeat(50));
  if (result.firstFunder) {
    const siblingResult = await analyzeFirstFunderSiblings(result.firstFunder, knownEarlyBuyers);
    result.siblingWallets = siblingResult.siblingWallets;
    result.siblingEarlyBuyers = siblingResult.siblingEarlyBuyers;
    result.funderPattern = siblingResult.pattern;
  } else {
    result.siblingWallets = [];
    result.siblingEarlyBuyers = [];
    result.funderPattern = "unknown";
  }

  // PHASE 3: Cross-Token Activity
  console.log("\n📍 PHASE 3: Cross-Token Activity");
  console.log("-".repeat(50));
  result.tokensBought = await analyzeCrossTokenActivity(wallet.address);
  result.crossTokenScore = (result.tokensBought.length / 5) * 100;
  result.buyTimestamps = {};
  for (const tb of result.tokensBought) {
    result.buyTimestamps[tb.token] = tb.buyTimestamp;
  }

  // PHASE 4: Profit Flow Tracking
  console.log("\n📍 PHASE 4: Profit Flow Tracking");
  console.log("-".repeat(50));
  const profitResult = await trackProfitFlow(wallet.address);
  result.profitDestinations = profitResult.destinations;
  result.profitToDeployerChain = profitResult.profitToDeployerChain;
  result.totalProfitUsd = profitResult.totalProfitUsd;

  // PHASE 7: CHOCO Quick Check (before counterparty network)
  console.log("\n📍 PHASE 7: CHOCO Quick Check");
  console.log("-".repeat(50));
  const chocoResult = await checkChocoConnection(result.fundingChain || []);
  result.chocoDeployerInChain = chocoResult.chocoDeployerInChain;
  result.chocoFirstFunder = chocoResult.chocoFirstFunder;

  // PHASE 8: Counterparty Network
  console.log("\n📍 PHASE 8: Counterparty Network");
  console.log("-".repeat(50));
  const networkResult = await analyzeCounterpartyNetwork(wallet.address);
  result.counterpartyCount = networkResult.counterpartyCount;
  result.deployerChainInCounterparties = networkResult.deployerChainInCounterparties;
  result.totalVolumeUsd = networkResult.totalVolumeUsd;
  result.topCounterparties = networkResult.topCounterparties;
  result.isBot = networkResult.isBot;
  result.botReasons = networkResult.botReasons;

  // Store counterparties for entity clustering
  allCounterparties.set(wallet.address, networkResult.allCounterpartyAddresses);

  // Initialize fields that will be filled later
  result.correlationWithOtherTargets = [];
  result.sharedCounterparties = [];
  result.behaviorSimilarityScore = 0;
  result.counterpartyOverlapPercent = 0;

  return result as ThoroughInvestigation;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║        THOROUGH INSIDER INVESTIGATION - 8 PHASES                   ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");
  console.log("\nConfiguration:");
  console.log("  • Chain Depth: Until CEX/dead-end");
  console.log("  • Token Scope: 5 XRP-themed tokens");
  console.log("  • CHOCO Investigation: Quick check only");
  console.log("  • Priority: Maximum thoroughness");

  // Load known early buyers for sibling analysis
  let knownEarlyBuyers = new Set<string>();
  try {
    const insiderV3 = JSON.parse(fs.readFileSync("data/analysis/insider-v3.json", "utf-8"));
    for (const token of Object.values(insiderV3.tokens) as any[]) {
      for (const buyer of token.first20Buyers || []) {
        knownEarlyBuyers.add(buyer.address);
      }
    }
    console.log(`\nLoaded ${knownEarlyBuyers.size} known early buyers for cross-reference`);
  } catch (e) {
    console.log("\n⚠️ Couldn't load insider-v3.json - sibling analysis may be limited");
  }

  // Collect counterparties for entity clustering
  const allCounterparties = new Map<string, Set<string>>();
  const results: ThoroughInvestigation[] = [];

  // Investigate each wallet
  for (const wallet of TARGET_WALLETS) {
    const result = await investigateWallet(wallet, knownEarlyBuyers, allCounterparties);
    results.push(result);
  }

  // PHASE 5 & 6: Cross-wallet analysis (temporal correlation & entity clustering)
  console.log("\n" + "═".repeat(70));
  console.log("📍 CROSS-WALLET ANALYSIS");
  console.log("═".repeat(70));

  // Phase 5: Temporal Correlation
  console.log("\n📍 PHASE 5: Temporal Correlation");
  console.log("-".repeat(50));
  const correlations = analyzeTemporalCorrelation(results);
  for (const result of results) {
    result.correlationWithOtherTargets = correlations.get(result.wallet) || [];
    const closeOnes = result.correlationWithOtherTargets.filter((c) => c.deltaSeconds < 60);
    if (closeOnes.length > 0) {
      console.log(`   ${result.wallet.slice(0, 12)}... has ${closeOnes.length} close correlations`);
    }
  }

  // Phase 6: Entity Clustering
  console.log("\n📍 PHASE 6: Entity Clustering");
  console.log("-".repeat(50));
  for (const result of results) {
    const clusterResult = await analyzeEntityClustering(result.wallet, allCounterparties);
    result.sharedCounterparties = clusterResult.sharedCounterparties;
    result.counterpartyOverlapPercent = clusterResult.overlapPercent;
    result.behaviorSimilarityScore = clusterResult.similarityScore;
  }

  // Calculate final scores and verdicts
  console.log("\n" + "═".repeat(70));
  console.log("📊 FINAL SCORING");
  console.log("═".repeat(70));

  for (const result of results) {
    const scoring = calculateFinalScore(result);
    result.finalScore = scoring.score;
    result.scoreBreakdown = scoring.breakdown;
    result.verdict = scoring.verdict;
    result.confidence = scoring.confidence;

    // Generate key findings
    result.keyFindings = [];
    if (result.deployerChainConnection) {
      result.keyFindings.push(`Connected to deployer chain at level ${result.deployerChainConnection.level}`);
    }
    if (result.tokensBought.length >= 2) {
      result.keyFindings.push(`Cross-token buyer: ${result.tokensBought.map((t) => t.token).join(", ")}`);
    }
    if (result.profitToDeployerChain) {
      result.keyFindings.push("Profit flows to deployer chain");
    }
    if (result.siblingEarlyBuyers.length > 0) {
      result.keyFindings.push(`${result.siblingEarlyBuyers.length} sibling wallets are early buyers`);
    }
    if (result.isBot) {
      result.keyFindings.push(`Bot detected: ${result.botReasons.join(", ")}`);
    }

    // Generate recommendation
    if (result.verdict === "CONFIRMED_INSIDER" || result.verdict === "LIKELY_INSIDER") {
      result.recommendation = result.funderPattern === "fresh-wallet-per-launch"
        ? `MONITOR FUNDER (${result.firstFunder?.slice(0, 12)}...) - Uses fresh wallets per launch`
        : "MONITOR - Active insider, watch for next launch activity";
    } else if (result.verdict === "POSSIBLE_INSIDER") {
      result.recommendation = "LOW PRIORITY - Some insider signals but inconclusive";
    } else {
      result.recommendation = "IGNORE - Likely retail trader or bot";
    }

    console.log(`\n${result.name} (${result.wallet.slice(0, 12)}...)`);
    console.log(`   Score: ${result.finalScore}/120`);
    console.log(`   Verdict: ${result.verdict}`);
    console.log(`   Confidence: ${result.confidence}%`);
    console.log(`   Key Findings: ${result.keyFindings.join("; ") || "None"}`);
  }

  // Summary table
  console.log("\n" + "═".repeat(70));
  console.log("                           SUMMARY");
  console.log("═".repeat(70));

  console.log("\n┌───────────────────────┬─────────────────────┬────────┬────────┬────────────────────────────────┐");
  console.log("│ Wallet                │ Verdict             │ Score  │ Conf.  │ Recommendation                 │");
  console.log("├───────────────────────┼─────────────────────┼────────┼────────┼────────────────────────────────┤");

  for (const r of results) {
    const addr = r.wallet.slice(0, 8) + "...";
    const verdict = r.verdict.padEnd(19);
    const score = `${r.finalScore}/120`.padStart(6);
    const conf = `${r.confidence}%`.padStart(6);
    const rec = r.recommendation.slice(0, 30).padEnd(30);
    console.log(`│ ${addr.padEnd(21)} │ ${verdict} │ ${score} │ ${conf} │ ${rec} │`);
  }

  console.log("└───────────────────────┴─────────────────────┴────────┴────────┴────────────────────────────────┘");

  // Wallets to monitor
  const toMonitor = results.filter(
    (r) => r.verdict === "CONFIRMED_INSIDER" || r.verdict === "LIKELY_INSIDER"
  );

  if (toMonitor.length > 0) {
    console.log("\n🎯 WALLETS TO MONITOR:");
    for (const r of toMonitor) {
      console.log(`   ${r.wallet}`);
      console.log(`      Verdict: ${r.verdict} (${r.confidence}% confidence)`);
      console.log(`      Reason: ${r.keyFindings.slice(0, 2).join("; ")}`);
    }
  }

  // Deployer chain connections
  const chainConnected = results.filter((r) => r.deployerChainConnection);
  if (chainConnected.length > 0) {
    console.log("\n🔗 DEPLOYER CHAIN CONNECTIONS:");
    for (const r of chainConnected) {
      console.log(`   ${r.wallet.slice(0, 12)}... → Level ${r.deployerChainConnection!.level} → ${r.deployerChainConnection!.role}`);
    }
  }

  // Save results
  const output = {
    timestamp: new Date().toISOString(),
    configuration: {
      chainDepth: "Until CEX/dead-end",
      tokenScope: "5 XRP-themed tokens",
      chocoInvestigation: "Quick check only",
      priority: "Maximum thoroughness",
    },
    targetWallets: TARGET_WALLETS.map((w) => w.address),
    investigations: results,
    summary: {
      total: results.length,
      confirmedInsiders: results.filter((r) => r.verdict === "CONFIRMED_INSIDER").length,
      likelyInsiders: results.filter((r) => r.verdict === "LIKELY_INSIDER").length,
      possibleInsiders: results.filter((r) => r.verdict === "POSSIBLE_INSIDER").length,
      unlikely: results.filter((r) => r.verdict === "UNLIKELY").length,
      retail: results.filter((r) => r.verdict === "RETAIL").length,
      deployerChainConnections: chainConnected.length,
      botsDetected: results.filter((r) => r.isBot).length,
      toMonitor: toMonitor.map((r) => ({
        wallet: r.wallet,
        verdict: r.verdict,
        confidence: r.confidence,
        keyFindings: r.keyFindings,
      })),
    },
  };

  // Ensure directory exists
  if (!fs.existsSync("data/analysis")) {
    fs.mkdirSync("data/analysis", { recursive: true });
  }

  fs.writeFileSync(
    "data/analysis/thorough-insider-investigation.json",
    JSON.stringify(output, null, 2)
  );
  console.log("\n✅ Results saved to data/analysis/thorough-insider-investigation.json");
}

main().catch(console.error);
