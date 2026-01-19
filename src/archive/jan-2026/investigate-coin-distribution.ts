/**
 * DEEP INVESTIGATION: Automated COIN distribution from 9dcT4Cw
 * What is this? Why is it happening now?
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const DISTRIBUTOR = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";
const COIN_TOKEN = "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs";
const THE_TOKEN = "7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  DEEP INVESTIGATION: 9dcT4Cw AUTOMATED DISTRIBUTION");
  console.log("=".repeat(70));

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Get 9dcT4Cw recent transactions
  console.log("\n📍 9dcT4Cw TRANSACTION PATTERN (Last 7 days)");

  const txResult = await client.getTransactions({
    address: DISTRIBUTOR,
    chain: "solana",
    date: {
      from: weekAgo.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    pagination: { page: 1, per_page: 100 },
  });

  const transactions = txResult.data || [];
  console.log(`  Total transactions: ${transactions.length}`);

  // Analyze the distribution pattern
  const coinTransfers: Array<{
    timestamp: string;
    to: string;
    amount: number;
  }> = [];

  const theTransfers: Array<{
    timestamp: string;
    to: string;
    amount: number;
  }> = [];

  const recipients = new Map<string, { coin: number; the: number; count: number }>();

  for (const tx of transactions) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        const isCoin = sent.token_address === COIN_TOKEN || sent.token_symbol === "COIN";
        const isThe = sent.token_address === THE_TOKEN || sent.token_symbol === "THE";

        if ((isCoin || isThe) && sent.to_address && sent.token_amount) {
          const to = sent.to_address;
          const amount = Math.abs(sent.token_amount);

          if (!recipients.has(to)) {
            recipients.set(to, { coin: 0, the: 0, count: 0 });
          }
          const r = recipients.get(to)!;
          r.count++;

          if (isCoin) {
            r.coin += amount;
            coinTransfers.push({
              timestamp: tx.block_timestamp || "",
              to,
              amount,
            });
          } else {
            r.the += amount;
            theTransfers.push({
              timestamp: tx.block_timestamp || "",
              to,
              amount,
            });
          }
        }
      }
    }
  }

  // 2. Show distribution statistics
  console.log("\n📍 DISTRIBUTION STATISTICS");
  console.log(`  COIN transfers: ${coinTransfers.length}`);
  console.log(`  THE transfers: ${theTransfers.length}`);
  console.log(`  Unique recipients: ${recipients.size}`);

  // 3. Analyze amounts - are they all the same?
  console.log("\n📍 AMOUNT ANALYSIS (COIN)");
  const coinAmounts = coinTransfers.map(t => t.amount);
  const uniqueCoinAmounts = [...new Set(coinAmounts.map(a => a.toFixed(6)))];
  console.log(`  Unique amounts: ${uniqueCoinAmounts.length}`);

  if (uniqueCoinAmounts.length <= 5) {
    console.log(`  Amounts: ${uniqueCoinAmounts.join(", ")}`);
  } else {
    console.log(`  Sample amounts: ${uniqueCoinAmounts.slice(0, 5).join(", ")}...`);
  }

  // 4. Analyze timing - how frequent?
  console.log("\n📍 TIMING ANALYSIS");
  const timestamps = coinTransfers.map(t => new Date(t.timestamp).getTime()).sort();

  if (timestamps.length > 1) {
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    console.log(`  Average interval between transfers: ${(avgInterval / 1000).toFixed(1)} seconds`);
    console.log(`  First transfer: ${new Date(timestamps[0]).toISOString()}`);
    console.log(`  Last transfer: ${new Date(timestamps[timestamps.length - 1]).toISOString()}`);
  }

  // 5. Show today's transfers specifically
  console.log("\n📍 TODAY'S TRANSFERS");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayTransfers = coinTransfers.filter(t =>
    new Date(t.timestamp) >= todayStart
  );

  console.log(`  COIN transfers today: ${todayTransfers.length}`);

  for (const t of todayTransfers.slice(0, 10)) {
    console.log(`    ${t.timestamp} → ${t.to.slice(0, 12)}... (${t.amount.toFixed(0)} COIN)`);
  }

  if (todayTransfers.length > 10) {
    console.log(`    ... and ${todayTransfers.length - 10} more`);
  }

  // 6. Show top recipients
  console.log("\n📍 TOP RECIPIENTS");
  const sortedRecipients = [...recipients.entries()]
    .sort((a, b) => (b[1].coin + b[1].the) - (a[1].coin + a[1].the))
    .slice(0, 10);

  for (const [wallet, data] of sortedRecipients) {
    console.log(`\n  ${wallet.slice(0, 20)}...`);
    if (data.coin > 0) console.log(`    COIN: ${data.coin.toFixed(0)}`);
    if (data.the > 0) console.log(`    THE: ${data.the.toFixed(0)}`);
    console.log(`    Transfers: ${data.count}`);
  }

  // 7. Check 9dcT4Cw balance - how much left?
  console.log("\n📍 9dcT4Cw REMAINING BALANCE");
  await new Promise((r) => setTimeout(r, 1500));

  const balance = await client.getCurrentBalance({
    address: DISTRIBUTOR,
    chain: "solana",
  });

  for (const b of balance) {
    if (b.token_amount && b.token_amount > 0) {
      const isCoin = b.token_address === COIN_TOKEN;
      const isThe = b.token_address === THE_TOKEN;
      const flag = (isCoin || isThe) ? " ← DISTRIBUTION TOKEN" : "";
      console.log(`  ${b.token_symbol || b.token_address?.slice(0, 12)}: ${b.token_amount.toLocaleString()}${flag}`);
    }
  }

  // 8. Check if there's a program/contract doing this
  console.log("\n📍 CHECKING FOR AUTOMATION SOURCE");
  await new Promise((r) => setTimeout(r, 1500));

  const related = await client.getRelatedWallets({
    address: DISTRIBUTOR,
    chain: "solana",
    pagination: { page: 1, per_page: 20 },
  });

  for (const rw of related) {
    if (rw.relation.includes("Program") || rw.relation.includes("Contract")) {
      console.log(`  ${rw.relation}: ${rw.address}`);
    }
  }

  // VERDICT
  console.log("\n" + "=".repeat(70));
  console.log("  ANALYSIS");
  console.log("=".repeat(70));
  console.log(`
  PATTERN: Automated batch distribution
  - Same amounts sent to multiple wallets
  - Happening continuously (every few seconds/minutes)
  - ${recipients.size} unique recipients so far
  - ${todayTransfers.length} transfers TODAY alone

  POSSIBLE EXPLANATIONS:

  1. AIRDROP SCRIPT - Pre-distributing tokens to wallets that will
     participate in the pump.fun launch (bundle wallets get rewarded)

  2. VESTING/UNLOCK - Scheduled token distribution to team/investors

  3. LIQUIDITY PREPARATION - Seeding wallets before DEX listing

  4. BACKUP LAUNCH - If pump.fun fails, these wallets are ready for
     custom SPL launch

  5. DIFFERENT PROJECT - COIN/THE might be completely separate from
     Quantum X pump.fun launch

  KEY QUESTION: If pump.fun creates a NEW token mint, what's the
  point of distributing pre-minted COIN/THE tokens NOW?
`);
}

main().catch(console.error);
