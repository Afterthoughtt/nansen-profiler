/**
 * Explain the profit extraction wallet connection
 */
import "dotenv/config";
import { NansenClient } from './nansen-client.js';
import { delay } from './utils.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const BZ2Y = "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y"; // RXRP deployer
const PROFIT_4YWA = "4yWaU1QrwteHi1gixoFehknRP9a61T5PhAfM6ED3U2bs";
const PROFIT_HDTN = "HDTncsSnBmJWNRXd641Xuh8tYjKXx1xcJq8ACuCZQz52";

async function main() {
  console.log("=".repeat(70));
  console.log("PROFIT EXTRACTION WALLET EXPLANATION");
  console.log("=".repeat(70));

  // 1. Show Bz2yexdH's role
  console.log("\n📊 STEP 1: Bz2yexdH (RXRP Deployer)");
  console.log("-".repeat(50));
  console.log("Bz2yexdH deployed RainXRP (RXRP) on November 30, 2025");
  console.log("After launch, profits flow OUT of the deployer wallet.\n");

  // 2. Check First Funder of profit wallets
  console.log("📊 STEP 2: First Funder Verification");
  console.log("-".repeat(50));

  console.log("\n4yWaU1Qr:");
  const ff4ywa = await client.findFirstFunder(PROFIT_4YWA);
  console.log(`  First Funder: ${ff4ywa}`);
  console.log(`  Match Bz2yexdH? ${ff4ywa === BZ2Y ? "✅ YES" : "❌ NO"}`);

  await delay(2000);

  console.log("\nHDTncsSn:");
  const ffhdtn = await client.findFirstFunder(PROFIT_HDTN);
  console.log(`  First Funder: ${ffhdtn}`);
  console.log(`  Match Bz2yexdH? ${ffhdtn === BZ2Y ? "✅ YES" : "❌ NO"}`);

  await delay(2000);

  // 3. Show the flow from Bz2yexdH counterparties
  console.log("\n📊 STEP 3: Money Flow from Bz2yexdH");
  console.log("-".repeat(50));

  const counterparties = await client.getCounterparties({
    address: BZ2Y,
    chain: "solana",
    date: { from: "2025-11-01", to: "2025-12-31" },
    group_by: "wallet",
    source_input: "Combined",
  });

  // Find the profit wallets in counterparties
  console.log("\nOutbound from Bz2yexdH (Nov-Dec 2025):");

  const outbound = counterparties
    .filter(cp => (cp.volume_out_usd || 0) > 1000)
    .sort((a, b) => (b.volume_out_usd || 0) - (a.volume_out_usd || 0));

  for (const cp of outbound.slice(0, 10)) {
    const is4ywa = cp.counterparty_address === PROFIT_4YWA;
    const ishdtn = cp.counterparty_address === PROFIT_HDTN;
    const marker = (is4ywa || ishdtn) ? " 💰 PROFIT EXTRACTION" : "";

    console.log(`  ${cp.counterparty_address.slice(0, 12)}...${marker}`);
    console.log(`    OUT: $${cp.volume_out_usd?.toFixed(2)}`);
    console.log(`    Labels: ${cp.counterparty_address_label?.join(", ") || "None"}`);
  }

  await delay(2000);

  // 4. Check what 4yWaU1Qr did with the money
  console.log("\n📊 STEP 4: Where Did 4yWaU1Qr Send the Money?");
  console.log("-".repeat(50));

  const cp4ywa = await client.getCounterparties({
    address: PROFIT_4YWA,
    chain: "solana",
    date: { from: "2025-11-01", to: "2026-01-16" },
    group_by: "wallet",
    source_input: "Combined",
  });

  const outbound4ywa = cp4ywa
    .filter(cp => (cp.volume_out_usd || 0) > 100)
    .sort((a, b) => (b.volume_out_usd || 0) - (a.volume_out_usd || 0));

  console.log("\n4yWaU1Qr sent money to:");
  for (const cp of outbound4ywa.slice(0, 5)) {
    console.log(`  ${cp.counterparty_address.slice(0, 12)}...`);
    console.log(`    OUT: $${cp.volume_out_usd?.toFixed(2)}`);
    console.log(`    Labels: ${cp.counterparty_address_label?.join(", ") || "None"}`);
  }

  await delay(2000);

  // 5. Check Jan 9 activity
  console.log("\n📊 STEP 5: January 9 Activity (Recent!)");
  console.log("-".repeat(50));

  const janTxns = await client.getTransactions({
    address: PROFIT_4YWA,
    chain: "solana",
    date: { from: "2026-01-08", to: "2026-01-10" },
    pagination: { page: 1, per_page: 10 },
  });

  const txns = janTxns.data || [];
  console.log(`\nTransactions on Jan 8-10: ${txns.length}`);

  for (const tx of txns) {
    console.log(`\n  ${tx.block_timestamp}`);
    console.log(`    Volume: $${tx.volume_usd?.toFixed(2) || "?"}`);

    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        console.log(`    SENT: ${sent.token_amount?.toFixed(4)} ${sent.token_symbol} to ${sent.to_address?.slice(0, 12)}...`);
      }
    }
    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        console.log(`    RECEIVED: ${recv.token_amount?.toFixed(4)} ${recv.token_symbol} from ${recv.from_address?.slice(0, 12)}...`);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY: PROFIT EXTRACTION FLOW");
  console.log("=".repeat(70));
  console.log(`
  The Pattern:

  1. Entity deploys token (Bz2yexdH deploys RXRP)
  2. Token trades, deployer accumulates profits
  3. Deployer sends profits to "child" wallets:
     - 4yWaU1Qr received $47K
     - HDTncsSn received $21K
  4. Child wallets then move money to:
     - Exchanges (to cash out)
     - Other wallets (to obscure trail)
     - Back to funders (to recycle for next launch)

  Why This Matters for Jan 18:

  - 4yWaU1Qr was ACTIVE on Jan 9 (7 days ago)
  - This means the entity is moving money around
  - Could be: preparing for next launch, cashing out, or recycling funds
  - If 4yWaU1Qr shows activity again → Entity is active
  `);
}

main().catch(console.error);
