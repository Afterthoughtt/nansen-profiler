/**
 * Deep analysis of COIN distribution recipients
 * Do they have SOL? Are they the same as THE recipients?
 * Are they preparing to trade on pump.fun?
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const DISTRIBUTOR = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";
const COIN_TOKEN = "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs";
const THE_TOKEN = "7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  COIN RECIPIENTS DEEP ANALYSIS");
  console.log("=".repeat(70));

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get today's distributions
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
  console.log(`\nTransactions today: ${transactions.length}`);

  // Collect unique recipients
  const recipients = new Map<string, { coin: number; transfers: number }>();

  for (const tx of transactions) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        const isCoin = sent.token_address === COIN_TOKEN || sent.token_symbol === "COIN";
        if (isCoin && sent.to_address && sent.token_amount) {
          const to = sent.to_address;
          if (!recipients.has(to)) {
            recipients.set(to, { coin: 0, transfers: 0 });
          }
          const r = recipients.get(to)!;
          r.coin += Math.abs(sent.token_amount);
          r.transfers++;
        }
      }
    }
  }

  console.log(`\nUnique COIN recipients today: ${recipients.size}`);

  // Check top 10 recipients for:
  // 1. SOL balance (can they transact?)
  // 2. Interaction count (fresh or established?)
  // 3. Do they also have THE tokens?
  console.log("\n" + "=".repeat(70));
  console.log("  CHECKING TOP RECIPIENTS");
  console.log("=".repeat(70));

  const topRecipients = [...recipients.entries()]
    .sort((a, b) => b[1].coin - a[1].coin)
    .slice(0, 10);

  const readyToTrade: string[] = [];
  const freshWallets: string[] = [];

  for (const [wallet, data] of topRecipients) {
    console.log(`\n📍 ${wallet.slice(0, 16)}...`);
    console.log(`   COIN received: ${data.coin.toLocaleString()}`);
    console.log(`   Transfers: ${data.transfers}`);

    await new Promise((r) => setTimeout(r, 1500));

    // Check balance
    const balance = await client.getCurrentBalance({
      address: wallet,
      chain: "solana",
    });

    const sol = balance.find((b) => b.token_symbol === "SOL");
    const the = balance.find((b) => b.token_address === THE_TOKEN || b.token_symbol === "THE");
    const coin = balance.find((b) => b.token_address === COIN_TOKEN || b.token_symbol === "COIN");

    console.log(`   SOL: ${sol?.token_amount?.toFixed(4) || "0"}`);
    if (the?.token_amount) console.log(`   THE: ${the.token_amount.toLocaleString()}`);
    if (coin?.token_amount) console.log(`   COIN: ${coin.token_amount.toLocaleString()}`);

    if ((sol?.token_amount || 0) > 0.01) {
      readyToTrade.push(wallet);
      console.log(`   ✓ HAS SOL - READY TO TRADE`);
    } else {
      console.log(`   ✗ NO SOL - Cannot transact`);
    }

    await new Promise((r) => setTimeout(r, 1500));

    // Check interaction count
    const counterparties = await client.getCounterparties({
      address: wallet,
      chain: "solana",
      date: {
        from: weekAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      },
      group_by: "wallet",
      source_input: "Combined",
    });

    const interactions = counterparties.reduce((sum, cp) => sum + cp.interaction_count, 0);
    console.log(`   Interactions (7d): ${interactions}`);

    if (interactions < 20) {
      freshWallets.push(wallet);
      console.log(`   ⚠️ FRESH WALLET`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  ANALYSIS SUMMARY");
  console.log("=".repeat(70));

  console.log(`\n📊 Of top 10 COIN recipients:`);
  console.log(`   Ready to trade (have SOL): ${readyToTrade.length}`);
  console.log(`   Fresh wallets (<20 interactions): ${freshWallets.length}`);

  if (readyToTrade.length > 0) {
    console.log(`\n🚨 WALLETS WITH SOL (can participate in pump.fun):`);
    for (const w of readyToTrade) {
      console.log(`   ${w}`);
    }
  }

  // Check the distributor itself
  console.log("\n" + "=".repeat(70));
  console.log("  9dcT4Cw DISTRIBUTOR STATUS");
  console.log("=".repeat(70));

  await new Promise((r) => setTimeout(r, 1500));

  const distBalance = await client.getCurrentBalance({
    address: DISTRIBUTOR,
    chain: "solana",
  });

  console.log("\nCurrent holdings:");
  for (const b of distBalance) {
    if (b.token_amount && b.token_amount > 0) {
      console.log(`  ${b.token_symbol || b.token_address?.slice(0, 12)}: ${b.token_amount.toLocaleString()}`);
    }
  }

  // Check connection to dev chain
  console.log("\n" + "=".repeat(70));
  console.log("  CONNECTION TO DEV CHAIN?");
  console.log("=".repeat(70));

  await new Promise((r) => setTimeout(r, 1500));

  const related = await client.getRelatedWallets({
    address: DISTRIBUTOR,
    chain: "solana",
    pagination: { page: 1, per_page: 20 },
  });

  console.log("\n9dcT4Cw related wallets:");
  for (const rw of related) {
    console.log(`  ${rw.relation}: ${rw.address.slice(0, 16)}...`);
    if (rw.labels?.length) {
      console.log(`    Labels: ${rw.labels.join(", ")}`);
    }
  }

  // VERDICT
  console.log("\n" + "=".repeat(70));
  console.log("  VERDICT");
  console.log("=".repeat(70));

  console.log(`
  AUTOMATED DISTRIBUTION PATTERN:
  - 9dcT4Cw is distributing COIN tokens to ${recipients.size}+ wallets
  - ${readyToTrade.length}/${topRecipients.length} top recipients have SOL (can trade)
  - ${freshWallets.length}/${topRecipients.length} are fresh wallets

  POSSIBLE EXPLANATIONS:

  1. SEPARATE PROJECT: COIN/THE tokens may be for a DIFFERENT project
     entirely, not related to Quantum X pump.fun launch

  2. REWARD DISTRIBUTION: Rewarding previous token holders from
     earlier launches (TROLLXRP, XRPEP3, etc.)

  3. BACKUP MECHANISM: If pump.fun fails, these wallets could be
     used for a custom SPL launch instead

  4. DECOY/DISTRACTION: Automated noise to confuse trackers while
     real deployer prepares elsewhere

  KEY INSIGHT: If launch is confirmed pump.fun, these COIN/THE
  distributions are likely UNRELATED to the Quantum X launch.
  Pump.fun creates a NEW token mint - these pre-minted tokens
  cannot be used.

  RECOMMENDATION: Continue focusing on HYMt for pump.fun deployment.
  COIN/THE distribution is a separate operation.
`);
}

main().catch(console.error);
