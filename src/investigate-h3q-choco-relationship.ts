/**
 * Investigate the relationship between H3qSndFC (Insider Wallet #2)
 * and CHOCO Deployer - $190k volume between them
 */

import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const WALLET_2 = "H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot";
const CHOCO = "BDVgXauNbs7AQEqgPich2hUANu6oLf9VQEuXqL2q3Q5a";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log("═".repeat(70));
  console.log("🔍 ANALYZING: H3qSndFC ↔ CHOCO Deployer Relationship");
  console.log("   $190,000 volume between these wallets - WHY?");
  console.log("═".repeat(70));

  // 1. First, confirm the First Funder relationship
  console.log("\n📍 RELATIONSHIP VERIFICATION");
  console.log("-".repeat(50));

  const related = await client.getRelatedWallets({
    address: WALLET_2,
    chain: "solana",
    pagination: { page: 1, per_page: 50 }
  });
  await delay(2000);

  const firstFunder = related.find(r => r.relation === "First Funder");
  console.log("   H3qSndFC's First Funder:", firstFunder?.address.slice(0, 16) || "Unknown");
  console.log("   Is it CHOCO?", firstFunder?.address === CHOCO ? "✅ YES" : "❌ NO");

  // 2. Get all transactions between them
  console.log("\n📍 TRANSACTION HISTORY (H3qSndFC)");
  console.log("-".repeat(50));

  const txResult = await client.getTransactions({
    address: WALLET_2,
    chain: "solana",
    date: { from: "2025-01-01", to: "2025-12-01" },
    pagination: { page: 1, per_page: 100 }
  });
  await delay(2000);

  const txs = txResult.data || [];
  console.log("   Total transactions:", txs.length);

  // Filter transactions involving CHOCO
  const chocoTxs = txs.filter(tx => {
    const sentToChoco = (tx.tokens_sent || []).some(s => s.to_address === CHOCO);
    const recvFromChoco = (tx.tokens_received || []).some(r => r.from_address === CHOCO);
    return sentToChoco || recvFromChoco;
  });

  console.log("   Transactions involving CHOCO:", chocoTxs.length);

  // Analyze the transactions
  let totalSentToChoco = 0;
  let totalRecvFromChoco = 0;
  const tokensSent: Record<string, number> = {};
  const tokensRecv: Record<string, number> = {};

  console.log("\n📍 DETAILED TRANSACTIONS WITH CHOCO");
  console.log("-".repeat(50));

  for (const tx of chocoTxs) {
    const time = new Date(tx.block_timestamp);
    const timeStr = time.toISOString().replace("T", " ").slice(0, 19);

    console.log(`\n   [${timeStr}]`);

    // Sent to CHOCO
    for (const sent of tx.tokens_sent || []) {
      if (sent.to_address === CHOCO) {
        const amt = sent.token_amount || 0;
        const sym = sent.token_symbol || "?";
        const usd = sent.value_usd || 0;
        totalSentToChoco += usd;
        tokensSent[sym] = (tokensSent[sym] || 0) + amt;
        console.log(`      SENT → CHOCO: ${amt.toFixed(4)} ${sym} ($${usd.toFixed(2)})`);
      }
    }

    // Received from CHOCO
    for (const recv of tx.tokens_received || []) {
      if (recv.from_address === CHOCO) {
        const amt = recv.token_amount || 0;
        const sym = recv.token_symbol || "?";
        const usd = recv.value_usd || 0;
        totalRecvFromChoco += usd;
        tokensRecv[sym] = (tokensRecv[sym] || 0) + amt;
        console.log(`      RECV ← CHOCO: ${amt.toFixed(4)} ${sym} ($${usd.toFixed(2)})`);
      }
    }
  }

  // Summary
  console.log("\n\n" + "═".repeat(70));
  console.log("FLOW SUMMARY");
  console.log("═".repeat(70));

  console.log("\n📤 H3qSndFC → CHOCO (Sent):");
  console.log("   Total USD Value: $" + totalSentToChoco.toFixed(2));
  for (const [sym, amt] of Object.entries(tokensSent)) {
    console.log(`      ${sym}: ${amt.toFixed(4)}`);
  }

  console.log("\n📥 CHOCO → H3qSndFC (Received):");
  console.log("   Total USD Value: $" + totalRecvFromChoco.toFixed(2));
  for (const [sym, amt] of Object.entries(tokensRecv)) {
    console.log(`      ${sym}: ${amt.toFixed(4)}`);
  }

  console.log("\n📊 NET FLOW:");
  const netFlow = totalRecvFromChoco - totalSentToChoco;
  if (netFlow > 0) {
    console.log(`   H3qSndFC RECEIVED $${netFlow.toFixed(2)} more than they sent`);
    console.log("   ⚠️  H3qSndFC is PROFITING from CHOCO!");
  } else if (netFlow < 0) {
    console.log(`   H3qSndFC SENT $${Math.abs(netFlow).toFixed(2)} more than they received`);
    console.log("   💰 H3qSndFC is PAYING CHOCO!");
  } else {
    console.log("   Balanced flow");
  }

  // 3. Check what tokens H3qSndFC holds
  console.log("\n\n📍 H3qSndFC CURRENT HOLDINGS");
  console.log("-".repeat(50));

  const balance = await client.getCurrentBalance({
    address: WALLET_2,
    chain: "solana"
  });
  await delay(2000);

  const solBalance = balance.find(b => b.token_symbol === "SOL");
  console.log("   SOL:", (solBalance?.token_amount || 0).toFixed(4));

  const otherTokens = balance.filter(b => b.token_symbol !== "SOL" && (b.value_usd || 0) > 0.01);
  if (otherTokens.length > 0) {
    console.log("\n   Other holdings:");
    for (const t of otherTokens.slice(0, 10)) {
      console.log(`      ${t.token_symbol}: ${t.token_amount?.toFixed(2)} (~$${(t.value_usd || 0).toFixed(2)})`);
    }
  }

  // 4. Interpretation
  console.log("\n\n" + "═".repeat(70));
  console.log("🎯 INTERPRETATION");
  console.log("═".repeat(70));

  console.log(`
The $190k volume means one of these scenarios:

1. 🤝 INSIDER RELATIONSHIP
   - CHOCO Deployer funded H3qSndFC
   - H3qSndFC trades CHOCO's tokens (buys early, sells later)
   - Profits flow back and forth between them
   - They are likely the SAME ENTITY or coordinating

2. 🤖 TRADING BOT OPERATION
   - H3qSndFC is a trading bot wallet owned by CHOCO deployer
   - High volume from automated trading
   - Profits consolidate back to CHOCO

3. 💰 PROFIT SHARING
   - H3qSndFC gets early access to CHOCO's token launches
   - Buys early, sells to retail
   - Sends portion of profits back to CHOCO

Key Evidence:
- First Funder relationship: ${firstFunder?.address === CHOCO ? "CONFIRMED" : "NOT CONFIRMED"}
- Direct transactions: ${chocoTxs.length} found
- Net flow: $${Math.abs(netFlow).toFixed(2)} ${netFlow > 0 ? "TO H3qSndFC" : "TO CHOCO"}
`);

  console.log("═".repeat(70));
}

main().catch(console.error);
