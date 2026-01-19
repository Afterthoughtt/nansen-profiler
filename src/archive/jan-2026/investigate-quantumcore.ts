/**
 * URGENT: Investigate QuantumCore token
 * - Is this the actual launch token?
 * - Who deployed it?
 * - Is deployer connected to our chain?
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS, DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const TOKEN_ADDRESS = "7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho";

const KNOWN_CHAIN = new Map([
  [WALLETS.PRIMARY_FUNDER, "v49j (Primary Funder)"],
  [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs (Original Deployer)"],
  [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt (NEW Funder)"],
  [WALLETS.ROOT, "ROOT"],
  [WALLETS.COINBASE_HOT_1, "Coinbase Hot 1"],
  [WALLETS.COINBASE_HOT_2, "Coinbase Hot 2"],
  [WALLETS.DEPLOYER_D7MS, "D7Ms (XRPEP3)"],
  [WALLETS.DEPLOYER_DBMX, "DBmx (TrollXRP)"],
  [WALLETS.DEPLOYER_BZ2Y, "Bz2y (RXRP)"],
  [WALLETS.DEPLOYER_GUCX, "GUCX (Sleeper)"],
  // User's wallets to exclude
  [WALLETS.USER_321CT, "USER: 321Ct"],
  [WALLETS.USER_DC5S, "USER: Dc5s"],
  [WALLETS.USER_9IUB, "USER: 9iUb"],
  [WALLETS.USER_D8ZB, "USER: D8ZB"],
]);

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  🚨 URGENT: QUANTUMCORE TOKEN INVESTIGATION");
  console.log("  Token: " + TOKEN_ADDRESS);
  console.log("=".repeat(70));

  // 1. Get token holders
  console.log("\n📍 TOKEN HOLDERS");
  console.log("-".repeat(50));

  try {
    const holders = await client.getTGMHolders({
      token_address: TOKEN_ADDRESS,
      chain: "solana",
      pagination: { page: 1, per_page: 50 },
    });

    console.log(`Found ${holders.length} holders\n`);

    for (const holder of holders.slice(0, 20)) {
      const addr = holder.owner_address;
      const shortAddr = addr.slice(0, 12);
      const knownName = KNOWN_CHAIN.get(addr);
      const flag = knownName ? ` 🚨 ${knownName}` : "";
      const balance = holder.token_amount?.toFixed(2) || "?";
      const pct = holder.percentage_of_total
        ? `(${(holder.percentage_of_total * 100).toFixed(1)}%)`
        : "";

      console.log(`  ${shortAddr}...${flag}`);
      console.log(`    Balance: ${balance} ${pct}`);
      if (holder.labels && holder.labels.length > 0) {
        console.log(`    Labels: ${holder.labels.join(", ")}`);
      }
    }
  } catch (e: any) {
    console.log(`  Error getting holders: ${e.message}`);
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 2. Get DEX trades
  console.log("\n📍 DEX TRADES (First 20)");
  console.log("-".repeat(50));

  try {
    const trades = await client.getTGMDexTrades({
      token_address: TOKEN_ADDRESS,
      chain: "solana",
      pagination: { page: 1, per_page: 20 },
    });

    console.log(`Found ${trades.length} trades\n`);

    for (const trade of trades.slice(0, 15)) {
      const addr = trade.wallet_address || "unknown";
      const shortAddr = addr.slice(0, 12);
      const knownName = KNOWN_CHAIN.get(addr);
      const flag = knownName ? ` 🚨 ${knownName}` : "";
      const side = trade.side || "?";
      const amount = trade.token_amount?.toFixed(2) || "?";
      const time = trade.block_timestamp || "?";

      console.log(`  ${time}`);
      console.log(`    ${side}: ${amount} by ${shortAddr}...${flag}`);
    }
  } catch (e: any) {
    console.log(`  Error getting trades: ${e.message}`);
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 3. Who bought/sold
  console.log("\n📍 WHO BOUGHT/SOLD");
  console.log("-".repeat(50));

  try {
    const whoBoughtSold = await client.getTGMWhoBoughtSold({
      token_address: TOKEN_ADDRESS,
      chain: "solana",
      pagination: { page: 1, per_page: 30 },
    });

    console.log(`Found ${whoBoughtSold.length} participants\n`);

    // Look for chain connections
    let chainConnections: string[] = [];

    for (const participant of whoBoughtSold.slice(0, 20)) {
      const addr = participant.wallet_address || "unknown";
      const shortAddr = addr.slice(0, 12);
      const knownName = KNOWN_CHAIN.get(addr);
      const flag = knownName ? ` 🚨 ${knownName}` : "";

      if (knownName) {
        chainConnections.push(`${knownName}: ${addr}`);
      }

      const bought = participant.total_bought?.toFixed(2) || "0";
      const sold = participant.total_sold?.toFixed(2) || "0";

      console.log(`  ${shortAddr}...${flag}`);
      console.log(`    Bought: ${bought} | Sold: ${sold}`);
      if (participant.labels && participant.labels.length > 0) {
        console.log(`    Labels: ${participant.labels.join(", ")}`);
      }
    }

    if (chainConnections.length > 0) {
      console.log("\n🚨 CHAIN CONNECTIONS FOUND:");
      for (const conn of chainConnections) {
        console.log(`  - ${conn}`);
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message}`);
  }

  // 4. Try to find deployer by checking who has most tokens or first interaction
  console.log("\n📍 SEARCHING FOR DEPLOYER");
  console.log("-".repeat(50));

  // Check the token address itself for related wallets (deployer might be linked)
  try {
    const related = await client.getRelatedWallets({
      address: TOKEN_ADDRESS,
      chain: "solana",
      pagination: { page: 1, per_page: 20 },
    });

    console.log(`Related wallets to token: ${related.length}`);
    for (const rw of related) {
      const knownName = KNOWN_CHAIN.get(rw.address);
      const flag = knownName ? ` 🚨 ${knownName}` : "";
      console.log(`  ${rw.relation}: ${rw.address.slice(0, 16)}...${flag}`);
      if (rw.labels && rw.labels.length > 0) {
        console.log(`    Labels: ${rw.labels.join(", ")}`);
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("  INVESTIGATION COMPLETE");
  console.log("=".repeat(70));
}

main().catch(console.error);
