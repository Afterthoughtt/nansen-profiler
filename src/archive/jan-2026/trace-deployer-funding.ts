/**
 * Trace Deployer Funding Patterns
 * Answers: How was each deployer funded? Is there a consistent pattern?
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const DEPLOYERS = [
  {
    name: "37Xxihfs",
    address: WALLETS.ORIGINAL_DEPLOYER,
    tokens: ["ArkXRP (Jun 15)", "DogwifXRP (Jul 20)", "WFXRP (Aug 24)"],
    type: "ORIGINAL",
  },
  {
    name: "D7Ms",
    address: WALLETS.DEPLOYER_D7MS,
    tokens: ["XRPEP3 (Sep 28)"],
    type: "FRESH",
  },
  {
    name: "DBmx",
    address: WALLETS.DEPLOYER_DBMX,
    tokens: ["TrollXRP (Nov 2)"],
    type: "FRESH",
  },
  {
    name: "Bz2yexdH",
    address: WALLETS.DEPLOYER_BZ2Y,
    tokens: ["RXRP (Nov 30)"],
    type: "FRESH",
  },
];

interface FundingSource {
  from: string;
  fromLabel?: string;
  amount: number;
  symbol: string;
  timestamp: string;
}

async function traceFundingForDeployer(
  name: string,
  address: string
): Promise<FundingSource[]> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📍 ${name} (${address.slice(0, 8)}...)`);
  console.log(`${"=".repeat(60)}`);

  // Get First Funder
  const firstFunder = await client.findFirstFunder(address);
  console.log(`\n  First Funder: ${firstFunder || "Unknown"}`);

  await new Promise((r) => setTimeout(r, 1500));

  // Get related wallets to find all funders
  const related = await client.getRelatedWallets({
    address,
    chain: "solana",
    pagination: { page: 1, per_page: 50 },
  });

  const funders = related.filter(
    (r) => r.relation === "First Funder" || r.relation === "Funded By"
  );
  if (funders.length > 0) {
    console.log(`\n  Related funders:`);
    for (const f of funders) {
      const labels = f.labels?.join(", ") || "No label";
      console.log(`    ${f.relation}: ${f.address.slice(0, 12)}... (${labels})`);
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // Get all transactions to find inbound SOL
  console.log(`\n  Fetching transactions...`);
  const txResult = await client.getTransactions({
    address,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txResult.data || [];
  console.log(`  Found ${transactions.length} transactions`);

  // Extract inbound SOL transfers
  const fundingSources: FundingSource[] = [];

  for (const tx of transactions) {
    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        // Only look at SOL and significant amounts
        if (
          recv.token_symbol === "SOL" &&
          recv.token_amount &&
          recv.token_amount > 0.5
        ) {
          fundingSources.push({
            from: recv.from_address || "unknown",
            amount: recv.token_amount,
            symbol: recv.token_symbol,
            timestamp: tx.block_timestamp || "unknown",
          });
        }
      }
    }
  }

  // Sort by timestamp
  fundingSources.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  console.log(`\n  Inbound SOL (>0.5 SOL):`);
  let totalFunding = 0;
  for (const fs of fundingSources) {
    const shortAddr = fs.from.slice(0, 12);
    const date = new Date(fs.timestamp).toLocaleString();
    console.log(`    ${date}: ${fs.amount.toFixed(4)} SOL from ${shortAddr}...`);
    totalFunding += fs.amount;
  }
  console.log(`\n  TOTAL FUNDED: ${totalFunding.toFixed(4)} SOL`);

  return fundingSources;
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  DEPLOYER FUNDING PATTERN ANALYSIS");
  console.log("  Question: How was each deployer originally funded?");
  console.log("=".repeat(70));

  const results: Record<string, FundingSource[]> = {};

  for (const deployer of DEPLOYERS) {
    results[deployer.name] = await traceFundingForDeployer(
      `${deployer.name} - ${deployer.tokens.join(", ")}`,
      deployer.address
    );
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  PATTERN ANALYSIS SUMMARY");
  console.log("=".repeat(70));

  console.log("\n  Token → Deployer → Funding Sources:");
  console.log("  " + "-".repeat(60));

  for (const deployer of DEPLOYERS) {
    const sources = results[deployer.name];
    const sourceList = sources.map((s) => s.from.slice(0, 8)).join(", ");
    const total = sources.reduce((sum, s) => sum + s.amount, 0);
    console.log(`\n  ${deployer.tokens[0]}:`);
    console.log(`    Deployer: ${deployer.name}`);
    console.log(`    Sources: ${sourceList || "None found"}`);
    console.log(`    Total: ${total.toFixed(2)} SOL`);
    console.log(`    # of funding txns: ${sources.length}`);
  }

  // Key insight
  console.log("\n" + "=".repeat(70));
  console.log("  KEY INSIGHT FOR TODAY'S LAUNCH");
  console.log("=".repeat(70));

  console.log(`
  HYMt currently has 7.1 SOL from v49j.

  If the pattern holds, additional funding may come from:
  - 37Xxihfs (Original Deployer) - currently 0.07 SOL
  - HVRcXaCF or similar intermediary
  - Direct CEX funding

  WATCH FOR:
  1. HYMt receiving MORE inbound SOL
  2. HYMt sending SOL to a NEW fresh wallet (if HYMt is funder, not deployer)
`);
}

main().catch(console.error);
