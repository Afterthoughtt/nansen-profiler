/**
 * Quick status check on QuantumCore chain
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const WALLETS = [
  { name: "EbMRVzXVRH8y (Quantum deployer)", addr: "EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV" },
  { name: "9dcT4Cw (SPL distributor)", addr: "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66" },
];

async function main() {
  console.log("\n" + "=".repeat(50));
  console.log("  QUANTUMCORE CHAIN STATUS");
  console.log("  " + new Date().toLocaleString());
  console.log("=".repeat(50) + "\n");

  for (const w of WALLETS) {
    try {
      const balance = await client.getCurrentBalance({ address: w.addr, chain: "solana" });
      const sol = balance.find((b) => b.token_symbol === "SOL");
      console.log(`  ${w.name}`);
      console.log(`    Balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL`);
    } catch (e: any) {
      console.log(`  ${w.name}: Error - ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n" + "=".repeat(50));
}

main().catch(console.error);
