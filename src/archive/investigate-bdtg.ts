/**
 * Deep investigation of BdtGEty8 wallet
 * - v49j is First Funder
 * - Has 5.9 SOL balance
 * - Has NOT deployed tokens
 * - What is this wallet used for?
 */

import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const BDTG = "BdtGEty8bVMcbuwXad7stWQXKqNpCqo8UQKTS8wmw2Db";
const V49J = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
const ROOT = "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF";

const KNOWN_DEPLOYERS = [
  "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
  "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
  "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2"
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function investigate() {
  console.log("=".repeat(60));
  console.log("🔍 DEEP INVESTIGATION: BdtGEty8bVMcbuwXad7stWQXKqNpCqo8UQKTS8wmw2Db");
  console.log("=".repeat(60));

  // 1. Basic info
  console.log("\n1. BASIC INFO");
  console.log("-".repeat(40));

  const related = await client.getRelatedWallets({
    address: BDTG,
    chain: "solana",
    pagination: { page: 1, per_page: 50 }
  });
  await delay(2000);

  console.log("All relationships:");
  related.forEach(r => {
    console.log(`   ${r.relation}: ${r.address.slice(0, 16)}...`);
    if (r.address === V49J) console.log("      ^ THIS IS v49j");
    if (r.address === ROOT) console.log("      ^ THIS IS ROOT");
  });

  const firstFunder = related.find(r => r.relation === "First Funder");
  const deployedVia = related.find(r => r.relation === "Deployed via");
  const signers = related.filter(r => r.relation === "Signer");

  console.log("\nFirst Funder:", firstFunder?.address || "None");
  console.log("Is v49j First Funder?", firstFunder?.address === V49J ? "✅ YES" : "NO");
  console.log("Has deployed tokens?", deployedVia ? "YES" : "NO");
  console.log("Signers:", signers.length);

  // 2. Current balance
  console.log("\n2. CURRENT BALANCE");
  console.log("-".repeat(40));

  const balance = await client.getCurrentBalance({
    address: BDTG,
    chain: "solana"
  });
  await delay(2000);

  console.log("Token holdings:");
  balance.forEach(b => {
    console.log(`   ${b.token_symbol}: ${b.token_amount?.toFixed(6)} (~$${b.value_usd?.toFixed(2) || 0})`);
  });

  const totalUsd = balance.reduce((sum, b) => sum + (b.value_usd || 0), 0);
  console.log(`\nTotal value: ~$${totalUsd.toFixed(2)}`);

  // 3. Transaction history
  console.log("\n3. TRANSACTION HISTORY");
  console.log("-".repeat(40));

  // Get transactions in chunks
  const dateRanges = [
    { from: "2025-09-01", to: "2025-11-30", label: "Sep-Nov 2025" },
    { from: "2025-06-01", to: "2025-08-31", label: "Jun-Aug 2025" },
    { from: "2025-01-01", to: "2025-05-31", label: "Jan-May 2025" },
  ];

  let allTxs: any[] = [];

  for (const range of dateRanges) {
    console.log(`\nFetching ${range.label}...`);
    try {
      const txs = await client.getTransactions({
        address: BDTG,
        chain: "solana",
        date: { from: range.from, to: range.to },
        pagination: { page: 1, per_page: 100 }
      });
      await delay(2000);

      console.log(`   Found ${txs.data?.length || 0} transactions`);
      if (txs.data) allTxs = allTxs.concat(txs.data);
    } catch (e: any) {
      console.log(`   Error: ${e.message?.slice(0, 50)}`);
    }
  }

  console.log(`\nTotal transactions found: ${allTxs.length}`);

  // Analyze transaction patterns
  if (allTxs.length > 0) {
    console.log("\n4. TRANSACTION ANALYSIS");
    console.log("-".repeat(40));

    // Sort by timestamp
    allTxs.sort((a, b) => new Date(a.block_timestamp).getTime() - new Date(b.block_timestamp).getTime());

    // First transaction (likely funding from v49j)
    const firstTx = allTxs[0];
    console.log("\nFirst transaction:");
    console.log(`   Date: ${firstTx.block_timestamp}`);
    console.log(`   Method: ${firstTx.method}`);
    if (firstTx.tokens_received) {
      firstTx.tokens_received.forEach((t: any) => {
        console.log(`   Received: ${t.token_amount?.toFixed(4)} ${t.token_symbol} from ${t.from_address?.slice(0, 12)}`);
        if (t.from_address === V49J) console.log("      ^ FROM v49j");
      });
    }

    // Most recent transactions
    console.log("\nMost recent 10 transactions:");
    const recent = allTxs.slice(-10);
    recent.forEach(tx => {
      const date = tx.block_timestamp.split("T")[0];
      const sent = tx.tokens_sent?.map((t: any) =>
        `SENT ${t.token_amount?.toFixed(4)} ${t.token_symbol} to ${t.to_address?.slice(0, 8)}`
      ).join(", ") || "";
      const received = tx.tokens_received?.map((t: any) =>
        `RECV ${t.token_amount?.toFixed(4)} ${t.token_symbol} from ${t.from_address?.slice(0, 8)}`
      ).join(", ") || "";

      console.log(`   ${date} | ${tx.method?.slice(0, 20)} | ${sent || received || "(no token data)"}`);
    });

    // Categorize transactions
    console.log("\n5. TRANSACTION CATEGORIZATION");
    console.log("-".repeat(40));

    let solReceived = 0;
    let solSent = 0;
    let tokenSwaps = 0;
    let otherTxs = 0;

    const interactedWith = new Set<string>();

    allTxs.forEach(tx => {
      tx.tokens_sent?.forEach((t: any) => {
        if (t.token_symbol === "SOL") solSent += t.token_amount || 0;
        if (t.to_address) interactedWith.add(t.to_address);
      });
      tx.tokens_received?.forEach((t: any) => {
        if (t.token_symbol === "SOL") solReceived += t.token_amount || 0;
        if (t.from_address) interactedWith.add(t.from_address);
      });

      if (tx.method?.toLowerCase().includes("swap")) tokenSwaps++;
      else otherTxs++;
    });

    console.log(`SOL received: ${solReceived.toFixed(4)}`);
    console.log(`SOL sent: ${solSent.toFixed(4)}`);
    console.log(`Net SOL: ${(solReceived - solSent).toFixed(4)}`);
    console.log(`Swap transactions: ${tokenSwaps}`);
    console.log(`Other transactions: ${otherTxs}`);
    console.log(`Unique addresses interacted with: ${interactedWith.size}`);

    // Check for known wallet interactions
    console.log("\n6. KNOWN WALLET INTERACTIONS");
    console.log("-".repeat(40));

    const v49jInteractions = allTxs.filter(tx =>
      tx.tokens_sent?.some((t: any) => t.to_address === V49J) ||
      tx.tokens_received?.some((t: any) => t.from_address === V49J)
    );
    console.log(`Interactions with v49j: ${v49jInteractions.length}`);

    const rootInteractions = allTxs.filter(tx =>
      tx.tokens_sent?.some((t: any) => t.to_address === ROOT) ||
      tx.tokens_received?.some((t: any) => t.from_address === ROOT)
    );
    console.log(`Interactions with ROOT: ${rootInteractions.length}`);

    const deployerInteractions = allTxs.filter(tx =>
      tx.tokens_sent?.some((t: any) => KNOWN_DEPLOYERS.includes(t.to_address)) ||
      tx.tokens_received?.some((t: any) => KNOWN_DEPLOYERS.includes(t.from_address))
    );
    console.log(`Interactions with known deployers: ${deployerInteractions.length}`);

    if (deployerInteractions.length > 0) {
      console.log("\n⚠️ DEPLOYER INTERACTIONS:");
      deployerInteractions.forEach(tx => {
        console.log(`   ${tx.block_timestamp.split("T")[0]} | ${tx.method}`);
        tx.tokens_sent?.forEach((t: any) => {
          if (KNOWN_DEPLOYERS.includes(t.to_address)) {
            console.log(`      SENT to deployer: ${t.token_amount?.toFixed(4)} ${t.token_symbol}`);
          }
        });
        tx.tokens_received?.forEach((t: any) => {
          if (KNOWN_DEPLOYERS.includes(t.from_address)) {
            console.log(`      RECV from deployer: ${t.token_amount?.toFixed(4)} ${t.token_symbol}`);
          }
        });
      });
    }
  }

  // 7. Counterparties analysis
  console.log("\n7. COUNTERPARTIES (who does this wallet interact with?)");
  console.log("-".repeat(40));

  try {
    const counterparties = await client.getCounterparties({
      address: BDTG,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      group_by: "wallet",
      source_input: "Combined"
    });
    await delay(2000);

    console.log(`Total counterparties: ${counterparties.length}`);

    // Sort by volume
    const sorted = counterparties.sort((a, b) =>
      ((b.total_volume_usd || 0) - (a.total_volume_usd || 0))
    );

    console.log("\nTop 10 by volume:");
    sorted.slice(0, 10).forEach(cp => {
      const labels = cp.counterparty_address_label?.join(", ") || "";
      let note = "";
      if (cp.counterparty_address === V49J) note = " ← v49j";
      if (cp.counterparty_address === ROOT) note = " ← ROOT";
      if (KNOWN_DEPLOYERS.includes(cp.counterparty_address)) note = " ← DEPLOYER";

      console.log(`   ${cp.counterparty_address.slice(0, 12)}... | $${cp.total_volume_usd?.toFixed(2)} | ${cp.interaction_count} txs ${labels}${note}`);
    });

    // Check if any counterparty is a deployer
    const deployerCps = counterparties.filter(cp => KNOWN_DEPLOYERS.includes(cp.counterparty_address));
    if (deployerCps.length > 0) {
      console.log("\n⚠️ INTERACTS WITH DEPLOYERS:");
      deployerCps.forEach(cp => {
        console.log(`   ${cp.counterparty_address}`);
        console.log(`   Volume in: $${cp.volume_in_usd?.toFixed(2)}, Volume out: $${cp.volume_out_usd?.toFixed(2)}`);
      });
    }

  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }

  // 8. Conclusion
  console.log("\n" + "=".repeat(60));
  console.log("📋 CONCLUSION: What is BdtGEty8?");
  console.log("=".repeat(60));
}

investigate().catch(console.error);
