/**
 * Profile COIN recipients - do they look like bundle wallets?
 * Fresh wallets + SOL ready = likely bundle for pump.fun
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const DISTRIBUTOR = "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66";
const COIN_TOKEN = "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  COIN RECIPIENTS: BUNDLE WALLET PROFILE ANALYSIS");
  console.log("=".repeat(70));

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get COIN recipients
  const txResult = await client.getTransactions({
    address: DISTRIBUTOR,
    chain: "solana",
    date: {
      from: today.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    },
    pagination: { page: 1, per_page: 100 },
  });

  const recipients = new Set<string>();
  for (const tx of txResult.data || []) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        if ((sent.token_address === COIN_TOKEN || sent.token_symbol === "COIN") && sent.to_address) {
          recipients.add(sent.to_address);
        }
      }
    }
  }

  console.log(`\nAnalyzing ${recipients.size} COIN recipients...`);
  console.log("Sampling 20 random wallets for profile analysis\n");

  // Sample 20 random recipients
  const recipientArray = [...recipients];
  const sample = recipientArray
    .sort(() => Math.random() - 0.5)
    .slice(0, 20);

  let freshCount = 0;      // <50 interactions
  let hasSolCount = 0;     // >0.05 SOL
  let bundleProfileCount = 0; // Fresh + has SOL

  const profiles: Array<{
    wallet: string;
    interactions: number;
    sol: number;
    isBundleProfile: boolean;
  }> = [];

  for (let i = 0; i < sample.length; i++) {
    const wallet = sample[i];
    console.log(`Checking ${i + 1}/20: ${wallet.slice(0, 12)}...`);

    // Get balance
    const balance = await client.getCurrentBalance({
      address: wallet,
      chain: "solana",
    });
    const sol = balance.find((b) => b.token_symbol === "SOL")?.token_amount || 0;

    await new Promise((r) => setTimeout(r, 1000));

    // Get interaction count
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

    const isFresh = interactions < 50;
    const hasSol = sol > 0.05;
    const isBundleProfile = isFresh && hasSol;

    if (isFresh) freshCount++;
    if (hasSol) hasSolCount++;
    if (isBundleProfile) bundleProfileCount++;

    profiles.push({ wallet, interactions, sol, isBundleProfile });

    await new Promise((r) => setTimeout(r, 1000));
  }

  // Results
  console.log("\n" + "=".repeat(70));
  console.log("  SAMPLE RESULTS (20 wallets)");
  console.log("=".repeat(70));

  console.log("\nWallet                    | Interactions | SOL      | Bundle Profile?");
  console.log("-".repeat(70));

  for (const p of profiles.sort((a, b) => a.interactions - b.interactions)) {
    const flag = p.isBundleProfile ? "🚨 YES" : "—";
    console.log(
      `${p.wallet.slice(0, 24)}... | ${String(p.interactions).padStart(12)} | ${p.sol.toFixed(4).padStart(8)} | ${flag}`
    );
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  BUNDLE PROFILE SUMMARY");
  console.log("=".repeat(70));

  const freshPct = ((freshCount / 20) * 100).toFixed(0);
  const solPct = ((hasSolCount / 20) * 100).toFixed(0);
  const bundlePct = ((bundleProfileCount / 20) * 100).toFixed(0);

  console.log(`
  Sample Size: 20 of ${recipients.size} COIN recipients

  Fresh wallets (<50 interactions): ${freshCount}/20 (${freshPct}%)
  Has SOL (>0.05):                  ${hasSolCount}/20 (${solPct}%)
  BUNDLE PROFILE (fresh + SOL):     ${bundleProfileCount}/20 (${bundlePct}%)

  EXTRAPOLATED TO FULL SET:
  ~${Math.round(recipients.size * (bundleProfileCount / 20))} wallets likely have bundle profile

  ${bundleProfileCount >= 10 ?
    `🚨🚨🚨 HIGH ALERT: ${bundlePct}% of COIN recipients look like bundle wallets!
    These are likely the dev's bundle wallets for TODAY'S pump.fun launch.
    Expect ~${Math.round(recipients.size * (bundleProfileCount / 20))} wallets to front-run at launch.` :
    bundleProfileCount >= 5 ?
    `⚠️ MODERATE CONCERN: ${bundlePct}% match bundle profile.
    Some of these may be used for bundling.` :
    `LOW CONCERN: Only ${bundlePct}% match bundle profile.
    Most COIN recipients don't look like bundle wallets.`}
`);
}

main().catch(console.error);
