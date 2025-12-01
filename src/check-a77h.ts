import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");
const WALLET = "A77HErqtfN1hLLpvZ9pCtu66FEtM8BveoaKbbMoZ4RiR";

async function run() {
  console.log("=".repeat(60));
  console.log("CHECKING A77HErqt - SHARED FUNDING SOURCE");
  console.log("=".repeat(60));

  // Balance
  console.log("\n[BALANCE]");
  const balances = await client.getCurrentBalance({ address: WALLET, chain: "solana" });
  for (const b of balances) {
    if (b.token_symbol === "SOL") {
      console.log("SOL:", b.token_amount.toFixed(4), "($" + (b.value_usd?.toFixed(2) || "?") + ")");
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  // First Funder
  console.log("\n[FIRST FUNDER]");
  const firstFunder = await client.findFirstFunder(WALLET);
  console.log("First Funder:", firstFunder);

  const knownWallets: Record<string, string> = {
    "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2": "37Xxihfs (Original Deployer)",
    "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5": "v49j (Primary Funder)",
    "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE": "Coinbase Hot Wallet 1",
    "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q": "Coinbase Hot Wallet 2",
    "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF": "ROOT",
  };

  if (firstFunder && knownWallets[firstFunder]) {
    console.log("*** KNOWN:", knownWallets[firstFunder], "***");
  }

  await new Promise(r => setTimeout(r, 2000));

  // Trace full chain
  console.log("\n[FUNDING CHAIN]");
  const chain = await client.traceFundingChain(WALLET, 3);
  console.log("Chain:");
  for (let i = 0; i < chain.length; i++) {
    const indent = "  ".repeat(i);
    const label = knownWallets[chain[i]] ? " (" + knownWallets[chain[i]] + ")" : "";
    console.log(indent + "→", chain[i] + label);
  }

  await new Promise(r => setTimeout(r, 2000));

  // Recent outbound
  console.log("\n[RECENT OUTBOUND TRANSACTIONS]");
  const txResult = await client.getTransactions({
    address: WALLET,
    chain: "solana",
    date: { from: "2025-11-30", to: "2025-12-31" },
    pagination: { page: 1, per_page: 30 }
  });

  const txs = txResult.data || [];
  console.log("Total transactions today:", txs.length);

  // Find SOL sent
  const sentTo = new Map<string, number>();
  for (const tx of txs) {
    if (tx.tokens_sent) {
      for (const s of tx.tokens_sent) {
        if (s.token_symbol === "SOL" && s.to_address && s.token_amount > 0.01) {
          const current = sentTo.get(s.to_address) || 0;
          sentTo.set(s.to_address, current + s.token_amount);
        }
      }
    }
  }

  console.log("\nSOL sent to:");
  for (const [addr, amount] of sentTo) {
    const label = knownWallets[addr] || "";
    const isInsider = addr === "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT" ? " *** INSIDER ***" : "";
    const is37x = addr === "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2" ? " *** DEPLOYER ***" : "";
    console.log("-", addr.slice(0, 12) + "...", amount.toFixed(4), "SOL", label, isInsider, is37x);
  }

  console.log("\n" + "=".repeat(60));
}

run().catch(console.error);
