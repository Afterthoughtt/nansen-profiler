/**
 * Trace the funding chain for these wallets 3 levels deep
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

const KNOWN_CHAIN = new Map([
  [WALLETS.PRIMARY_FUNDER, "v49j"],
  [WALLETS.ORIGINAL_DEPLOYER, "37Xxihfs"],
  [WALLETS.POTENTIAL_FUNDER_HYMT, "HYMt"],
  [WALLETS.ROOT, "ROOT"],
  [WALLETS.COINBASE_HOT_1, "Coinbase Hot 1"],
  [WALLETS.COINBASE_HOT_2, "Coinbase Hot 2"],
  [WALLETS.DEPLOYER_D7MS, "D7Ms (XRPEP3)"],
  [WALLETS.DEPLOYER_DBMX, "DBmx (TrollXRP)"],
  [WALLETS.DEPLOYER_BZ2Y, "Bz2y (RXRP)"],
]);

async function traceChain(startAddress: string, startName: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  TRACING: ${startName}`);
  console.log(`${"=".repeat(60)}`);

  let currentAddress = startAddress;
  let level = 0;
  const chain: string[] = [];

  while (level < 5) {
    const shortAddr = currentAddress.slice(0, 12);
    const knownName = KNOWN_CHAIN.get(currentAddress);

    if (knownName) {
      console.log(`  Level ${level}: ${shortAddr}... 🚨 ${knownName}`);
      chain.push(`${shortAddr}... (${knownName})`);
      console.log(`\n  ✅ CONNECTED TO DEPLOYER CHAIN at level ${level}!`);
      break;
    }

    console.log(`  Level ${level}: ${shortAddr}...`);
    chain.push(`${shortAddr}...`);

    await new Promise((r) => setTimeout(r, 1500));

    const firstFunder = await client.findFirstFunder(currentAddress);

    if (!firstFunder) {
      console.log(`  Level ${level + 1}: (No First Funder found)`);
      break;
    }

    currentAddress = firstFunder;
    level++;
  }

  console.log(`\n  Chain: ${chain.join(" → ")}`);
  return chain;
}

async function main() {
  const TARGETS = [
    {
      name: "9dcT4Cw",
      address: "9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66",
      firstFunder: "EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV",
    },
    {
      name: "4MjUnWu",
      address: "4MjUnWuKAoSo1hogJ9ftQVCv7ywKffYyJx3u2tJcEiWH",
      firstFunder: "6S4szeas4BjgrNBPpMZ8VYzjJC2L9g2fgDEEbNPWTxmN",
    },
  ];

  console.log("\n" + "=".repeat(60));
  console.log("  FUNDING CHAIN TRACE (5 levels)");
  console.log("=".repeat(60));

  for (const target of TARGETS) {
    await traceChain(target.address, target.name);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

main().catch(console.error);
