import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";
import * as fs from "fs";
import * as path from "path";

// Known wallets
const PRIMARY_FUNDER = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
const ROOT_WALLET = "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF";
const COINBASE_WALLET = "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE";

const KNOWN_DEPLOYERS = [
  "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2", // Original
  "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb", // Fresh #1 (Sep 28)
  "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy", // Fresh #2 (Nov 2)
];

interface AlternativePathAnalysis {
  generatedAt: string;
  rootAnalysis: {
    directDeployerFunding: boolean;
    level1Wallets: string[];
    recentActivity: boolean;
    lastActivityDate?: string;
  };
  cexAnalysis: {
    coinbaseActive: boolean;
    recentDeployerFunding: boolean;
    lastActivityDate?: string;
    otherCexWallets: string[];
  };
  freshWalletCandidates: {
    address: string;
    fundedBy: string;
    fundedDate?: string;
    isFresh: boolean;
    interactionCount: number;
  }[];
  alternativeLevel1: {
    address: string;
    fundedByRoot: boolean;
    fundsDeployers: boolean;
    confidence: number;
  }[];
  riskAssessment: {
    scenario: string;
    probability: number;
    mitigation: string;
  }[];
}

async function analyzeRootWallet(
  client: NansenClient,
): Promise<AlternativePathAnalysis["rootAnalysis"]> {
  console.log("\n📊 Phase 1: ROOT Wallet Analysis");
  console.log(`   Wallet: ${ROOT_WALLET}`);

  const result: AlternativePathAnalysis["rootAnalysis"] = {
    directDeployerFunding: false,
    level1Wallets: [],
    recentActivity: false,
  };

  // Get ROOT's counterparties
  console.log("   Fetching ROOT counterparties...");
  const counterparties = await client.getCounterparties({
    address: ROOT_WALLET,
    chain: "solana",
    group_by: "wallet",
    source_input: "Combined",
    date: DATES.RECENT_90D,
  });

  // Check if ROOT has funded any deployers directly
  for (const cp of counterparties) {
    if (KNOWN_DEPLOYERS.includes(cp.counterparty_address)) {
      result.directDeployerFunding = true;
      console.log(
        `   ⚠️ ROOT has direct interaction with deployer: ${cp.counterparty_address}`,
      );
    }
  }

  if (!result.directDeployerFunding) {
    console.log("   ✅ ROOT does NOT fund deployers directly");
  }

  // Identify LEVEL 1 wallets (wallets ROOT funds that then fund deployers)
  console.log("   Identifying LEVEL 1 wallets...");
  const rootFundedWallets = counterparties
    .filter((cp) => (cp.volume_out_usd || 0) > 0)
    .map((cp) => cp.counterparty_address);

  // Check if PRIMARY_FUNDER is in the list
  if (rootFundedWallets.includes(PRIMARY_FUNDER)) {
    result.level1Wallets.push(PRIMARY_FUNDER);
    console.log(`   ✅ Confirmed: ROOT → ${PRIMARY_FUNDER} (PRIMARY_FUNDER)`);
  }

  // Look for other potential LEVEL 1 wallets
  for (const wallet of rootFundedWallets.slice(0, 10)) {
    if (wallet === PRIMARY_FUNDER) continue;

    // Check if this wallet funds any deployers
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const walletCounterparties = await client.getCounterparties({
      address: wallet,
      chain: "solana",
      group_by: "wallet",
      source_input: "Combined",
      date: DATES.RECENT_90D,
    });

    const fundsDeployers = walletCounterparties.some((cp) =>
      KNOWN_DEPLOYERS.includes(cp.counterparty_address),
    );

    if (fundsDeployers) {
      result.level1Wallets.push(wallet);
      console.log(`   ⚠️ Alternative LEVEL 1 found: ${wallet}`);
    }
  }

  // Check recent activity
  console.log("   Checking ROOT recent activity...");
  const transactions = await client.getTransactions({
    address: ROOT_WALLET,
    chain: "solana",
    date: DATES.RECENT_90D,
    pagination: { page: 1, per_page: 10 },
  });

  if (transactions.data && transactions.data.length > 0) {
    result.recentActivity = true;
    result.lastActivityDate = transactions.data[0].block_timestamp;
    console.log(`   ✅ ROOT has recent activity: ${result.lastActivityDate}`);
  } else {
    console.log("   ℹ️ ROOT has no recent activity (Nov 2025)");
  }

  return result;
}

