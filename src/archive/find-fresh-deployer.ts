import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { readFileSync } from "fs";

const WALLETS = {
  "37Xxihfs": "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
  v49j: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
};

interface Candidate {
  address: string;
  fundedBy: string;
  fundedByLabel: string;
  fundingAmount: number;
  fundingTimestamp: string;
  firstFunder: string | null;
  firstFunderLabel?: string;
  currentBalance: number;
  isFreshWallet: boolean;
  isKnownDeployer: boolean;
  knownRole?: string;
  priority: "HIGH" | "MEDIUM" | "LOW" | "KNOWN";
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not set");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);

  // Load known deployers
  const deployersData = JSON.parse(
    readFileSync("data/deployers.json", "utf-8")
  );
  const knownDeployers = new Set<string>(deployersData.map((d: any) => d.address));
  const knownWallets = new Map<string, string>([
    [WALLETS["37Xxihfs"], "Original Deployer (37Xxihfs)"],
    [WALLETS.v49j, "Primary Funder (v49j)"],
    ["9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF", "ROOT"],
    ["DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy", "DBmx Deployer"],
    ["D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb", "D7Ms Deployer"],
    ["GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb", "GUCX6xNe (pre-funded)"],
  ]);

  console.log("🔍 FRESH WALLET HUNT - Urgent Investigation");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("");

  const candidates: Candidate[] = [];
  const processedRecipients = new Set<string>();

