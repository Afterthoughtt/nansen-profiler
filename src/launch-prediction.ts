/**
 * Launch Prediction Analysis
 *
 * Comprehensive pre-launch investigation:
 * 1. Funding sources analysis
 * 2. Outbound transfers check
 * 3. Historical launch timing
 * 4. Launch window prediction
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Key addresses
const DEPLOYER_37X = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

// Token addresses for timing analysis (expand date range to capture first trade)
const TOKENS = [
  { name: "XRPEP3", address: "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump", launchDate: "2025-09-28", endDate: "2025-09-30" },
  { name: "TrollXRP", address: "CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump", launchDate: "2025-11-02", endDate: "2025-11-04" },
];

// Funding sources from today
const FUNDING_SOURCES = [
  { time: "05:49", amount: 2.994, from: "A77HErqtfN1hLLpv" },
  { time: "09:15", amount: 2.0, from: "FSbvLdrK1FuWJSNV" },
  { time: "09:44", amount: 0.85, from: "HVRcXaCFyUFG7iZL" },
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shortAddr(addr: string): string {
  return addr.slice(0, 12) + "...";
}

// ============================================
// 1. FUNDING SOURCES ANALYSIS
// ============================================
async function analyzeFundingSources(): Promise<void> {
  console.log("\n" + "═".repeat(60));
  console.log("1. FUNDING SOURCES ANALYSIS");
  console.log("═".repeat(60));

  for (const source of FUNDING_SOURCES) {
    console.log(`\n📍 Investigating ${shortAddr(source.from)} (${source.amount} SOL at ${source.time} UTC)`);

    // Get full address from transactions
    const txResult = await client.getTransactions({
      address: DEPLOYER_37X,
      chain: "solana",
      date: { from: "2025-11-30", to: "2025-12-01" },
      pagination: { page: 1, per_page: 50 },
    });

    let fullAddress = "";
    for (const tx of txResult.data || []) {
      if (tx.tokens_received) {
        for (const recv of tx.tokens_received) {
          if (recv.from_address?.startsWith(source.from.slice(0, 10))) {
            fullAddress = recv.from_address;
            break;
          }
        }
      }
      if (fullAddress) break;
    }

    if (fullAddress) {
      console.log(`   Full address: ${fullAddress}`);

      // Get first funder of this source
      await delay(1500);
      const firstFunder = await client.findFirstFunder(fullAddress);
      console.log(`   First Funder: ${firstFunder ? shortAddr(firstFunder) : "Unknown"}`);

      // Check if it's a known address
      if (firstFunder?.includes("GJRs4FwH") || firstFunder?.includes("FpwQQhQQ")) {
        console.log(`   ⚠️ COINBASE CONNECTION`);
      }
    }

    await delay(2000);
  }
}

// ============================================
// 2. OUTBOUND TRANSFERS CHECK
// ============================================
async function checkOutboundTransfers(): Promise<void> {
  console.log("\n" + "═".repeat(60));
  console.log("2. OUTBOUND TRANSFERS CHECK");
  console.log("═".repeat(60));

  const txResult = await client.getTransactions({
    address: DEPLOYER_37X,
    chain: "solana",
    date: { from: "2025-11-30", to: "2025-12-01" },
    pagination: { page: 1, per_page: 50 },
  });

  const transactions = txResult.data || [];
  const outbound: { to: string; amount: number; time: string }[] = [];

  for (const tx of transactions) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        if (sent.token_symbol === "SOL" && sent.token_amount > 0.01 && sent.to_address) {
          outbound.push({
            to: sent.to_address,
            amount: sent.token_amount,
            time: tx.block_timestamp,
          });
        }
      }
    }
  }

  if (outbound.length === 0) {
    console.log("\n   ✅ No significant SOL outbound transfers today");
    console.log("   37Xxihfs is NOT funding any new deployer wallets");
  } else {
    console.log(`\n   ⚠️ Found ${outbound.length} outbound transfers:`);
    for (const o of outbound) {
      console.log(`   - ${o.amount.toFixed(4)} SOL → ${shortAddr(o.to)} at ${o.time}`);
    }
  }
}

// ============================================
// 3. HISTORICAL LAUNCH TIMING
// ============================================
async function getExactLaunchTimes(): Promise<{ name: string; firstTrade: string; dayOfWeek: string; timeUTC: string }[]> {
  console.log("\n" + "═".repeat(60));
  console.log("3. EXACT LAUNCH TIMES (First Trade)");
  console.log("═".repeat(60));

  const results: { name: string; firstTrade: string; dayOfWeek: string; timeUTC: string }[] = [];

  for (const token of TOKENS) {
    console.log(`\n📍 ${token.name} (${shortAddr(token.address)})`);

    try {
      const trades = await client.getTGMDexTrades({
        token_address: token.address,
        chain: "solana",
        date: { from: token.launchDate, to: token.endDate },
        pagination: { page: 1, per_page: 100 },
      });

      if (trades.length > 0) {
        // Sort by timestamp to find first trade
        trades.sort((a, b) =>
          new Date(a.block_timestamp).getTime() - new Date(b.block_timestamp).getTime()
        );

        const firstTrade = trades[0];
        const date = new Date(firstTrade.block_timestamp);
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayOfWeek = days[date.getUTCDay()];
        const timeUTC = date.toISOString().split("T")[1].slice(0, 8);

        console.log(`   First Trade: ${firstTrade.block_timestamp}`);
        console.log(`   Day: ${dayOfWeek}`);
        console.log(`   Time (UTC): ${timeUTC}`);

        // Convert to Pacific
        const pacificTime = new Date(date.getTime() - 8 * 60 * 60 * 1000);
        const pacificStr = pacificTime.toISOString().split("T")[1].slice(0, 5);
        console.log(`   Time (Pacific): ${pacificStr}`);

        results.push({
          name: token.name,
          firstTrade: firstTrade.block_timestamp,
          dayOfWeek,
          timeUTC,
        });
      } else {
        console.log(`   ❌ No trades found on launch date`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    await delay(2000);
  }

  return results;
}

// ============================================
// 4. LAUNCH WINDOW PREDICTION
// ============================================
function predictLaunchWindow(launchTimes: { name: string; firstTrade: string; dayOfWeek: string; timeUTC: string }[]): void {
  console.log("\n" + "═".repeat(60));
  console.log("4. LAUNCH WINDOW PREDICTION");
  console.log("═".repeat(60));

  if (launchTimes.length === 0) {
    console.log("\n   ❌ Not enough data to predict");
    return;
  }

  // Extract hours
  const hours = launchTimes.map(lt => {
    const [h, m] = lt.timeUTC.split(":");
    return parseInt(h) + parseInt(m) / 60;
  });

  const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
  const minHour = Math.min(...hours);
  const maxHour = Math.max(...hours);

  // Today's funding times (UTC)
  const fundingTimes = [5.82, 9.25, 9.73]; // 05:49, 09:15, 09:44
  const lastFunding = Math.max(...fundingTimes);

  console.log("\n📊 ANALYSIS:");
  console.log(`   Previous launches: ${launchTimes.map(lt => lt.timeUTC).join(", ")} UTC`);
  console.log(`   Average launch hour: ${avgHour.toFixed(2)} UTC`);
  console.log(`   Launch range: ${minHour.toFixed(2)} - ${maxHour.toFixed(2)} UTC`);
  console.log(`   Today's last funding: ${lastFunding.toFixed(2)} UTC`);

  // Calculate prediction
  // Assume launch happens after funding is complete
  const predictedStart = Math.max(avgHour - 1, lastFunding + 1);
  const predictedEnd = maxHour + 2;

  const startUTC = `${Math.floor(predictedStart)}:${String(Math.round((predictedStart % 1) * 60)).padStart(2, "0")}`;
  const endUTC = `${Math.floor(predictedEnd)}:${String(Math.round((predictedEnd % 1) * 60)).padStart(2, "0")}`;

  // Convert to Pacific (UTC - 8)
  const startPacific = predictedStart - 8;
  const endPacific = predictedEnd - 8;
  const startPST = `${Math.floor(startPacific)}:${String(Math.round((startPacific % 1) * 60)).padStart(2, "0")}`;
  const endPST = `${Math.floor(endPacific)}:${String(Math.round((endPacific % 1) * 60)).padStart(2, "0")}`;

  console.log("\n" + "─".repeat(60));
  console.log("🎯 PREDICTED LAUNCH WINDOW:");
  console.log("─".repeat(60));
  console.log(`\n   UTC:     ${startUTC} - ${endUTC}`);
  console.log(`   Pacific: ${startPST} - ${endPST}`);

  // Current time analysis
  const now = new Date();
  const nowUTC = now.getUTCHours() + now.getUTCMinutes() / 60;
  console.log(`\n   Current time: ${now.toISOString().split("T")[1].slice(0, 5)} UTC`);

  if (nowUTC < predictedStart) {
    const waitHours = predictedStart - nowUTC;
    console.log(`   ⏳ Window opens in ~${waitHours.toFixed(1)} hours`);
  } else if (nowUTC >= predictedStart && nowUTC <= predictedEnd) {
    console.log(`   🔴 LAUNCH WINDOW IS NOW OPEN`);
  } else {
    console.log(`   ⚠️ Past predicted window - launch may be delayed`);
  }
}

// ============================================
// 5. SUMMARY
// ============================================
function printSummary(): void {
  console.log("\n" + "═".repeat(60));
  console.log("5. SUMMARY - MONITOR THESE");
  console.log("═".repeat(60));

  console.log(`
┌─────────────────────────────────────────────────────────────┐
│ PRIMARY TARGET: 37Xxihfs                                     │
│ Address: 37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2       │
│ Balance: ~8.94 SOL (matches 8-10 SOL dev buy pattern)       │
│ Status: FUNDED & ACTIVE                                      │
├─────────────────────────────────────────────────────────────┤
│ HISTORICAL DEV BUY SIZES:                                   │
│   XRPEPE:    8.09876 SOL                                    │
│   TrollXRP:  9.87654 SOL                                    │
│   Current:   8.94 SOL ← CONFLUENT                           │
└─────────────────────────────────────────────────────────────┘

Watch for:
1. pump.fun deployment from 37Xxihfs
2. Token creation transaction
3. First trade activity
`);
}

// ============================================
// MAIN
// ============================================
async function run(): Promise<void> {
  console.log("\n" + "█".repeat(60));
  console.log("█ LAUNCH PREDICTION ANALYSIS - " + new Date().toISOString());
  console.log("█".repeat(60));

  await analyzeFundingSources();
  await delay(2000);

  await checkOutboundTransfers();
  await delay(2000);

  const launchTimes = await getExactLaunchTimes();
  await delay(1000);

  predictLaunchWindow(launchTimes);

  printSummary();

  console.log("█".repeat(60) + "\n");
}

run().catch(console.error);
