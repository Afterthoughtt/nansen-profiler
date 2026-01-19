/**
 * CRITICAL: Verify SPL transfers from 9dcT4Cw to Bz2yexdH (RXRP deployer)
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const QUANTUM_WALLET = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";
const RXRP_DEPLOYER = WALLETS.DEPLOYER_BZ2Y; // Bz2yexdH

// Tokens to look for
const TOKENS = [
  { name: "QuantumCore", address: "7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho" },
  { name: "Unknown SPL", address: "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs" },
];

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  🚨🚨🚨 CRITICAL: VERIFYING SPL TRANSFERS TO RXRP DEPLOYER");
  console.log("=".repeat(70));

  console.log(`\n  From: 9dcT4Cw (${QUANTUM_WALLET.slice(0, 12)}...)`);
  console.log(`  To:   Bz2yexdH (${RXRP_DEPLOYER.slice(0, 12)}...) - RXRP DEPLOYER`);
  console.log(`\n  Looking for tokens:`);
  for (const t of TOKENS) {
    console.log(`    - ${t.name}: ${t.address.slice(0, 12)}...`);
  }

  // Check Bz2yexdH transactions for inbound from 9dcT4Cw
  console.log("\n" + "=".repeat(70));
  console.log("  📍 Bz2yexdH (RXRP Deployer) RECENT TRANSACTIONS");
  console.log("=".repeat(70));

  const txResult = await client.getTransactions({
    address: RXRP_DEPLOYER,
    chain: "solana",
    date: DATES.RECENT_30D,
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txResult.data || [];
  console.log(`\n  Found ${transactions.length} transactions\n`);

  let quantumTransfers: any[] = [];

  for (const tx of transactions) {
    // Check for tokens received from 9dcT4Cw
    if (tx.tokens_received) {
      for (const recv of tx.tokens_received) {
        const from = recv.from_address || "";
        const isFromQuantum = from === QUANTUM_WALLET || from.startsWith("9dcT4Cw");
        const isQuantumToken = TOKENS.some(
          (t) =>
            t.address === recv.token_address ||
            recv.token_symbol?.includes("Quantum")
        );

        if (isFromQuantum || isQuantumToken) {
          quantumTransfers.push({
            timestamp: tx.block_timestamp,
            token: recv.token_symbol || recv.token_address?.slice(0, 12) || "?",
            amount: recv.token_amount,
            from: from.slice(0, 12),
            tokenAddress: recv.token_address,
          });

          console.log(`  🚨 ${tx.block_timestamp}`);
          console.log(`     Token: ${recv.token_symbol || recv.token_address?.slice(0, 20) || "?"}`);
          console.log(`     Amount: ${recv.token_amount}`);
          console.log(`     From: ${from.slice(0, 16)}...`);
          console.log();
        }
      }
    }
  }

  // Also check 9dcT4Cw outbound to Bz2yexdH
  console.log("\n" + "=".repeat(70));
  console.log("  📍 9dcT4Cw TRANSACTIONS TO Bz2yexdH");
  console.log("=".repeat(70));

  await new Promise((r) => setTimeout(r, 2000));

  const txResult2 = await client.getTransactions({
    address: QUANTUM_WALLET,
    chain: "solana",
    date: DATES.RECENT_30D,
    pagination: { page: 1, per_page: 100 },
  });

  const transactions2 = txResult2.data || [];
  console.log(`\n  Found ${transactions2.length} transactions\n`);

  for (const tx of transactions2) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        const to = sent.to_address || "";
        if (to === RXRP_DEPLOYER || to.startsWith("Bz2yexdH")) {
          console.log(`  🚨 ${tx.block_timestamp}`);
          console.log(`     SENT TO Bz2yexdH:`);
          console.log(`     Token: ${sent.token_symbol || sent.token_address?.slice(0, 20) || "?"}`);
          console.log(`     Amount: ${sent.token_amount}`);
          console.log(`     Token Address: ${sent.token_address}`);
          console.log();

          quantumTransfers.push({
            timestamp: tx.block_timestamp,
            token: sent.token_symbol || sent.token_address?.slice(0, 12) || "?",
            amount: sent.token_amount,
            direction: "9dcT4Cw → Bz2yexdH",
            tokenAddress: sent.token_address,
          });
        }
      }
    }
  }

  // Check Bz2yexdH current balance for these tokens
  console.log("\n" + "=".repeat(70));
  console.log("  📍 Bz2yexdH CURRENT TOKEN HOLDINGS");
  console.log("=".repeat(70));

  await new Promise((r) => setTimeout(r, 2000));

  const balance = await client.getCurrentBalance({
    address: RXRP_DEPLOYER,
    chain: "solana",
  });

  console.log(`\n  Tokens held by Bz2yexdH:\n`);
  for (const b of balance) {
    if (b.token_amount && b.token_amount > 0) {
      const isQuantum = TOKENS.some((t) => t.address === b.token_address);
      const flag = isQuantum ? " 🚨 QUANTUM TOKEN" : "";
      console.log(`    ${b.token_symbol || b.token_address?.slice(0, 12)}: ${b.token_amount}${flag}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));

  if (quantumTransfers.length > 0) {
    console.log(`
  🚨🚨🚨 CONFIRMED: SPL TRANSFERS TO RXRP DEPLOYER

  This connects:
  - QuantumCore deployer (EbMRVzXVRH8y)
  - 9dcT4Cw (intermediary)
  - Bz2yexdH (RXRP deployer - OUR CONFIRMED TARGET)

  IMPLICATION:
  The QuantumCore entity IS connected to our XRP deployer chain!
  This could be pre-distribution of the next token.
`);
  } else {
    console.log(`
  No SPL transfers found in recent transactions.
  The transfers may be older than 30 days or in a different format.
`);
  }
}

main().catch(console.error);
