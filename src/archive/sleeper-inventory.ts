/**
 * Sleeper Wallet Inventory - Threat #3
 *
 * Goal: Find ALL wallets where v49j or 37Xxihfs is the First Funder.
 * These are potential "sleeper" deployer wallets that could be activated.
 *
 * Strategy:
 * 1. Get all outbound counterparties from v49j and 37Xxihfs
 * 2. For each recipient, check if v49j/37Xxihfs is their First Funder
 * 3. Filter to wallets with deployer signature (low tx count, SOL balance)
 * 4. Rank by risk level
 */

import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES, ALL_DEPLOYERS } from "./config/index.js";
import { delay, formatAddress } from "./utils.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

interface SleeperWallet {
  address: string;
  firstFunder: string;
  label?: string;
  balanceSOL: number;
  balanceUSD: number;
  txCount?: number;
  lastActive?: string;
  isKnownDeployer: boolean;
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | "DORMANT";
}

async function getOutboundRecipients(funderAddress: string): Promise<string[]> {
  console.log(`  Fetching counterparties for ${formatAddress(funderAddress)}...`);

  const counterparties = await client.getCounterparties({
    address: funderAddress,
    chain: "solana",
    date: DATES.FULL_HISTORY,
  });

  // Filter to outbound SOL transfers (potential deployer funding)
  const outbound = counterparties.filter(
    (c) =>
      c.volume_out_usd > c.volume_in_usd && // Net outbound
      c.tokens_info?.some((t) => t.token_symbol === "SOL") // SOL transfers
  );

  console.log(`    Found ${outbound.length} outbound SOL recipients`);

  return outbound.map((c) => c.counterparty_address);
}

async function checkFirstFunder(
  address: string,
  expectedFunder: string
): Promise<boolean> {
  const related = await client.getRelatedWallets({
    address,
    chain: "solana",
  });

  const firstFunder = related.find((w) => w.relation === "First Funder");
  return firstFunder?.address === expectedFunder;
}

async function getWalletStatus(
  address: string
): Promise<{ balanceSOL: number; balanceUSD: number; label?: string }> {
  const balance = await client.getCurrentBalance({
    address,
    chain: "solana",
  });

  const solBalance = balance.find((b) => b.token_symbol === "SOL");
  const totalUSD = balance.reduce((sum, b) => sum + (b.value_usd || 0), 0);

  return {
    balanceSOL: solBalance?.token_amount || 0,
    balanceUSD: totalUSD,
  };
}

function assessRisk(wallet: Omit<SleeperWallet, "riskLevel">): SleeperWallet["riskLevel"] {
  // Known deployers are always HIGH
  if (wallet.isKnownDeployer) return "HIGH";

  // Balance-based risk assessment
  if (wallet.balanceSOL >= 5) return "HIGH"; // Enough for deployment
  if (wallet.balanceSOL >= 1) return "MEDIUM"; // Could be topped up
  if (wallet.balanceSOL >= 0.01) return "LOW"; // Has some funds
  return "DORMANT"; // Essentially empty
}

