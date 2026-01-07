import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const WALLETS = [
  { name: "Bz2yexdH", addr: "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y", role: "Fresh Deployer" },
  { name: "Hqf4TZxp", addr: "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT", role: "Insider" },
];

async function run() {
  console.log("=".repeat(60));
  console.log("URGENT STATUS CHECK - " + new Date().toISOString());
  console.log("=".repeat(60));

  for (const wallet of WALLETS) {
    console.log(`\n--- ${wallet.name} (${wallet.role}) ---`);

    // Balance
    const balances = await client.getCurrentBalance({ address: wallet.addr, chain: "solana" });
    for (const b of balances) {
      if (b.token_symbol === "SOL") {
        console.log("Balance:", b.token_amount.toFixed(4), "SOL ($" + (b.value_usd?.toFixed(2) || "?") + ")");
      }
    }

    // Check for other tokens (might indicate a purchase)
    const otherTokens = balances.filter(b => b.token_symbol !== "SOL" && b.token_amount > 0);
    if (otherTokens.length > 0) {
      console.log("Other tokens:", otherTokens.length);
      for (const t of otherTokens.slice(0, 5)) {
        const sym = t.token_symbol || t.token_address?.slice(0, 10) + "...";
        console.log("  -", sym, ":", t.token_amount);
      }
    }

    await new Promise(r => setTimeout(r, 1500));

    // Transactions
    const txResult = await client.getTransactions({
      address: wallet.addr,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: { page: 1, per_page: 10 }
    });
    console.log("Transactions today:", txResult.data?.length || 0);

    // Check for deployment (Bz2yexdH only)
    if (wallet.name === "Bz2yexdH") {
      const related = await client.getRelatedWallets({
        address: wallet.addr,
        chain: "solana",
        pagination: { page: 1, per_page: 20 }
      });

      const deployed = related.filter(r => r.relation === "Deployed via");
      if (deployed.length > 0) {
        console.log("\n🚨🚨🚨 TOKEN DEPLOYED! 🚨🚨🚨");
        for (const d of deployed) {
          console.log("  Token:", d.address);
          console.log("  Time:", d.block_timestamp);
          console.log("  Tx:", d.transaction_hash);
        }
      } else {
        console.log("Deployed tokens: NONE");
      }
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("\n" + "=".repeat(60));
}

run().catch(console.error);
