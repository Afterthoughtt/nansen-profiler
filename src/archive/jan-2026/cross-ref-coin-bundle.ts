/**
 * Cross-reference COIN recipients with known bundle wallets from previous launches
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import * as fs from "fs";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const DISTRIBUTOR = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";
const COIN_TOKEN = "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  CROSS-REFERENCE: COIN Recipients vs Previous Launch Buyers");
  console.log("=".repeat(70));

  // Load early buyers data
  const earlyBuyersData = JSON.parse(
    fs.readFileSync("data/analysis/early-buyers-all-tokens.json", "utf-8")
  );

  // Collect ALL known early buyers from all tokens
  const knownBundleWallets = new Map<string, string[]>();

  const tokens = ["ARKXRP", "DOGWIFXRP", "WFXRP", "XRPEP3", "TROLLXRP", "RXRP"];
  for (const token of tokens) {
    const buyers = earlyBuyersData[token] || [];
    for (const buyer of buyers) {
      if (!knownBundleWallets.has(buyer.wallet)) {
        knownBundleWallets.set(buyer.wallet, []);
      }
      knownBundleWallets.get(buyer.wallet)!.push(token);
    }
  }

  console.log(`\nLoaded ${knownBundleWallets.size} known early buyers from previous launches`);

  // Get today's COIN distributions
  const today = new Date();
  const txResult = await client.getTransactions({
    address: DISTRIBUTOR,
    chain: "solana",
    date: {
      from: today.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txResult.data || [];

  // Collect unique COIN recipients
  const coinRecipients = new Set<string>();
  for (const tx of transactions) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        const isCoin = sent.token_address === COIN_TOKEN || sent.token_symbol === "COIN";
        if (isCoin && sent.to_address) {
          coinRecipients.add(sent.to_address);
        }
      }
    }
  }

  console.log(`Found ${coinRecipients.size} COIN recipients today`);

  // Find overlap
  console.log("\n" + "=".repeat(70));
  console.log("  MATCHES: COIN Recipients who were Early Buyers");
  console.log("=".repeat(70));

  const matches: Array<{ wallet: string; tokens: string[] }> = [];

  for (const recipient of coinRecipients) {
    if (knownBundleWallets.has(recipient)) {
      matches.push({
        wallet: recipient,
        tokens: knownBundleWallets.get(recipient)!,
      });
    }
  }

  if (matches.length === 0) {
    console.log("\n  NO DIRECT MATCHES FOUND");
    console.log("  COIN recipients are NOT the same wallets as previous early buyers");
  } else {
    console.log(`\n  🚨 FOUND ${matches.length} MATCHES!\n`);
    for (const m of matches) {
      console.log(`  ${m.wallet.slice(0, 16)}...`);
      console.log(`    Early buyer of: ${m.tokens.join(", ")}`);
    }
  }

  // Also check the top known insiders
  console.log("\n" + "=".repeat(70));
  console.log("  CHECKING SPECIFIC HIGH-PRIORITY WALLETS");
  console.log("=".repeat(70));

  const highPriority = [
    { name: "37Xxihfs (Original Deployer)", address: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2" },
    { name: "v49j (Primary Funder)", address: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5" },
    { name: "BNmf81tG (3-launch sniper)", address: "BNmf81tG5ApZWxVqARFWCiF3ppA8c4gLF8ssgZPKjpz4" },
    { name: "FSbvLdrK (Connected insider)", address: "FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE" },
    { name: "H3qSndFC (3-token insider)", address: "H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot" },
    { name: "Hqf4 (Funded today)", address: "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT" },
    { name: "HYMt (Current target)", address: "HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG" },
    { name: "EbMRVzXVRH8y (9dcT4Cw funder)", address: "EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV" },
    { name: "6MGxPHsj (Top COIN recipient)", address: "6MGxPHsjMhojePFyA54cmjJVSbZBpAT4hxXCerYYD8RB" },
  ];

  for (const hp of highPriority) {
    const isCoinRecipient = coinRecipients.has(hp.address);
    const wasEarlyBuyer = knownBundleWallets.has(hp.address);

    let status = "";
    if (isCoinRecipient && wasEarlyBuyer) {
      status = "🚨 COIN RECIPIENT + PREVIOUS EARLY BUYER";
    } else if (isCoinRecipient) {
      status = "📦 COIN RECIPIENT (not previous buyer)";
    } else if (wasEarlyBuyer) {
      status = "📈 PREVIOUS EARLY BUYER (no COIN)";
    } else {
      status = "—";
    }

    console.log(`\n  ${hp.name}`);
    console.log(`    ${status}`);
    if (wasEarlyBuyer) {
      console.log(`    Early tokens: ${knownBundleWallets.get(hp.address)!.join(", ")}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  CONCLUSION");
  console.log("=".repeat(70));
  console.log(`
  COIN Distribution Analysis:
  - ${coinRecipients.size} wallets received COIN today from 9dcT4Cw
  - ${matches.length} of them were early buyers in previous launches

  ${matches.length > 0 ?
    `🚨 CONFIRMATION: The dev IS using COIN to reward/prepare bundle wallets!
    These ${matches.length} wallets will likely front-run the pump.fun launch.` :
    `The COIN recipients appear to be a DIFFERENT set of wallets than
    the previous launch bundle wallets.`}

  IMPLICATION FOR SNIPER:
  - HYMt remains primary deployer target
  - COIN recipients with SOL are potential competition
`);
}

main().catch(console.error);