async function analyzeCEXFallback(
  client: NansenClient,
): Promise<AlternativePathAnalysis["cexAnalysis"]> {
  console.log("\n📊 Phase 2: CEX Fallback Analysis");
  console.log(`   Coinbase Wallet: ${COINBASE_WALLET}`);

  const result: AlternativePathAnalysis["cexAnalysis"] = {
    coinbaseActive: false,
    recentDeployerFunding: false,
    otherCexWallets: [],
  };

  // Check Coinbase wallet activity
  console.log("   Fetching Coinbase wallet transactions...");
  const transactions = await client.getTransactions({
    address: COINBASE_WALLET,
    chain: "solana",
    date: DATES.RECENT_90D,
    pagination: { page: 1, per_page: 100 },
  });

  if (transactions.data && transactions.data.length > 0) {
    result.coinbaseActive = true;
    result.lastActivityDate = transactions.data[0].block_timestamp;

    // Check if it funded any deployers recently
    for (const tx of transactions.data) {
      if (!tx.tokens_sent) continue;
      for (const sent of tx.tokens_sent) {
        if (KNOWN_DEPLOYERS.includes(sent.to_address)) {
          result.recentDeployerFunding = true;
          console.log(
            `   ⚠️ Coinbase funded deployer ${sent.to_address} on ${tx.block_timestamp}`,
          );
        }
      }
    }
  }

  if (!result.recentDeployerFunding) {
    console.log("   ✅ Coinbase has NOT funded deployers recently");
  }

  // Look for other CEX wallets in the ecosystem
  console.log("   Checking for other CEX wallets...");
  const primaryFunderCounterparties = await client.getCounterparties({
    address: PRIMARY_FUNDER,
    chain: "solana",
    group_by: "wallet",
    source_input: "Combined",
    date: DATES.RECENT_90D,
  });

  // Look for known CEX labels
  for (const cp of primaryFunderCounterparties) {
    const labels = cp.counterparty_address_label || [];
    const isCex = labels.some(
      (l) =>
        l.toLowerCase().includes("exchange") ||
        l.toLowerCase().includes("coinbase") ||
        l.toLowerCase().includes("binance") ||
        l.toLowerCase().includes("kraken"),
    );
    if (isCex && cp.counterparty_address !== COINBASE_WALLET) {
      result.otherCexWallets.push(cp.counterparty_address);
      console.log(`   ℹ️ Other CEX wallet found: ${cp.counterparty_address}`);
    }
  }

  return result;
}