async function main() {
  console.log("=".repeat(70));
  console.log(" SLEEPER WALLET INVENTORY - Threat #3");
  console.log("=".repeat(70));
  console.log("\nSearching for all wallets funded by the deployer chain...\n");

  const knownDeployers = new Set(ALL_DEPLOYERS);
  const sleepers: SleeperWallet[] = [];
  const checkedAddresses = new Set<string>();

  // Funders to check
  const funders = [
    { address: WALLETS.PRIMARY_FUNDER, name: "v49j" },
    { address: WALLETS.ORIGINAL_DEPLOYER, name: "37Xxihfs" },
  ];

  for (const funder of funders) {
    console.log(`\n--- Checking ${funder.name} recipients ---\n`);

    const recipients = await getOutboundRecipients(funder.address);
    await delay(1500);

    let checked = 0;
    for (const recipient of recipients) {
      // Skip already checked
      if (checkedAddresses.has(recipient)) continue;
      checkedAddresses.add(recipient);

      // Skip the funders themselves
      if (recipient === WALLETS.PRIMARY_FUNDER || recipient === WALLETS.ORIGINAL_DEPLOYER) {
        continue;
      }

      checked++;
      console.log(`  [${checked}/${recipients.length}] Checking ${formatAddress(recipient)}...`);

      // Check if this funder is the First Funder
      const isFirstFunder = await checkFirstFunder(recipient, funder.address);
      await delay(1500);

      if (!isFirstFunder) {
        console.log(`    -> First Funder is different, skipping`);
        continue;
      }

      console.log(`    -> CONFIRMED: ${funder.name} is First Funder`);

      // Get wallet status
      const status = await getWalletStatus(recipient);
      await delay(1500);

      const wallet: Omit<SleeperWallet, "riskLevel"> = {
        address: recipient,
        firstFunder: funder.address,
        balanceSOL: status.balanceSOL,
        balanceUSD: status.balanceUSD,
        label: status.label,
        isKnownDeployer: knownDeployers.has(recipient),
      };

      const sleeperWallet: SleeperWallet = {
        ...wallet,
        riskLevel: assessRisk(wallet),
      };

      sleepers.push(sleeperWallet);

      console.log(
        `    -> Balance: ${status.balanceSOL.toFixed(4)} SOL ($${status.balanceUSD.toFixed(2)}) - ${sleeperWallet.riskLevel}`
      );

      // Rate limit: max 20 checks to avoid burning credits
      if (checked >= 20) {
        console.log(`\n  (Stopping at 20 checks to conserve API credits)`);
        break;
      }
    }
  }

  // Sort by risk and balance
  sleepers.sort((a, b) => {
    const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2, DORMANT: 3 };
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    return b.balanceSOL - a.balanceSOL;
  });

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log(" SLEEPER WALLET INVENTORY");
  console.log("=".repeat(70));

  const byRisk = {
    HIGH: sleepers.filter((s) => s.riskLevel === "HIGH"),
    MEDIUM: sleepers.filter((s) => s.riskLevel === "MEDIUM"),
    LOW: sleepers.filter((s) => s.riskLevel === "LOW"),
    DORMANT: sleepers.filter((s) => s.riskLevel === "DORMANT"),
  };

  console.log(`\nTotal chain-funded wallets found: ${sleepers.length}`);
  console.log(`  HIGH risk: ${byRisk.HIGH.length}`);
  console.log(`  MEDIUM risk: ${byRisk.MEDIUM.length}`);
  console.log(`  LOW risk: ${byRisk.LOW.length}`);
  console.log(`  DORMANT: ${byRisk.DORMANT.length}`);

  if (byRisk.HIGH.length > 0) {
    console.log("\n--- HIGH RISK WALLETS (Monitor closely) ---\n");
    for (const w of byRisk.HIGH) {
      const marker = w.isKnownDeployer ? " [KNOWN DEPLOYER]" : "";
      console.log(`  ${w.address}`);
      console.log(`    Balance: ${w.balanceSOL.toFixed(4)} SOL ($${w.balanceUSD.toFixed(2)})${marker}`);
      console.log(`    First Funder: ${formatAddress(w.firstFunder)}`);
    }
  }

  if (byRisk.MEDIUM.length > 0) {
    console.log("\n--- MEDIUM RISK WALLETS ---\n");
    for (const w of byRisk.MEDIUM) {
      console.log(`  ${formatAddress(w.address)} | ${w.balanceSOL.toFixed(4)} SOL`);
    }
  }

  // Recommendations
  console.log("\n--- RECOMMENDATIONS ---\n");

  const unknownHigh = byRisk.HIGH.filter((w) => !w.isKnownDeployer);
  if (unknownHigh.length > 0) {
    console.log("NEW HIGH-RISK SLEEPERS FOUND:");
    for (const w of unknownHigh) {
      console.log(`  - ${w.address} (${w.balanceSOL.toFixed(2)} SOL)`);
    }
    console.log("\n  ACTION: Add these to `npm run status` monitoring!");
  } else if (byRisk.HIGH.length > 0) {
    console.log("All HIGH-risk wallets are known deployers. No new sleepers detected.");
  } else {
    console.log("No HIGH-risk sleepers found. Chain appears dormant.");
  }

  console.log("\n" + "=".repeat(70));

  // Save results
  const fs = await import("fs");
  const outputPath = "data/analysis/sleeper-inventory.json";
  fs.writeFileSync(outputPath, JSON.stringify(sleepers, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(console.error);
