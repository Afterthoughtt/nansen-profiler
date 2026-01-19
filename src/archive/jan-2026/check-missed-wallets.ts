/**
 * Quick check on v49j SOL recipients we might have missed
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const MISSED = [
  { name: "HTvjzsfX", address: "HTvjzsfX3yU6BUodCjZ5vZkUrAxMDTrBs3CJaq43ashR", sol: 0.52 },
  { name: "6n9VhCwQ", address: "6n9VhCwQ7EwK6NqFDjnHPzEk6wZdRBTfh43RFgHQWHuQ", sol: 0.51 },
  { name: "ARu4n5mF", address: "ARu4n5mFdZogZAravu7CcizaojWnS6oqka37gdLT5SZn", sol: 0.30 },
  { name: "FksffEqn", address: "FksffEqnBRixYGR791Qw2MgdU7zNCpHVFYBL4Fa4qVuH", sol: 0.20 },
  { name: "FpCMFDFG", address: "FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q", sol: 0.19 },
];

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  CHECKING MISSED v49j RECIPIENTS");
  console.log("=".repeat(70));

  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const wallet of MISSED) {
    console.log(`\n📍 ${wallet.name} (received ${wallet.sol} SOL from v49j)`);

    // Get balance
    const balance = await client.getCurrentBalance({
      address: wallet.address,
      chain: "solana",
    });

    const sol = balance.find((b) => b.token_symbol === "SOL");
    console.log(`  Current balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL`);

    // Get interaction count
    const counterparties = await client.getCounterparties({
      address: wallet.address,
      chain: "solana",
      date: {
        from: monthAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      },
      group_by: "wallet",
      source_input: "Combined",
    });

    const totalInteractions = counterparties.reduce(
      (sum, cp) => sum + cp.interaction_count,
      0
    );

    console.log(`  Interactions (30d): ${totalInteractions}`);

    if (totalInteractions < 10) {
      console.log(`  ⚠️ FRESH WALLET - Worth watching!`);
    } else if (totalInteractions < 50) {
      console.log(`  Low activity`);
    } else {
      console.log(`  Active wallet`);
    }

    // Check for THE/COIN tokens
    for (const b of balance) {
      if (b.token_symbol === "THE" || b.token_symbol === "COIN" ||
          b.token_address === "7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho" ||
          b.token_address === "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs") {
        console.log(`  🚨 HAS THE/COIN TOKENS: ${b.token_amount}`);
      }
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n" + "=".repeat(70));
}

main().catch(console.error);