  // Check both funding wallets
  for (const [label, address] of Object.entries(WALLETS)) {
    console.log(`\n📊 Checking ${label} (${address.slice(0, 8)}...) outbound transfers`);
    console.log("-".repeat(60));

    try {
      // Get transactions from last 48 hours
      const txResponse = await client.getTransactions({
        address,
        chain: "solana",
        date: {
          from: "2025-11-28",
          to: "2025-11-30",
        },
        pagination: { page: 1, per_page: 100 },
      });

      const transactions = txResponse.data || [];
      console.log(`  Found ${transactions.length} transactions in date range`);

      // Find SOL outbound transfers
      let solTransfers = 0;
      for (const tx of transactions) {
        if (!tx.tokens_sent) continue;

        for (const sent of tx.tokens_sent) {
          if (sent.token_symbol !== "SOL") continue;
          if (!sent.to_address) continue;
          if (sent.to_address === address) continue; // Skip self-transfers
          if (processedRecipients.has(sent.to_address)) continue;

          solTransfers++;
          processedRecipients.add(sent.to_address);

          const recipient = sent.to_address;
          const amount = sent.token_amount || 0;

          console.log(`\n  💸 SOL Transfer: ${amount.toFixed(4)} SOL → ${recipient.slice(0, 12)}...`);
          console.log(`     Timestamp: ${tx.block_timestamp}`);

          // Small delay between API calls
          await new Promise((r) => setTimeout(r, 1500));

          // Check First Funder
          let firstFunder: string | null = null;
          let firstFunderLabel: string | undefined;
          try {
            const related = await client.getRelatedWallets({
              address: recipient,
              chain: "solana",
              pagination: { page: 1, per_page: 20 },
            });
            const ff = related.find((r) => r.relation === "First Funder");
            if (ff) {
              firstFunder = ff.address;
              firstFunderLabel = ff.address_label;
            }
          } catch (e) {
            console.log(`     ⚠️ Could not get First Funder`);
          }

          await new Promise((r) => setTimeout(r, 1500));

          // Check current balance
          let currentBalance = 0;
          try {
            const balances = await client.getCurrentBalance({
              address: recipient,
              chain: "solana",
            });
            const solBalance = balances.find((b) => b.token_symbol === "SOL");
            currentBalance = solBalance?.token_amount || 0;
          } catch (e) {
            console.log(`     ⚠️ Could not get balance`);
          }

          // Determine if fresh wallet (First Funder is one of our targets)
          const isFreshWallet =
            firstFunder === WALLETS["37Xxihfs"] ||
            firstFunder === WALLETS.v49j ||
            firstFunder === address;

          // Check if known deployer
          const isKnownDeployer = knownDeployers.has(recipient);
          const knownRole = knownWallets.get(recipient);

          // Determine priority
          let priority: Candidate["priority"] = "LOW";
          if (isKnownDeployer || knownRole) {
            priority = "KNOWN";
          } else if (isFreshWallet && currentBalance >= 5) {
            priority = "HIGH";
          } else if (isFreshWallet || currentBalance >= 1) {
            priority = "MEDIUM";
          }

          candidates.push({
            address: recipient,
            fundedBy: address,
            fundedByLabel: label,
            fundingAmount: amount,
            fundingTimestamp: tx.block_timestamp,
            firstFunder,
            firstFunderLabel,
            currentBalance,
            isFreshWallet,
            isKnownDeployer,
            knownRole,
            priority,
          });

          console.log(`     First Funder: ${firstFunder?.slice(0, 12) || "Unknown"}... ${firstFunderLabel ? `(${firstFunderLabel})` : ""}`);
          console.log(`     Current Balance: ${currentBalance.toFixed(4)} SOL`);
          console.log(`     Fresh Wallet: ${isFreshWallet ? "✅ YES" : "❌ No"}`);
          console.log(`     Priority: ${priority}`);
        }
      }

      if (solTransfers === 0) {
        console.log("  ❌ No SOL outbound transfers found in date range");
      }
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
    }

    // Delay between wallet checks
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Also check the current balances of funding wallets
  console.log("\n\n📊 FUNDING WALLET STATUS");
  console.log("=".repeat(60));

  for (const [label, address] of Object.entries(WALLETS)) {
    try {
      const balances = await client.getCurrentBalance({
        address,
        chain: "solana",
      });
      const solBalance = balances.find((b) => b.token_symbol === "SOL");
      console.log(`${label}: ${solBalance?.token_amount?.toFixed(4) || "0"} SOL`);
    } catch (e) {
      console.log(`${label}: Error fetching balance`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Print results
  console.log("\n\n🎯 INVESTIGATION RESULTS");
  console.log("=".repeat(60));

  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2, KNOWN: 3 };
  candidates.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // HIGH PRIORITY
  const highPriority = candidates.filter((c) => c.priority === "HIGH");
  if (highPriority.length > 0) {
    console.log("\n🚨 HIGH PRIORITY (Fresh wallet with 5+ SOL):");
    console.log("-".repeat(60));
    for (const c of highPriority) {
      console.log(`  ${c.address}`);
      console.log(`    Balance: ${c.currentBalance.toFixed(4)} SOL`);
      console.log(`    Funded by: ${c.fundedByLabel} (${c.fundingAmount.toFixed(4)} SOL)`);
      console.log(`    Funded at: ${c.fundingTimestamp}`);
      console.log(`    First Funder: ${c.firstFunder?.slice(0, 12)}... ${c.firstFunderLabel ? `(${c.firstFunderLabel})` : ""}`);
      console.log("");
    }
  } else {
    console.log("\n⚠️ No HIGH PRIORITY candidates found");
  }

  // MEDIUM PRIORITY
  const mediumPriority = candidates.filter((c) => c.priority === "MEDIUM");
  if (mediumPriority.length > 0) {
    console.log("\n⚡ MEDIUM PRIORITY (Fresh or has balance):");
    console.log("-".repeat(60));
    for (const c of mediumPriority) {
      console.log(`  ${c.address}`);
      console.log(`    Balance: ${c.currentBalance.toFixed(4)} SOL | Funded: ${c.fundingAmount.toFixed(4)} SOL`);
      console.log(`    Fresh: ${c.isFreshWallet ? "Yes" : "No"} | First Funder: ${c.firstFunder?.slice(0, 12) || "Unknown"}...`);
      console.log("");
    }
  }

  // KNOWN wallets
  const knownPriority = candidates.filter((c) => c.priority === "KNOWN");
  if (knownPriority.length > 0) {
    console.log("\n📋 KNOWN WALLETS:");
    console.log("-".repeat(60));
    for (const c of knownPriority) {
      console.log(`  ${c.address.slice(0, 12)}... - ${c.knownRole || "Known Deployer"}`);
      console.log(`    Balance: ${c.currentBalance.toFixed(4)} SOL`);
    }
  }

  // Summary
  console.log("\n\n📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total recipients analyzed: ${candidates.length}`);
  console.log(`HIGH priority: ${highPriority.length}`);
  console.log(`MEDIUM priority: ${mediumPriority.length}`);
  console.log(`KNOWN wallets: ${knownPriority.length}`);

  if (highPriority.length === 0 && mediumPriority.length === 0) {
    console.log("\n⚠️  NO FRESH DEPLOYER CANDIDATES FOUND IN LAST 48 HOURS");
    console.log("    Possible scenarios:");
    console.log("    1. Fresh wallet not funded yet - continue monitoring");
    console.log("    2. Using different funding path not tracked");
    console.log("    3. Reusing existing deployer (DBmx, D7Ms, or 37Xxihfs directly)");
  }
}

main().catch(console.error);
