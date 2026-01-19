/**
 * Deep trace: Is EbMRVzXVRH8y funded by our known dev entity?
 * Trace up to 10 levels looking for Coinbase, ROOT, v49j, 37Xxihfs
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const EBMR = "EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV";

const KNOWN_ENTITY = new Map([
  [WALLETS.ROOT, "ROOT (Coinbase-funded)"],
  [WALLETS.PRIMARY_FUNDER, "v49j (Primary Funder)"],
  [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs (Original Deployer)"],
  [WALLETS.COINBASE_HOT_1, "Coinbase Hot Wallet 1"],
  [WALLETS.COINBASE_HOT_2, "Coinbase Hot Wallet 2"],
  [WALLETS.DEPLOYER_BZ2Y, "Bz2yexdH (RXRP Deployer)"],
  [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt (New Funder)"],
  // Known Coinbase patterns
  ["GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", "Coinbase Hot Wallet"],
  ["FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q", "Coinbase Hot Wallet"],
]);

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  DEEP TRACE: EbMRVzXVRH8y → Known Dev Entity?");
  console.log("  Looking for: Coinbase, ROOT, v49j, 37Xxihfs");
  console.log("=".repeat(70));

  let currentAddress = EBMR;
  const chain: string[] = [];
  let foundConnection = false;

  for (let level = 0; level < 10; level++) {
    const shortAddr = currentAddress.slice(0, 16);
    const knownName = KNOWN_ENTITY.get(currentAddress);

    if (knownName) {
      console.log(`\n  Level ${level}: ${shortAddr}...`);
      console.log(`  🚨🚨🚨 MATCH: ${knownName}`);
      chain.push(`${shortAddr} (${knownName})`);
      foundConnection = true;
      break;
    }

    console.log(`\n  Level ${level}: ${shortAddr}...`);
    chain.push(shortAddr);

    // Also check if this address has any labels
    const related = await client.getRelatedWallets({
      address: currentAddress,
      chain: "solana",
      pagination: { page: 1, per_page: 10 },
    });

    const firstFunderRel = related.find((r) => r.relation === "First Funder");
    if (firstFunderRel) {
      const labels = firstFunderRel.labels?.join(", ") || "No label";
      console.log(`    First Funder: ${firstFunderRel.address.slice(0, 16)}...`);
      console.log(`    Labels: ${labels}`);

      // Check for Coinbase or known labels
      if (
        labels.toLowerCase().includes("coinbase") ||
        labels.toLowerCase().includes("binance") ||
        labels.toLowerCase().includes("exchange")
      ) {
        console.log(`  🚨 CEX ORIGIN DETECTED: ${labels}`);
        foundConnection = true;
        chain.push(`${firstFunderRel.address.slice(0, 16)} (${labels})`);
        break;
      }

      currentAddress = firstFunderRel.address;
    } else {
      console.log(`    No First Funder found - chain ends`);
      break;
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n" + "=".repeat(70));
  console.log("  FUNDING CHAIN");
  console.log("=".repeat(70));
  console.log(`\n  ${chain.join(" → ")}`);

  console.log("\n" + "=".repeat(70));
  console.log("  VERDICT");
  console.log("=".repeat(70));

  if (foundConnection) {
    console.log(`
  ✅ EbMRVzXVRH8y IS connected to known dev entity!

  This confirms the QuantumCore chain is the SAME entity
  as the XRP token deployer.
`);
  } else {
    console.log(`
  ❓ No direct connection found to known entity wallets.

  However, we KNOW there's a connection through:
  EbMRVzXVRH8y → 9dcT4Cw → Bz2yexdH (RXRP deployer)

  This could mean:
  1. Different funding source but same operator
  2. Connection exists but through counterparties, not First Funder
  3. Deeper chain we haven't traced
`);
  }
}

main().catch(console.error);
