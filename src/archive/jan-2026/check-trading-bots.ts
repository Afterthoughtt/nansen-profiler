/**
 * Check trading bot balances - these have historically sent additional funding
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

// Trading bots that have funded deployers historically
const BOTS = [
  {
    name: "HVRcXaCF",
    address: "HVRcXaCFcUWRdpPZrCWGKdkUmBKiYrLcHqA9K1jSh3Lk",
    role: "Funded v49j + sent 2.89 SOL to Bz2yexdH on launch day",
  },
  {
    name: "Ed4UGBWK",
    address: "Ed4UGBWK4UpwdQ3nfNQFqmG1H5cVJH7AeZzPJhQnx2ye",
    role: "Main funder for Bz2yexdH ($63K)",
  },
];

async function check() {
  console.log("\n" + "=".repeat(60));
  console.log("  TRADING BOT BALANCE CHECK");
  console.log("  (Potential sources for additional HYMt funding)");
  console.log("=".repeat(60) + "\n");

  for (const bot of BOTS) {
    console.log(`📍 ${bot.name}`);
    console.log(`   ${bot.address}`);
    console.log(`   Role: ${bot.role}`);

    try {
      const balance = await client.getCurrentBalance({
        address: bot.address,
        chain: "solana",
      });

      const sol = balance.find((b) => b.token_symbol === "SOL");
      const usdc = balance.find((b) => b.token_symbol === "USDC");

      console.log(`   Balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL`);
      if (usdc && usdc.token_amount && usdc.token_amount > 1) {
        console.log(`            ${usdc.token_amount.toFixed(2)} USDC`);
      }
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }
    console.log();
    await new Promise((r) => setTimeout(r, 1500));
  }
}

check().catch(console.error);
