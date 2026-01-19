/**
 * Investigate v49j USDC transfers to E41i and HRcur
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const V49J = WALLETS.PRIMARY_FUNDER;
const E41I = "E41iCFHDphDFCcnPfjkeuhPwYxSaRP2WKMvSUr8hVzTf";
const HRCUR = "HRcur4Ggby1SVYCJyafw8sypaAnKXEG61Lv4foEgqnWb";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  v49j USDC OUTBOUND INVESTIGATION");
  console.log("  Looking for connections to E41i and HRcur");
  console.log("=".repeat(70));

  // Get v49j counterparties
  console.log("\n📍 v49j Counterparties...");
  const counterparties = await client.getCounterparties({
    address: V49J,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    group_by: "wallet",
    source_input: "Combined",
  });

  // Check for E41i
  const e41iMatch = counterparties.find(
    (cp) => cp.counterparty_address === E41I
  );
  const hrcurMatch = counterparties.find(
    (cp) => cp.counterparty_address === HRCUR
  );

  console.log("\n📍 E41i Connection:");
  if (e41iMatch) {
    console.log("  🚨 FOUND IN COUNTERPARTIES!");
    console.log(`  Interactions: ${e41iMatch.interaction_count}`);
    console.log(`  Volume USD: $${e41iMatch.volume_usd?.toFixed(2)}`);
  } else {
    console.log("  Not in counterparties list");
  }

  console.log("\n📍 HRcur Connection:");
  if (hrcurMatch) {
    console.log("  🚨 FOUND IN COUNTERPARTIES!");
    console.log(`  Interactions: ${hrcurMatch.interaction_count}`);
    console.log(`  Volume USD: $${hrcurMatch.volume_usd?.toFixed(2)}`);
  } else {
    console.log("  Not in counterparties list");
  }

  await new Promise((r) => setTimeout(r, 1500));

  // Get v49j transactions to find USDC transfers
  console.log("\n📍 v49j Transactions (looking for USDC sends)...");
  const txResult = await client.getTransactions({
    address: V49J,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txResult.data || [];
  console.log(`  Total transactions found: ${transactions.length}\n`);

  const usdcSends: Array<{
    date: string;
    amount: number;
    to: string;
    flag: string;
  }> = [];

  for (const tx of transactions) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        if (
          sent.token_symbol === "USDC" &&
          sent.token_amount &&
          Math.abs(sent.token_amount) > 1
        ) {
          const to = sent.to_address || "unknown";
          let flag = "";
          if (to === E41I) flag = " 🚨 E41i!";
          if (to === HRCUR) flag = " 🚨 HRcur!";

          usdcSends.push({
            date: tx.block_timestamp || "unknown",
            amount: Math.abs(sent.token_amount),
            to: to,
            flag: flag,
          });
        }
      }
    }
  }

  console.log("  USDC SENDS FROM v49j:");
  console.log("  " + "-".repeat(60));
  for (const send of usdcSends) {
    console.log(`  ${send.date}`);
    console.log(
      `    $${send.amount.toFixed(2)} USDC → ${send.to.slice(0, 16)}...${send.flag}`
    );
  }

  if (usdcSends.length === 0) {
    console.log("  No USDC sends found in transaction history");
  }

  // Also check E41i and HRcur incoming from v49j perspective
  console.log("\n📍 Checking E41i incoming transactions...");
  await new Promise((r) => setTimeout(r, 1500));

  const e41iTx = await client.getTransactions({
    address: E41I,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    pagination: { page: 1, per_page: 100 },
  });

  const e41iTransactions = e41iTx.data || [];
  let foundV49jInE41i = false;

  for (const tx of e41iTransactions) {
    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        if (recv.from_address === V49J) {
          foundV49jInE41i = true;
          console.log(`  🚨 v49j → E41i: ${tx.block_timestamp}`);
          console.log(
            `     ${recv.token_amount?.toFixed(4)} ${recv.token_symbol}`
          );
        }
      }
    }
  }

  if (!foundV49jInE41i) {
    console.log("  No v49j transfers found in E41i transaction history");
  }

  console.log("\n📍 Checking HRcur incoming transactions...");
  await new Promise((r) => setTimeout(r, 1500));

  const hrcurTx = await client.getTransactions({
    address: HRCUR,
    chain: "solana",
    date: DATES.FULL_HISTORY,
    pagination: { page: 1, per_page: 100 },
  });

  const hrcurTransactions = hrcurTx.data || [];
  let foundV49jInHrcur = false;

  for (const tx of hrcurTransactions) {
    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        if (recv.from_address === V49J) {
          foundV49jInHrcur = true;
          console.log(`  🚨 v49j → HRcur: ${tx.block_timestamp}`);
          console.log(
            `     ${recv.token_amount?.toFixed(4)} ${recv.token_symbol}`
          );
        }
      }
    }
  }

  if (!foundV49jInHrcur) {
    console.log("  No v49j transfers found in HRcur transaction history");
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`
  E41i (${E41I.slice(0, 12)}...):
    - Counterparty of v49j: ${e41iMatch ? "YES" : "NO"}
    - Direct transfer found: ${foundV49jInE41i ? "YES" : "NO"}

  HRcur (${HRCUR.slice(0, 12)}...):
    - Counterparty of v49j: ${hrcurMatch ? "YES" : "NO"}
    - Direct transfer found: ${foundV49jInHrcur ? "YES" : "NO"}
`);
}

main().catch(console.error);