async function detectFreshWalletCandidates(
  client: NansenClient,
): Promise<AlternativePathAnalysis["freshWalletCandidates"]> {
  console.log("\n📊 Phase 3: Fresh Wallet Detection");
  console.log(`   Analyzing wallets funded by: ${PRIMARY_FUNDER}`);

  const candidates: AlternativePathAnalysis["freshWalletCandidates"] = [];

  // Get all wallets funded by PRIMARY_FUNDER in November
  console.log("   Fetching recent transactions from PRIMARY_FUNDER...");
  const transactions = await client.getTransactions({
    address: PRIMARY_FUNDER,
    chain: "solana",
    date: DATES.RECENT_90D,
    pagination: { page: 1, per_page: 100 },
  });

  const fundedWallets = new Set<string>();
  for (const tx of transactions.data || []) {
    if (!tx.tokens_sent) continue;
    for (const sent of tx.tokens_sent) {
      if (sent.to_address && sent.to_address !== PRIMARY_FUNDER) {
        fundedWallets.add(sent.to_address);
      }
    }
  }

  console.log(`   Found ${fundedWallets.size} wallets funded in November`);

  // Check each wallet's "freshness"
  let checked = 0;
  for (const wallet of fundedWallets) {
    if (KNOWN_DEPLOYERS.includes(wallet)) {
      console.log(`   Skipping known deployer: ${wallet.slice(0, 8)}...`);
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
    checked++;

    if (checked > 10) {
      console.log("   (Limiting to 10 fresh wallet checks for rate limiting)");
      break;
    }

    const counterparties = await client.getCounterparties({
      address: wallet,
      chain: "solana",
      group_by: "wallet",
      source_input: "Combined",
      date: DATES.RECENT_90D,
    });

    const interactionCount = counterparties.reduce(
      (sum, cp) => sum + cp.interaction_count,
      0,
    );
    const isFresh = interactionCount < 20;

    candidates.push({
      address: wallet,
      fundedBy: PRIMARY_FUNDER,
      isFresh,
      interactionCount,
    });

    if (isFresh) {
      console.log(
        `   🎯 FRESH wallet candidate: ${wallet.slice(0, 12)}... (${interactionCount} interactions)`,
      );
    }
  }

  return candidates;
}

function generateRiskAssessment(
  rootAnalysis: AlternativePathAnalysis["rootAnalysis"],
  cexAnalysis: AlternativePathAnalysis["cexAnalysis"],
  freshWallets: AlternativePathAnalysis["freshWalletCandidates"],
): AlternativePathAnalysis["riskAssessment"] {
  const risks: AlternativePathAnalysis["riskAssessment"] = [];

  // Primary scenario
  risks.push({
    scenario: "v49j funds deployer as expected",
    probability: 85,
    mitigation: "Primary monitor on v49j wallet",
  });

  // ROOT alternative
  if (rootAnalysis.level1Wallets.length > 1) {
    risks.push({
      scenario: "ROOT uses different LEVEL 1 wallet",
      probability: 10,
      mitigation: "Monitor ROOT and all identified LEVEL 1 wallets",
    });
  } else {
    risks.push({
      scenario: "ROOT uses different LEVEL 1 wallet",
      probability: 5,
      mitigation: "Monitor ROOT wallet for new outbound transactions",
    });
  }

  // CEX fallback
  if (cexAnalysis.coinbaseActive && cexAnalysis.recentDeployerFunding) {
    risks.push({
      scenario: "Direct CEX funding resumes",
      probability: 10,
      mitigation: "Monitor Coinbase wallet as backup",
    });
  } else {
    risks.push({
      scenario: "Direct CEX funding",
      probability: 3,
      mitigation: "Low priority - CEX pattern not recently used",
    });
  }

  // Completely new pattern
  risks.push({
    scenario: "Completely new funding pattern",
    probability: 2,
    mitigation: "Fresh wallet detection algorithm active",
  });

  // Normalize probabilities
  const total = risks.reduce((sum, r) => sum + r.probability, 0);
  risks.forEach((r) => {
    r.probability = Math.round((r.probability / total) * 100);
  });

  return risks;
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  console.log("🚀 Starting Alternative Paths Analysis");
  console.log("═".repeat(50));

  // Phase 1: ROOT Analysis
  const rootAnalysis = await analyzeRootWallet(client);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Phase 2: CEX Fallback
  const cexAnalysis = await analyzeCEXFallback(client);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Phase 3: Fresh Wallet Detection
  const freshWallets = await detectFreshWalletCandidates(client);

  // Generate risk assessment
  const riskAssessment = generateRiskAssessment(
    rootAnalysis,
    cexAnalysis,
    freshWallets,
  );

  // Compile results
  const analysis: AlternativePathAnalysis = {
    generatedAt: new Date().toISOString(),
    rootAnalysis,
    cexAnalysis,
    freshWalletCandidates: freshWallets,
    alternativeLevel1: rootAnalysis.level1Wallets.map((addr) => ({
      address: addr,
      fundedByRoot: true,
      fundsDeployers: true,
      confidence: addr === PRIMARY_FUNDER ? 95 : 50,
    })),
    riskAssessment,
  };

  // Save results
  const outputDir = path.join(process.cwd(), "data", "analysis");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "alternative-paths.json");
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`\n✅ Analysis saved to: ${outputPath}`);

  // Print summary
  console.log("\n" + "═".repeat(50));
  console.log("📊 ALTERNATIVE PATHS SUMMARY");
  console.log("═".repeat(50));

  console.log("\nROOT Analysis:");
  console.log(
    `  Direct deployer funding: ${rootAnalysis.directDeployerFunding ? "⚠️ YES" : "✅ NO"}`,
  );
  console.log(`  LEVEL 1 wallets found: ${rootAnalysis.level1Wallets.length}`);
  console.log(
    `  Recent activity: ${rootAnalysis.recentActivity ? "YES" : "NO"}`,
  );

  console.log("\nCEX Fallback:");
  console.log(
    `  Coinbase active: ${cexAnalysis.coinbaseActive ? "YES" : "NO"}`,
  );
  console.log(
    `  Recent deployer funding: ${cexAnalysis.recentDeployerFunding ? "⚠️ YES" : "✅ NO"}`,
  );

  console.log("\nFresh Wallet Candidates:");
  const freshCandidates = freshWallets.filter((w) => w.isFresh);
  console.log(`  Found: ${freshCandidates.length} fresh wallets`);
  for (const w of freshCandidates.slice(0, 5)) {
    console.log(
      `    - ${w.address.slice(0, 12)}... (${w.interactionCount} interactions)`,
    );
  }

  console.log("\nRisk Assessment:");
  for (const risk of riskAssessment) {
    console.log(`  ${risk.probability}% - ${risk.scenario}`);
  }
}

main().catch(console.error);
