/**
 * Debug insider wallet hunt
 * The complete investigation returned 0 early buyers - let's see what's happening
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const XRPEP3_TOKEN = "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump";
const TROLLXRP_TOKEN = "CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump";

const V49J = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
const KNOWN_ADDRESSES = new Set([
  V49J,
  "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
  "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
  "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
  "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
]);

async function debug() {
  console.log("\n=== DEBUGGING INSIDER WALLET HUNT ===\n");

  // Try XRPEP3 with wider date range
  console.log("📍 XRPEP3 DEX Trades (full month of September)");
  console.log(`   Token: ${XRPEP3_TOKEN}\n`);

  const xrpep3Trades = await client.getTGMDexTrades({
    token_address: XRPEP3_TOKEN,
    chain: "solana",
    date: { from: "2025-09-01", to: "2025-09-30" },
    pagination: { page: 1, per_page: 100 },
  });

  console.log(`   Total trades returned: ${xrpep3Trades.length}`);

  if (xrpep3Trades.length > 0) {
    console.log("\n   Sample trades (raw data):");
    for (const trade of xrpep3Trades.slice(0, 5)) {
      console.log(`   ${JSON.stringify(trade, null, 2).slice(0, 500)}`);
    }

    console.log("\n   Parsed trades:");
    for (const trade of xrpep3Trades.slice(0, 10)) {
      const isKnown = KNOWN_ADDRESSES.has(trade.address || "");
      const side = trade.side || "unknown";
      const addr = trade.address?.slice(0, 12) || "unknown";
      console.log(`   ${trade.block_timestamp} | ${side.toUpperCase()} | ${addr}... | ${isKnown ? "KNOWN" : "NEW"} | $${trade.value_usd?.toFixed(2) || "?"}`);
    }

    // Count unique addresses
    const uniqueBuyers = new Set<string>();
    const unknownBuyers = new Set<string>();
    for (const trade of xrpep3Trades) {
      if (trade.side === "buy") {
        uniqueBuyers.add(trade.address);
        if (!KNOWN_ADDRESSES.has(trade.address)) {
          unknownBuyers.add(trade.address);
        }
      }
    }

    console.log(`\n   Unique buyers: ${uniqueBuyers.size}`);
    console.log(`   Unknown buyers (not in known list): ${unknownBuyers.size}`);

    if (unknownBuyers.size > 0) {
      console.log("\n   Unknown buyers:");
      for (const addr of Array.from(unknownBuyers).slice(0, 10)) {
        console.log(`   - ${addr}`);
      }
    }
  }

  // Try TrollXRP
  console.log("\n" + "=".repeat(50));
  console.log("📍 TrollXRP DEX Trades (first week of November)");
  console.log(`   Token: ${TROLLXRP_TOKEN}\n`);

  await new Promise(r => setTimeout(r, 2000));

  const trollxrpTrades = await client.getTGMDexTrades({
    token_address: TROLLXRP_TOKEN,
    chain: "solana",
    date: { from: "2025-11-01", to: "2025-11-07" },
    pagination: { page: 1, per_page: 100 },
  });

  console.log(`   Total trades returned: ${trollxrpTrades.length}`);

  if (trollxrpTrades.length > 0) {
    console.log("\n   Parsed trades:");
    for (const trade of trollxrpTrades.slice(0, 10)) {
      const isKnown = KNOWN_ADDRESSES.has(trade.address || "");
      const side = trade.side || "unknown";
      const addr = trade.address?.slice(0, 12) || "unknown";
      console.log(`   ${trade.block_timestamp} | ${side.toUpperCase()} | ${addr}... | ${isKnown ? "KNOWN" : "NEW"} | $${trade.value_usd?.toFixed(2) || "?"}`);
    }

    // Count unique addresses
    const uniqueBuyers = new Set<string>();
    const unknownBuyers = new Set<string>();
    for (const trade of trollxrpTrades) {
      if (trade.side === "buy") {
        uniqueBuyers.add(trade.address);
        if (!KNOWN_ADDRESSES.has(trade.address)) {
          unknownBuyers.add(trade.address);
        }
      }
    }

    console.log(`\n   Unique buyers: ${uniqueBuyers.size}`);
    console.log(`   Unknown buyers (not in known list): ${unknownBuyers.size}`);

    if (unknownBuyers.size > 0) {
      console.log("\n   Unknown buyers:");
      for (const addr of Array.from(unknownBuyers).slice(0, 10)) {
        console.log(`   - ${addr}`);
      }
    }
  }

  // Try getting holders instead
  console.log("\n" + "=".repeat(50));
  console.log("📍 TrollXRP Current Holders\n");

  await new Promise(r => setTimeout(r, 2000));

  const holders = await client.getTGMHolders({
    token_address: TROLLXRP_TOKEN,
    chain: "solana",
    pagination: { page: 1, per_page: 20 },
  });

  console.log(`   Total holders returned: ${holders.length}`);

  if (holders.length > 0) {
    console.log("\n   Top holders:");
    for (const holder of holders) {
      const isKnown = KNOWN_ADDRESSES.has(holder.address);
      const labels = holder.address_label?.join(", ") || "No label";
      console.log(`   ${holder.address.slice(0, 16)}... | ${holder.balance?.toFixed(2) || "?"} tokens | ${isKnown ? "KNOWN" : "NEW"}`);
      console.log(`      Labels: ${labels}`);
    }
  }
}

debug().catch(console.error);
