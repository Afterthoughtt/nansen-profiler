import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import * as fs from "fs";
import * as path from "path";

const PRIMARY_FUNDER = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
const ROOT_WALLET = "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF";

const LAUNCH_DATES = [
  { date: "2025-09-28", ticker: "XRPEP3" },
  { date: "2025-11-02", ticker: "TrollXRP" },
];

interface BalanceAnalysis {
  generatedAt: string;
  wallets: {
    address: string;
    role: string;
    balanceTimeline: {
      date: string;
      balance?: number;
      change?: number;
      note?: string;
    }[];
    preLaunchPatterns: {
      launchDate: string;
      ticker: string;
      t24hBalance?: number;
      t12hBalance?: number;
      t6hBalance?: number;
      balanceChange?: number;
    }[];
  }[];
  signals: {
    description: string;
    timing: string;
    reliability: number;
  }[];
}

async function analyzeWalletBalances(
  client: NansenClient,
  address: string,
  role: string,
): Promise<BalanceAnalysis["wallets"][0]> {
  console.log(`\n📊 Analyzing balance history for ${role}`);
  console.log(`   Address: ${address.slice(0, 12)}...`);

  const result: BalanceAnalysis["wallets"][0] = {
    address,
    role,
    balanceTimeline: [],
    preLaunchPatterns: [],
  };

  // Get historical balances
  console.log("   Fetching historical balances...");
  const balances = await client.getHistoricalBalances({
    address,
    chain: "solana",
    date: { from: "2025-09-01", to: "2025-11-30" },
  });

  // If historical balances aren't available, use transactions to infer
  if (!balances || balances.length === 0) {
    console.log("   ⚠️ Historical balances not available - using transactions");

    // Use transactions to analyze activity around launch dates
    for (const launch of LAUNCH_DATES) {
      const launchDate = new Date(launch.date);

      // Get transactions 7 days before and after
      const dateFrom = new Date(launchDate);
      dateFrom.setDate(dateFrom.getDate() - 7);
      const dateTo = new Date(launchDate);
      dateTo.setDate(dateTo.getDate() + 1);

      const transactions = await client.getTransactions({
        address,
        chain: "solana",
        date: {
          from: dateFrom.toISOString().split("T")[0],
          to: dateTo.toISOString().split("T")[0],
        },
        pagination: { page: 1, per_page: 100 },
      });

      // Analyze transaction patterns
      let preLaunchInflow = 0;
      let preLaunchOutflow = 0;

      for (const tx of transactions.data || []) {
        const txDate = new Date(tx.block_timestamp);
        const daysBeforeLaunch = Math.floor(
          (launchDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysBeforeLaunch > 0 && daysBeforeLaunch <= 7) {
          // Pre-launch transaction
          if (tx.tokens_received) {
            for (const token of tx.tokens_received) {
              if (
                token.token_symbol === "SOL" ||
                token.token_symbol === "WSOL"
              ) {
                preLaunchInflow += token.token_amount;
              }
            }
          }
          if (tx.tokens_sent) {
            for (const token of tx.tokens_sent) {
              if (
                token.token_symbol === "SOL" ||
                token.token_symbol === "WSOL"
              ) {
                preLaunchOutflow += token.token_amount;
              }
            }
          }

          result.balanceTimeline.push({
            date: tx.block_timestamp,
            note: `${daysBeforeLaunch}d before ${launch.ticker} launch`,
          });
        }
      }

      result.preLaunchPatterns.push({
        launchDate: launch.date,
        ticker: launch.ticker,
        balanceChange: preLaunchInflow - preLaunchOutflow,
      });

      console.log(`   ${launch.ticker} pre-launch:`);
      console.log(`     Inflow: ${preLaunchInflow.toFixed(2)} SOL`);
      console.log(`     Outflow: ${preLaunchOutflow.toFixed(2)} SOL`);
      console.log(
        `     Net change: ${(preLaunchInflow - preLaunchOutflow).toFixed(2)} SOL`,
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } else {
    // Process historical balance snapshots
    for (const snapshot of balances) {
      result.balanceTimeline.push({
        date: snapshot.block_timestamp,
        balance: snapshot.token_amount,
      });
    }
  }

  return result;
}

function identifySignals(
  walletAnalysis: BalanceAnalysis["wallets"],
): BalanceAnalysis["signals"] {
  const signals: BalanceAnalysis["signals"] = [];

  // Look for consistent patterns across launches
  const level1Analysis = walletAnalysis.find((w) => w.role === "level1");
  if (level1Analysis && level1Analysis.preLaunchPatterns.length >= 2) {
    const patterns = level1Analysis.preLaunchPatterns;

    // Check if there's consistent inflow before launches
    const allPositive = patterns.every((p) => (p.balanceChange || 0) > 0);
    if (allPositive) {
      signals.push({
        description:
          "LEVEL 1 wallet shows positive balance change before launches",
        timing: "7 days before launch",
        reliability: 70,
      });
    }
  }

  // Generic signals based on investigation
  signals.push({
    description: "Monitor v49j for outbound transactions to fresh wallets",
    timing: "During launch window",
    reliability: 95,
  });

  signals.push({
    description: "Watch for ROOT → LEVEL 1 funding as early warning",
    timing: "24-48h before launch",
    reliability: 60,
  });

  return signals;
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  console.log("🚀 Starting Historical Balance Analysis");
  console.log("═".repeat(50));

  const walletAnalysis: BalanceAnalysis["wallets"] = [];

  // Analyze PRIMARY_FUNDER (LEVEL 1)
  const level1Analysis = await analyzeWalletBalances(
    client,
    PRIMARY_FUNDER,
    "level1",
  );
  walletAnalysis.push(level1Analysis);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Analyze ROOT
  const rootAnalysis = await analyzeWalletBalances(client, ROOT_WALLET, "root");
  walletAnalysis.push(rootAnalysis);

  // Identify signals
  const signals = identifySignals(walletAnalysis);

  const analysis: BalanceAnalysis = {
    generatedAt: new Date().toISOString(),
    wallets: walletAnalysis,
    signals,
  };

  // Save results
  const outputDir = path.join(process.cwd(), "data", "analysis");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "historical-balance.json");
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`\n✅ Balance analysis saved to: ${outputPath}`);

  // Print summary
  console.log("\n" + "═".repeat(50));
  console.log("📊 BALANCE ANALYSIS SUMMARY");
  console.log("═".repeat(50));

  for (const wallet of walletAnalysis) {
    console.log(
      `\n${wallet.role.toUpperCase()} (${wallet.address.slice(0, 12)}...):`,
    );
    console.log(`  Timeline entries: ${wallet.balanceTimeline.length}`);
    console.log(
      `  Pre-launch patterns analyzed: ${wallet.preLaunchPatterns.length}`,
    );

    for (const pattern of wallet.preLaunchPatterns) {
      console.log(
        `    ${pattern.ticker}: ${pattern.balanceChange?.toFixed(2) || "N/A"} SOL change`,
      );
    }
  }

  console.log("\nIdentified Signals:");
  for (const signal of signals) {
    console.log(`  [${signal.reliability}%] ${signal.description}`);
    console.log(`       Timing: ${signal.timing}`);
  }
}

main().catch(console.error);
