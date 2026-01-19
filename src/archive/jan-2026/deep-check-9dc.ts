/**
 * Deep check 9dcT4Cw - dump all transactions and counterparties
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const QUANTUM_WALLET = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";
const RXRP_DEPLOYER = WALLETS.DEPLOYER_BZ2Y;

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  DEEP CHECK: 9dcT4Cw → Bz2yexdH CONNECTION");
  console.log("=".repeat(70));

  // 1. Check counterparties for Bz2yexdH
  console.log("\n📍 9dcT4Cw COUNTERPARTIES (looking for Bz2yexdH)");
  console.log("-".repeat(50));

  const counterparties = await client.getCounterparties({
    address: QUANTUM_WALLET,
    chain: "solana",
    date: DATES.RECENT_90D,
    group_by: "wallet",
    source_input: "Combined",
  });

  console.log(`Found ${counterparties.length} counterparties\n`);

  let foundBz2y = false;
  for (const cp of counterparties) {
    const isBz2y =
      cp.counterparty_address === RXRP_DEPLOYER ||
      cp.counterparty_address.startsWith("Bz2yexdH");

    if (isBz2y) {
      foundBz2y = true;
      console.log(`🚨🚨🚨 FOUND Bz2yexdH!`);
      console.log(`   Address: ${cp.counterparty_address}`);
      console.log(`   Interactions: ${cp.interaction_count}`);
      console.log(`   Volume: $${cp.volume_usd?.toFixed(2) || "?"}`);
      console.log(`   Labels: ${cp.labels?.join(", ") || "None"}`);
    }
  }

  if (!foundBz2y) {
    console.log("Bz2yexdH not found in direct counterparties");
    console.log("\nTop 10 counterparties:");
    for (const cp of counterparties.slice(0, 10)) {
      console.log(`  ${cp.counterparty_address.slice(0, 16)}... (${cp.interaction_count} interactions)`);
    }
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 2. Dump ALL transactions and look for any SPL token sends
  console.log("\n📍 ALL TOKEN SENDS FROM 9dcT4Cw");
  console.log("-".repeat(50));

  const txResult = await client.getTransactions({
    address: QUANTUM_WALLET,
    chain: "solana",
    date: DATES.RECENT_90D,
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txResult.data || [];
  console.log(`Found ${transactions.length} transactions\n`);

  // Group by recipient
  const sendsByRecipient = new Map<string, any[]>();

  for (const tx of transactions) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        const to = sent.to_address || "unknown";
        if (!sendsByRecipient.has(to)) {
          sendsByRecipient.set(to, []);
        }
        sendsByRecipient.get(to)!.push({
          timestamp: tx.block_timestamp,
          token: sent.token_symbol || sent.token_address?.slice(0, 16) || "?",
          amount: sent.token_amount,
          tokenAddress: sent.token_address,
        });
      }
    }
  }

  console.log(`Sent tokens to ${sendsByRecipient.size} unique addresses:\n`);

  for (const [recipient, sends] of sendsByRecipient) {
    const isBz2y = recipient === RXRP_DEPLOYER || recipient.startsWith("Bz2yexdH");
    const flag = isBz2y ? " 🚨🚨🚨 RXRP DEPLOYER" : "";

    console.log(`To: ${recipient.slice(0, 20)}...${flag}`);
    for (const s of sends.slice(0, 5)) {
      console.log(`   ${s.timestamp}: ${s.amount} ${s.token}`);
    }
    if (sends.length > 5) {
      console.log(`   ... and ${sends.length - 5} more`);
    }
    console.log();
  }

  // 3. Check Bz2yexdH counterparties for 9dcT4Cw
  console.log("\n📍 Bz2yexdH COUNTERPARTIES (looking for 9dcT4Cw)");
  console.log("-".repeat(50));

  await new Promise((r) => setTimeout(r, 2000));

  const bz2yCounterparties = await client.getCounterparties({
    address: RXRP_DEPLOYER,
    chain: "solana",
    date: DATES.RECENT_90D,
    group_by: "wallet",
    source_input: "Combined",
  });

  console.log(`Found ${bz2yCounterparties.length} counterparties\n`);

  let found9dc = false;
  for (const cp of bz2yCounterparties) {
    const is9dc =
      cp.counterparty_address === QUANTUM_WALLET ||
      cp.counterparty_address.startsWith("9dcT4Cw");

    if (is9dc) {
      found9dc = true;
      console.log(`🚨🚨🚨 FOUND 9dcT4Cw!`);
      console.log(`   Address: ${cp.counterparty_address}`);
      console.log(`   Interactions: ${cp.interaction_count}`);
      console.log(`   Volume: $${cp.volume_usd?.toFixed(2) || "?"}`);
    }
  }

  if (!found9dc) {
    console.log("9dcT4Cw not found in Bz2yexdH counterparties");
    console.log("\nTop 10 Bz2yexdH counterparties:");
    for (const cp of bz2yCounterparties.slice(0, 10)) {
      const labels = cp.labels?.join(", ") || "";
      console.log(`  ${cp.counterparty_address.slice(0, 20)}... (${cp.interaction_count}) ${labels}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  CONNECTION STATUS");
  console.log("=".repeat(70));
  console.log(`  9dcT4Cw → Bz2yexdH in counterparties: ${foundBz2y ? "YES" : "NO"}`);
  console.log(`  Bz2yexdH → 9dcT4Cw in counterparties: ${found9dc ? "YES" : "NO"}`);
}

main().catch(console.error);
