/**
 * Check if 56S29mZ3... is a generic trading bot or a specific insider
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const WALLET = "56S29mZ3wqvw8hATuUUFqKhGcSGYFASRRFNT38W8q7G3";

async function check() {
  console.log("=".repeat(60));
  console.log("CHECKING: Is 56S29mZ3... a bot or insider?");
  console.log("=".repeat(60));
  console.log(`\nWallet: ${WALLET}`);

  // Get recent transactions
  console.log("\n📊 Fetching transaction history...");

  const txns = await client.getTransactions({
    address: WALLET,
    chain: "solana",
    date: { from: "2025-09-01", to: "2025-11-30" },
    pagination: { page: 1, per_page: 100 },
  });

  const txnArray = txns || [];
  console.log(`\nTotal transactions (Sep-Nov): ${txnArray.length}`);

  // Get counterparties to see trading patterns
  console.log("\n📊 Fetching counterparties...");

  const counterparties = await client.getCounterparties({
    address: WALLET,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-11-30" },
  });

  const cpArray = counterparties || [];
  console.log(`Total counterparties: ${cpArray.length}`);

  if (cpArray.length === 0) {
    console.log("   No counterparties found - checking transactions directly...");
  }

  // Check for bot-like labels
  const botLabels = cpArray.filter(c =>
    c.label?.toLowerCase().includes("bot") ||
    c.label?.toLowerCase().includes("raydium") ||
    c.label?.toLowerCase().includes("jupiter") ||
    c.label?.toLowerCase().includes("dex")
  );

  if (botLabels.length > 0) {
    console.log(`\n⚠️  Found ${botLabels.length} DEX/Bot-related counterparties:`);
    for (const cp of botLabels.slice(0, 10)) {
      console.log(`   ${cp.address?.slice(0, 12) || "?"}... - ${cp.label}`);
    }
  }

  // Show top counterparties by volume
  if (cpArray.length > 0) {
    console.log("\n📊 Top 15 counterparties by interaction:");
    const sorted = [...cpArray]
      .sort((a, b) => (b.total_volume_usd || 0) - (a.total_volume_usd || 0))
      .slice(0, 15);

    for (const cp of sorted) {
      const addr = cp.address?.slice(0, 20) || "unknown";
      const label = cp.label || "Unknown";
      const vol = cp.total_volume_usd?.toFixed(2) || "?";
      console.log(`   ${addr}... | $${vol} | ${label}`);
    }
  }

  // Check transaction frequency (bot indicator)
  if (txnArray.length > 0) {
    const dates = txnArray.map(t => t.block_timestamp?.split("T")[0]).filter(Boolean);
    const uniqueDates = new Set(dates);
    const avgTxPerDay = uniqueDates.size > 0 ? txnArray.length / uniqueDates.size : 0;

    console.log(`\n📊 Activity Pattern:`);
    console.log(`   Active days: ${uniqueDates.size}`);
    console.log(`   Avg transactions per active day: ${avgTxPerDay.toFixed(1)}`);

    if (avgTxPerDay > 20) {
      console.log(`   ⚠️  HIGH FREQUENCY - likely a bot`);
    } else if (avgTxPerDay > 5) {
      console.log(`   ⚠️  MODERATE FREQUENCY - could be bot or active trader`);
    } else {
      console.log(`   ✅ LOW FREQUENCY - likely manual trading`);
    }

    // Show sample transactions
    console.log("\n📊 Sample transactions:");
    for (const tx of txnArray.slice(0, 10)) {
      console.log(`   ${tx.block_timestamp} | ${tx.transaction_type || "?"} | ${tx.counterparty?.slice(0, 12) || "?"}...`);
    }
  }

  // Get related wallets to check for signer patterns
  console.log("\n📊 Checking related wallets...");
  const related = await client.getRelatedWallets({
    address: WALLET,
    chain: "solana",
  });

  const relArray = related || [];
  const firstFunder = relArray.find(r => r.relation === "First Funder");
  if (firstFunder) {
    console.log(`   First Funder: ${firstFunder.address}`);
    if (firstFunder.label) {
      console.log(`   Label: ${firstFunder.label}`);
    }
  }

  // Check current balance
  console.log("\n📊 Current balance...");
  const balance = await client.getCurrentBalance({
    address: WALLET,
    chain: "solana",
  });

  const balArray = balance || [];
  const solBalance = balArray.find(b => b.token_symbol === "SOL");
  console.log(`   SOL: ${solBalance?.token_amount?.toFixed(4) || 0}`);

  // Count unique tokens traded
  const tokenCount = balArray.length;
  console.log(`   Token types held: ${tokenCount}`);

  // Final assessment
  console.log("\n" + "=".repeat(60));
  console.log("ASSESSMENT");
  console.log("=".repeat(60));

  const isHighFrequency = txnArray.length > 50;
  const manyCounterparties = cpArray.length > 30;
  const manyTokens = tokenCount > 20;

  if (isHighFrequency || manyCounterparties || manyTokens) {
    console.log("\n❌ LIKELY A BOT");
    if (isHighFrequency) console.log("   - High transaction frequency");
    if (manyCounterparties) console.log("   - Many counterparties");
    if (manyTokens) console.log("   - Holds many different tokens");
    console.log("\n   RECOMMENDATION: REMOVE from insider watchlist.");
  } else {
    console.log("\n✅ POSSIBLY AN INSIDER - Low activity, selective trading");
    console.log("   RECOMMENDATION: Keep on watchlist but lower priority.");
  }
}

check().catch(console.error);
