/**
 * Check the second SPL token: b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const TOKEN_2 = "b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  INVESTIGATING SECOND TOKEN");
  console.log("  " + TOKEN_2);
  console.log("=".repeat(70));

  // Check related wallets for the token (deployer)
  console.log("\n📍 TOKEN DEPLOYER / RELATED WALLETS");

  try {
    const related = await client.getRelatedWallets({
      address: TOKEN_2,
      chain: "solana",
      pagination: { page: 1, per_page: 20 },
    });

    console.log(`\nFound ${related.length} related wallets:\n`);

    const knownWallets = new Map([
      [WALLETS.DEPLOYER_BZ2Y, "Bz2yexdH (RXRP Deployer)"],
      [WALLETS.PRIMARY_FUNDER, "v49j"],
      [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs"],
      [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt"],
      ["9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66", "9dcT4Cw"],
      ["EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV", "QuantumCore Deployer"],
    ]);

    for (const rw of related) {
      const known = knownWallets.get(rw.address);
      const flag = known ? ` 🚨 ${known}` : "";
      console.log(`  ${rw.relation}: ${rw.address.slice(0, 20)}...${flag}`);
      if (rw.labels && rw.labels.length > 0) {
        console.log(`     Labels: ${rw.labels.join(", ")}`);
      }
    }
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }

  // Check holders
  console.log("\n📍 TOKEN HOLDERS");

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const holders = await client.getTGMHolders({
      token_address: TOKEN_2,
      chain: "solana",
      pagination: { page: 1, per_page: 30 },
    });

    console.log(`\nFound ${holders.length} holders:\n`);

    const knownWallets = new Map([
      [WALLETS.DEPLOYER_BZ2Y, "Bz2yexdH (RXRP Deployer)"],
      [WALLETS.PRIMARY_FUNDER, "v49j"],
      [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs"],
      [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt"],
      ["9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66", "9dcT4Cw"],
      ["EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV", "QuantumCore Deployer"],
    ]);

    for (const h of holders) {
      const known = knownWallets.get(h.owner_address);
      const flag = known ? ` 🚨 ${known}` : "";
      const pct = h.percentage_of_total
        ? ` (${(h.percentage_of_total * 100).toFixed(1)}%)`
        : "";
      console.log(`  ${h.owner_address.slice(0, 20)}...${flag}`);
      console.log(`     Balance: ${h.token_amount}${pct}`);
    }
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }
}

main().catch(console.error);
