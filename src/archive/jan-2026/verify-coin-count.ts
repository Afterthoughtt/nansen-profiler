/**
 * Verify exact count of COIN/THE recipients
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const DISTRIBUTOR = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";
const COIN_TOKEN = "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs";
const THE_TOKEN = "7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  VERIFYING COIN/THE RECIPIENT COUNT");
  console.log("=".repeat(70));

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Check multiple pages to get full count
  const coinRecipients = new Set<string>();
  const theRecipients = new Set<string>();
  let totalTransfers = 0;

  console.log("\nFetching transactions (checking multiple pages)...\n");

  for (let page = 1; page <= 5; page++) {
    console.log(`Page ${page}...`);

    const txResult = await client.getTransactions({
      address: DISTRIBUTOR,
      chain: "solana",
      date: {
        from: weekAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      },
      pagination: { page, per_page: 100 },
    });

    const txs = txResult.data || [];
    if (txs.length === 0) {
      console.log(`  (empty - done)`);
      break;
    }

    console.log(`  ${txs.length} transactions`);

    for (const tx of txs) {
      if (tx.tokens_sent) {
        for (const sent of tx.tokens_sent) {
          if (!sent.to_address) continue;

          const isCoin = sent.token_address === COIN_TOKEN || sent.token_symbol === "COIN";
          const isThe = sent.token_address === THE_TOKEN || sent.token_symbol === "THE";

          if (isCoin) {
            coinRecipients.add(sent.to_address);
            totalTransfers++;
          }
          if (isThe) {
            theRecipients.add(sent.to_address);
            totalTransfers++;
          }
        }
      }
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  // Find wallets that received BOTH
  const bothTokens = new Set<string>();
  for (const addr of coinRecipients) {
    if (theRecipients.has(addr)) {
      bothTokens.add(addr);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  VERIFIED COUNTS (Last 7 days)");
  console.log("=".repeat(70));

  console.log(`
  Total transfers: ${totalTransfers}

  COIN recipients: ${coinRecipients.size} unique wallets
  THE recipients:  ${theRecipients.size} unique wallets
  Both tokens:     ${bothTokens.size} wallets

  Combined unique: ${new Set([...coinRecipients, ...theRecipients]).size} wallets
`);

  // Show sample
  console.log("Sample COIN recipients:");
  [...coinRecipients].slice(0, 5).forEach((w, i) => {
    console.log(`  ${i + 1}. ${w}`);
  });

  console.log("\nSample THE recipients:");
  [...theRecipients].slice(0, 5).forEach((w, i) => {
    console.log(`  ${i + 1}. ${w}`);
  });
}

main().catch(console.error);
