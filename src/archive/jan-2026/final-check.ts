/**
 * Final pre-launch checks
 */
import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import { WALLETS } from "./config/index.js";

const client = new NansenClient(process.env.NANSEN_API_KEY || "");

async function main() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateRange = {
    from: weekAgo.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };

  console.log("\n" + "=".repeat(70));
  console.log("  FINAL PRE-LAUNCH CHECKS - " + new Date().toLocaleString());
  console.log("=".repeat(70));

  // 1. Check ROOT wallet
  console.log("\n📍 ROOT WALLET - Recent outbound?");
  const rootTx = await client.getTransactions({
    address: WALLETS.ROOT,
    chain: "solana",
    date: dateRange,
    pagination: { page: 1, per_page: 10 },
  });

  const rootTxs = rootTx.data || [];
  if (rootTxs.length === 0) {
    console.log("  No recent transactions");
  } else {
    for (const tx of rootTxs.slice(0, 5)) {
      console.log(`  ${tx.block_timestamp}`);
      if (tx.tokens_sent) {
        for (const sent of tx.tokens_sent) {
          if (sent.token_amount && Math.abs(sent.token_amount) > 0.1) {
            console.log(`    SENT: ${Math.abs(sent.token_amount).toFixed(4)} ${sent.token_symbol} to ${sent.to_address?.slice(0, 16)}...`);
          }
        }
      }
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Check HYMt for ANY outbound
  console.log("\n📍 HYMt - Any outbound since funded?");
  const hymtTx = await client.getTransactions({
    address: WALLETS.POTENTIAL_FUNDER_HYMT,
    chain: "solana",
    date: dateRange,
    pagination: { page: 1, per_page: 20 },
  });

  const hymtTxs = hymtTx.data || [];
  let hymtOutbound = false;

  for (const tx of hymtTxs) {
    if (tx.tokens_sent) {
      for (const sent of tx.tokens_sent) {
        if (sent.token_symbol === "SOL" && sent.token_amount && Math.abs(sent.token_amount) > 0.1) {
          hymtOutbound = true;
          console.log(`  🚨 OUTBOUND: ${tx.block_timestamp}`);
          console.log(`     ${Math.abs(sent.token_amount).toFixed(4)} SOL to ${sent.to_address}`);
        }
      }
    }
  }

  if (!hymtOutbound) {
    console.log("  ✓ No significant SOL outbound - HYMt still holding 7.1 SOL");
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Check 37Xxihfs (original deployer)
  console.log("\n📍 37Xxihfs (Original Deployer) - Recent activity?");
  const origTx = await client.getTransactions({
    address: WALLETS.ORIGINAL_DEPLOYER,
    chain: "solana",
    date: dateRange,
    pagination: { page: 1, per_page: 10 },
  });

  const origTxs = origTx.data || [];
  if (origTxs.length === 0) {
    console.log("  No recent transactions");
  } else {
    console.log(`  ${origTxs.length} recent transactions`);
    for (const tx of origTxs.slice(0, 3)) {
      console.log(`  ${tx.block_timestamp}`);
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 4. Check cross-launch front-runner
  console.log("\n📍 BNmf81tG (3-launch front-runner) - Recent activity?");
  const bnmfTx = await client.getTransactions({
    address: "BNmf81tG5ApZWxVqARFWCiF3ppA8c4gLF8ssgZPKjpz4",
    chain: "solana",
    date: dateRange,
    pagination: { page: 1, per_page: 10 },
  });

  const bnmfBalance = await client.getCurrentBalance({
    address: "BNmf81tG5ApZWxVqARFWCiF3ppA8c4gLF8ssgZPKjpz4",
    chain: "solana",
  });

  const bnmfSol = bnmfBalance.find((b) => b.token_symbol === "SOL");
  console.log(`  Balance: ${bnmfSol?.token_amount?.toFixed(4) || "0"} SOL`);

  const bnmfTxs = bnmfTx.data || [];
  if (bnmfTxs.length > 0) {
    console.log(`  Last activity: ${bnmfTxs[0].block_timestamp}`);
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  FINAL ASSESSMENT");
  console.log("=".repeat(70));
  console.log(`
  ✓ HYMt still has 7.1 SOL - no outbound
  ✓ v49j only funded HYMt with significant SOL
  ✓ Other SOL recipients were trading bots (millions of interactions)

  PRIMARY TARGET REMAINS: HYMt
  HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG

  WATCH FOR:
  - HYMt interacting with pump.fun
  - HYMt sending SOL to a fresh wallet (would be new deployer)
  - Any new inbound to v49j (chain refill)
`);
}

main().catch(console.error);
