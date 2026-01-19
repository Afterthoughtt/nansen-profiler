/**
 * Check if Hqf4TZxp bought RXRP (even after 5 min window)
 */
import "dotenv/config";
import { NansenClient } from './nansen-client.js';

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const HQF4 = "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT";
const RXRP = "3VQU1DgaLE6E49HhqvH73Azsin8gAZRc14cvyV4hpump";

async function main() {
  console.log("=== Hqf4TZxp RXRP Purchase Check ===\n");
  console.log("Checking if Hqf4TZxp bought RXRP at any point...\n");

  // Get all trades for RXRP on Nov 30 - Dec 5 (wider window)
  const trades = await client.getTGMDexTrades({
    chain: "solana",
    token_address: RXRP,
    date: { from: "2025-11-30", to: "2025-12-05" },
    filters: { action: "BUY" },
    pagination: { page: 1, per_page: 100 },
  });

  console.log(`Total RXRP buys (Nov 30 - Dec 5): ${trades.length}`);

  // Find Hqf4TZxp trades
  const hqfTrades = trades.filter(t => t.trader_address === HQF4);

  if (hqfTrades.length > 0) {
    console.log(`\n✅ Hqf4TZxp DID buy RXRP!`);
    for (const t of hqfTrades) {
      console.log(`  Time: ${t.block_timestamp}`);
      console.log(`  Value: $${t.estimated_value_usd?.toFixed(2)}`);
    }
  } else {
    console.log(`\n❌ Hqf4TZxp NOT found in RXRP trades`);
  }

  // Also check their wallet transactions around launch
  console.log("\n--- Hqf4TZxp Wallet Transactions (Nov 30 - Dec 5) ---");

  await new Promise(r => setTimeout(r, 2000));

  const txResult = await client.getTransactions({
    address: HQF4,
    chain: "solana",
    date: { from: "2025-11-30", to: "2025-12-05" },
    pagination: { page: 1, per_page: 30 },
  });

  const txns = txResult.data || [];
  console.log(`Transactions found: ${txns.length}`);

  // Look for RXRP in received tokens
  let foundRXRP = false;
  for (const tx of txns) {
    const tokensReceived = tx.tokens_received || [];
    for (const recv of tokensReceived) {
      if (recv.token_address === RXRP || (recv.token_symbol && recv.token_symbol.includes("RXRP"))) {
        foundRXRP = true;
        console.log(`  ✅ RXRP received: ${tx.block_timestamp}`);
        console.log(`     Amount: ${recv.token_amount}`);
        console.log(`     From: ${recv.from_address?.slice(0, 12)}...`);
      }
    }
  }

  if (!foundRXRP) {
    console.log("  No RXRP token transfers found");
  }

  // Final verdict
  console.log("\n=== VERDICT ===");
  if (hqfTrades.length > 0 || foundRXRP) {
    console.log("Hqf4TZxp DID interact with RXRP - may have bought later");
    console.log("Status: Keep on watchlist, but lower priority than H3qSndFC");
  } else {
    console.log("Hqf4TZxp did NOT buy RXRP");
    console.log("Status: Downgrade confirmed - may have stopped insider activity");
  }
}

main().catch(console.error);
