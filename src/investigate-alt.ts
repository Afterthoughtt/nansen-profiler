/**
 * Quick investigation of alternative LEVEL 1 wallet
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const ALT_WALLET = "6rYLG55Q9RpsPGvqdPNJs4z5WTxJVatMB8zV3WJhs5EK";
const ROOT = "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF";
const V49J = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

const DEPLOYERS = [
  "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
  "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
  "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2"
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function investigate() {
  console.log("\n🔍 INVESTIGATING ALTERNATIVE LEVEL 1: 6rYLG55Q...");
  console.log("=".repeat(50));

  // 1. Get related wallets
  console.log("\n1. Related Wallets:");
  const related = await client.getRelatedWallets({
    address: ALT_WALLET,
    chain: "solana",
    pagination: { page: 1, per_page: 50 }
  });
  await delay(2000);

  const firstFunder = related.find(r => r.relation === "First Funder");
  console.log("   First Funder:", firstFunder?.address || "None");
  if (firstFunder?.address === ROOT) {
    console.log("   ✅ CONFIRMED: First Funder is ROOT wallet");
  }
  console.log("   All relations:", related.map(r => `${r.relation} (${r.address.slice(0, 8)})`).join(", "));

  // 2. Get current balance
  console.log("\n2. Current Balance:");
  const balance = await client.getCurrentBalance({
    address: ALT_WALLET,
    chain: "solana"
  });
  await delay(2000);

  const solBalance = balance.find(b => b.token_symbol === "SOL");
  console.log("   SOL:", solBalance?.token_amount?.toFixed(4) || 0, "(~$" + (solBalance?.value_usd?.toFixed(2) || 0) + ")");

  // 3. Get recent transactions
  console.log("\n3. Recent Transactions (Nov 2025):");
  const txs = await client.getTransactions({
    address: ALT_WALLET,
    chain: "solana",
    date: { from: "2025-11-01", to: "2025-11-30" },
    pagination: { page: 1, per_page: 20 }
  });
  await delay(2000);

  console.log("   Total txs in Nov:", txs.data?.length || 0);

  if (txs.data && txs.data.length > 0) {
    console.log("\n   Recent activity:");
    txs.data.slice(0, 10).forEach(tx => {
      const sent = tx.tokens_sent?.map(t =>
        `${t.token_symbol}: ${t.token_amount?.toFixed(4)} to ${t.to_address?.slice(0, 8)}`
      ).join(", ") || "";
      const received = tx.tokens_received?.map(t =>
        `${t.token_symbol}: ${t.token_amount?.toFixed(4)} from ${t.from_address?.slice(0, 8)}`
      ).join(", ") || "";
      console.log("   ", tx.block_timestamp.split("T")[0], tx.method?.slice(0, 20), sent || received || "(no token data)");
    });
  }

  // 4. Get counterparties
  console.log("\n4. Counterparties:");
  const counterparties = await client.getCounterparties({
    address: ALT_WALLET,
    chain: "solana",
    date: { from: "2024-01-01", to: "2025-12-31" },
    group_by: "wallet",
    source_input: "Combined"
  });
  await delay(2000);

  console.log("   Total counterparties:", counterparties.length);

  // Check for interactions with known wallets
  const rootInteraction = counterparties.find(cp => cp.counterparty_address === ROOT);
  const v49jInteraction = counterparties.find(cp => cp.counterparty_address === V49J);
  const deployerInteractions = counterparties.filter(cp => DEPLOYERS.includes(cp.counterparty_address));

  console.log("\n   Key Wallet Interactions:");
  console.log("   - ROOT:", rootInteraction ? `YES ($${rootInteraction.volume_in_usd?.toFixed(2)} in, $${rootInteraction.volume_out_usd?.toFixed(2)} out)` : "NO");
  console.log("   - v49j:", v49jInteraction ? `YES ($${v49jInteraction.volume_in_usd?.toFixed(2)} in, $${v49jInteraction.volume_out_usd?.toFixed(2)} out)` : "NO");
  console.log("   - Known Deployers:", deployerInteractions.length > 0 ? "YES" : "NO");

  // Significant outbound
  const outbound = counterparties
    .filter(cp => cp.volume_out_usd && cp.volume_out_usd > 1)
    .sort((a, b) => (b.volume_out_usd || 0) - (a.volume_out_usd || 0));

  console.log("\n   Significant Outbound (where this wallet sent funds):");
  outbound.slice(0, 10).forEach(cp => {
    const labels = cp.counterparty_address_label?.join(", ") || "";
    console.log(`     - ${cp.counterparty_address.slice(0, 12)}... $${cp.volume_out_usd?.toFixed(2)} (${cp.interaction_count} txs) ${labels}`);
  });

  // 5. Key question: Has this wallet funded any FRESH wallets that could be deployers?
  console.log("\n5. Fresh Wallet Funding Analysis:");

  // Get transactions with SOL sent out
  const allTxs = await client.getTransactions({
    address: ALT_WALLET,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-31" },
    pagination: { page: 1, per_page: 100 }
  });
  await delay(2000);

  const solSent = allTxs.data?.filter(tx =>
    tx.tokens_sent?.some(t => t.token_symbol === "SOL" && t.token_amount > 0.01)
  ) || [];

  console.log("   Transactions sending SOL:", solSent.length);

  // Unique recipients of SOL from this wallet
  const solRecipients = new Set<string>();
  solSent.forEach(tx => {
    tx.tokens_sent?.forEach(t => {
      if (t.token_symbol === "SOL" && t.to_address) {
        solRecipients.add(t.to_address);
      }
    });
  });

  console.log("   Unique SOL recipients:", solRecipients.size);

  // Check if any recipients are fresh (potential deployers)
  console.log("\n   Checking freshness of SOL recipients...");
  let freshCount = 0;
  const recipientArray = Array.from(solRecipients);

  for (const recipient of recipientArray.slice(0, 5)) {
    if (recipient === ALT_WALLET) continue;

    try {
      const isFresh = await client.isWalletFresh(recipient, 20);
      await delay(2000);

      if (isFresh) {
        freshCount++;
        console.log(`     🎯 FRESH WALLET: ${recipient}`);

        // Check if this fresh wallet has deployed anything
        const recipientRelated = await client.getRelatedWallets({
          address: recipient,
          chain: "solana",
          pagination: { page: 1, per_page: 20 }
        });
        await delay(2000);

        const deployedVia = recipientRelated.find(r => r.relation === "Deployed via");
        if (deployedVia) {
          console.log(`        ⚠️ THIS WALLET DEPLOYED TOKENS via ${deployedVia.address.slice(0, 12)}`);
        }
      }
    } catch (e) {
      // Skip errors
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📋 SUMMARY FOR 6rYLG55Q:");
  console.log("=".repeat(50));
  console.log(`   First Funder: ${firstFunder?.address === ROOT ? "ROOT ✅" : firstFunder?.address?.slice(0, 12) || "Unknown"}`);
  console.log(`   Current SOL Balance: ${solBalance?.token_amount?.toFixed(4) || 0}`);
  console.log(`   Recent Activity: ${(txs.data?.length || 0) > 0 ? "YES" : "NO"}`);
  console.log(`   Interacts with ROOT: ${rootInteraction ? "YES" : "NO"}`);
  console.log(`   Interacts with v49j: ${v49jInteraction ? "YES" : "NO"}`);
  console.log(`   Interacts with Deployers: ${deployerInteractions.length > 0 ? "YES" : "NO"}`);
  console.log(`   Has funded fresh wallets: ${freshCount > 0 ? "YES" : "NO"}`);

  if (firstFunder?.address === ROOT && (txs.data?.length || 0) > 0) {
    console.log("\n   ⚠️ CONCLUSION: This is a potential alternative LEVEL 1 wallet!");
    console.log("   Consider adding to monitoring.");
  } else {
    console.log("\n   ✅ CONCLUSION: Likely not a threat to current monitoring strategy.");
  }
}

investigate().catch(console.error);
