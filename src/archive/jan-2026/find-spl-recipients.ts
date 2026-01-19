/**
 * Find all recipients of THE/COIN tokens from 9dcT4Cw
 * These are the bundle wallets for the next launch
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const SENDER = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";

// THE and COIN token addresses
const THE_TOKEN = "7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho";
const COIN_TOKEN = "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  FINDING ALL THE/COIN TOKEN RECIPIENTS FROM 9dcT4Cw");
  console.log("  (These are the potential bundle wallets)");
  console.log("=".repeat(70));

  // Get 9dcT4Cw transactions
  console.log("\n📍 9dcT4Cw Recent Transactions...");

  const txResult = await client.getTransactions({
    address: SENDER,
    chain: "solana",
    date: DATES.RECENT_30D,
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txResult.data || [];
  console.log(`  Found ${transactions.length} transactions\n`);

  const recipients: Map<
    string,
    { count: number; tokens: Set<string>; amounts: number[] }
  > = new Map();

  for (const tx of transactions) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        const tokenAddr = sent.token_address || "";
        const isTheCoin =
          tokenAddr === THE_TOKEN ||
          tokenAddr === COIN_TOKEN ||
          sent.token_symbol === "THE" ||
          sent.token_symbol === "COIN";

        if (isTheCoin && sent.to_address) {
          const to = sent.to_address;
          if (!recipients.has(to)) {
            recipients.set(to, { count: 0, tokens: new Set(), amounts: [] });
          }
          const r = recipients.get(to)!;
          r.count++;
          r.tokens.add(sent.token_symbol || tokenAddr.slice(0, 8));
          if (sent.token_amount) {
            r.amounts.push(sent.token_amount);
          }
        }
      }
    }
  }

  console.log(`📍 THE/COIN RECIPIENTS (${recipients.size} wallets):`);
  console.log("  " + "-".repeat(60));

  const sorted = [...recipients.entries()].sort(
    (a, b) => b[1].count - a[1].count
  );

  for (const [wallet, data] of sorted) {
    const totalAmount = data.amounts.reduce((a, b) => a + Math.abs(b), 0);
    console.log(`\n  ${wallet}`);
    console.log(`    Transfers: ${data.count}`);
    console.log(`    Tokens: ${[...data.tokens].join(", ")}`);
    console.log(`    Total amount: ${totalAmount.toFixed(2)}`);
  }

  // List just the addresses for easy reference
  console.log("\n" + "=".repeat(70));
  console.log("  BUNDLE WALLET ADDRESSES (Copy-paste list)");
  console.log("=".repeat(70));
  console.log();

  for (const [wallet] of sorted) {
    console.log(wallet);
  }

  console.log(`\n  Total: ${recipients.size} bundle wallets`);
}

main().catch(console.error);
