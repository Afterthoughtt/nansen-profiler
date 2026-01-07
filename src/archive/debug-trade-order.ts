/**
 * Debug script to understand why we're finding 0 trades in the launch window
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { NansenClient } from "./nansen-client.js";
import type { TGMDexTrade } from "./types.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// XRPEP3 from deployers.json
const TOKEN_ADDRESS = "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump";
const LAUNCH_TIME_STR = "2025-09-28T17:51:54.000Z"; // From deployers.json
const launchTime = new Date(LAUNCH_TIME_STR);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to parse timestamp correctly (API returns without Z)
function parseTimestamp(ts: string): Date {
  return new Date(ts.endsWith("Z") ? ts : ts + "Z");
}

async function debug() {
  console.log("=".repeat(60));
  console.log("DEBUG: Finding trades around XRPEP3 launch");
  console.log("=".repeat(60));
  console.log(`\nToken: ${TOKEN_ADDRESS}`);
  console.log(`Launch time (from deployers.json): ${LAUNCH_TIME_STR}`);
  console.log(`Launch time parsed: ${launchTime.toISOString()}`);

  // Paginate until we find the launch window
  const allTrades: TGMDexTrade[] = [];
  const perPage = 100;
  const maxPages = 50;

  console.log(`\nFetching trades (up to ${maxPages} pages)...`);

  for (let page = 1; page <= maxPages; page++) {
    const trades = await client.getTGMDexTrades({
      token_address: TOKEN_ADDRESS,
      chain: "solana",
      date: { from: "2025-09-28", to: "2025-09-29" },
      pagination: { page, per_page: perPage },
    });

    if (trades.length === 0) {
      console.log(`  Page ${page}: Empty, stopping.`);
      break;
    }

    allTrades.push(...trades);

    // Check oldest trade in batch
    const oldestInBatch = trades[trades.length - 1];
    const oldestTime = parseTimestamp(oldestInBatch.block_timestamp);

    // If we've reached within 30 minutes of launch, we have enough
    if (oldestTime.getTime() <= launchTime.getTime() + 30 * 60 * 1000) {
      console.log(`  Page ${page}: Reached near launch time, stopping.`);
      break;
    }

    if (trades.length < perPage) break;
    if (page % 10 === 0) {
      console.log(`  Page ${page}: ${allTrades.length} trades total...`);
    }

    await delay(1500);
  }

  console.log(`\nTotal trades fetched: ${allTrades.length}`);

  // Sort all trades by time (oldest first)
  allTrades.sort((a, b) => {
    const ta = parseTimestamp(a.block_timestamp).getTime();
    const tb = parseTimestamp(b.block_timestamp).getTime();
    return ta - tb;
  });

  // Find earliest trade
  const earliest = allTrades[0];
  const earliestTime = parseTimestamp(earliest.block_timestamp);
  const diffMs = earliestTime.getTime() - launchTime.getTime();
  const diffMin = diffMs / 60000;

  console.log(`\n=== EARLIEST TRADE ===`);
  console.log(`Timestamp: ${earliest.block_timestamp}`);
  console.log(`Parsed as UTC: ${earliestTime.toISOString()}`);
  console.log(`Difference from launch: ${diffMin.toFixed(1)} minutes`);

  if (diffMin < 0) {
    console.log(`\n⚠️  EARLIEST TRADE IS BEFORE LAUNCH TIME!`);
    console.log(`   This means the launch time in deployers.json might be WRONG.`);
  } else if (diffMin > 5) {
    console.log(`\n⚠️  No trades in first 5 minutes after launch.`);
    console.log(`   Either no one traded, or the launch time is wrong.`);
  }

  // Show trades within 30 minutes of launch
  console.log(`\n=== TRADES WITHIN 30 MINUTES OF LAUNCH ===`);
  const nearLaunch = allTrades.filter((trade) => {
    const t = parseTimestamp(trade.block_timestamp);
    const diff = t.getTime() - launchTime.getTime();
    return diff >= -5 * 60 * 1000 && diff <= 30 * 60 * 1000; // -5 to +30 min
  });

  console.log(`Found ${nearLaunch.length} trades within -5 to +30 minutes of launch`);

  if (nearLaunch.length > 0) {
    console.log(`\nFirst 20 trades near launch:`);
    for (const trade of nearLaunch.slice(0, 20)) {
      const t = parseTimestamp(trade.block_timestamp);
      const diffSec = (t.getTime() - launchTime.getTime()) / 1000;
      console.log(
        `  ${trade.block_timestamp} | ${diffSec >= 0 ? "+" : ""}${diffSec.toFixed(0)}s | ${trade.action} | ${trade.trader_address?.slice(0, 12)}...`
      );
    }
  } else {
    // Show what's around the launch time
    console.log(`\n=== TRADES AROUND LAUNCH TIME (sorted by time) ===`);
    // Find index of trades closest to launch
    let closestIdx = 0;
    let closestDiff = Infinity;
    for (let i = 0; i < allTrades.length; i++) {
      const t = parseTimestamp(allTrades[i].block_timestamp);
      const diff = Math.abs(t.getTime() - launchTime.getTime());
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    }

    // Show trades around that index
    const start = Math.max(0, closestIdx - 5);
    const end = Math.min(allTrades.length, closestIdx + 15);
    console.log(`\nTrades around index ${closestIdx} (closest to launch):`);
    for (let i = start; i < end; i++) {
      const trade = allTrades[i];
      const t = parseTimestamp(trade.block_timestamp);
      const diffSec = (t.getTime() - launchTime.getTime()) / 1000;
      const marker = i === closestIdx ? " <-- CLOSEST" : "";
      console.log(
        `  ${trade.block_timestamp} | ${diffSec >= 0 ? "+" : ""}${diffSec.toFixed(0)}s | ${trade.action}${marker}`
      );
    }
  }

  // Check if launch time might be wrong
  console.log(`\n=== LAUNCH TIME VALIDATION ===`);
  console.log(`Expected launch: ${launchTime.toISOString()}`);
  console.log(`Earliest trade:  ${earliestTime.toISOString()}`);

  if (diffMin > 60) {
    console.log(`\n❌ The launch time might be WRONG by ${(diffMin / 60).toFixed(1)} hours`);
    console.log(`   Consider: The actual launch might have been at ${earliestTime.toISOString()}`);
  }
}

debug().catch(console.error);
