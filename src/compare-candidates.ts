import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

async function investigateWallet(client: NansenClient, address: string, label: string) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📊 ${label}`);
  console.log(`   ${address}`);
  console.log("=".repeat(70));

  const result: any = { address, label };

  // 1. Balance
  try {
    const balances = await client.getCurrentBalance({ address, chain: "solana" });
    const sol = balances.find((b) => b.token_symbol === "SOL");
    result.balance = sol?.token_amount || 0;
    console.log(`\n💰 Balance: ${result.balance.toFixed(4)} SOL`);
  } catch (e) {
    result.balance = 0;
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Related wallets
  try {
    const related = await client.getRelatedWallets({
      address,
      chain: "solana",
      pagination: { page: 1, per_page: 30 },
    });
    const ff = related.find((r) => r.relation === "First Funder");
    result.firstFunder = ff?.address || "Unknown";
    result.firstFunderLabel = ff?.address_label || "";
    console.log(`\n🔗 First Funder: ${result.firstFunder.slice(0, 20)}...`);
    if (result.firstFunderLabel) console.log(`   Label: ${result.firstFunderLabel}`);

    // Check if connected to our chain
    const is37x = result.firstFunder === "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";
    const isV49j = result.firstFunder === "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";
    result.connectedToChain = is37x || isV49j;
    console.log(`   Connected to 37X/v49j chain: ${result.connectedToChain ? "✅ YES" : "❌ NO"}`);
  } catch (e) {
    result.firstFunder = "Error";
    result.connectedToChain = false;
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Transactions
  try {
    const txResp = await client.getTransactions({
      address,
      chain: "solana",
      date: { from: "2025-01-01", to: "2025-12-01" },
      pagination: { page: 1, per_page: 100 },
    });
    result.txCount = txResp.data?.length || 0;
    console.log(`\n📜 Total Transactions: ${result.txCount}`);

    // Find recent activity
    if (txResp.data && txResp.data.length > 0) {
      const latest = txResp.data[0];
      result.lastActivity = latest.block_timestamp;
      console.log(`   Last Activity: ${result.lastActivity}`);

      // Show first 5 transactions
      console.log(`\n   Recent transactions:`);
      for (const tx of txResp.data.slice(0, 5)) {
        console.log(`   ${tx.block_timestamp} - ${tx.method}`);
        if (tx.tokens_received) {
          for (const r of tx.tokens_received) {
            if (r.token_amount && r.token_amount > 0.001) {
              console.log(`     RECV: ${r.token_amount?.toFixed(4)} ${r.token_symbol} ← ${r.from_address?.slice(0, 12)}...`);
            }
          }
        }
        if (tx.tokens_sent) {
          for (const s of tx.tokens_sent) {
            if (s.token_amount && s.token_amount > 0.001) {
              console.log(`     SENT: ${s.token_amount?.toFixed(4)} ${s.token_symbol} → ${s.to_address?.slice(0, 12)}...`);
            }
          }
        }
      }
    }
  } catch (e) {
    result.txCount = 0;
  }

  await new Promise((r) => setTimeout(r, 1500));

  // 4. Counterparties - check for pump.fun
  try {
    const counterparties = await client.getCounterparties({
      address,
      chain: "solana",
      date: { from: "2025-01-01", to: "2025-12-01" },
      group_by: "wallet",
      source_input: "Combined",
      pagination: { page: 1, per_page: 50 },
    });

    result.counterpartyCount = counterparties.length;
    console.log(`\n👥 Counterparties: ${result.counterpartyCount}`);

    // Check for pump.fun
    const pumpFun = counterparties.filter((cp) => {
      const label = cp.counterparty_address_label?.join(" ").toLowerCase() || "";
      return label.includes("pump.fun") || label.includes("bonding curve");
    });
    result.hasPumpFun = pumpFun.length > 0;
    console.log(`   Pump.fun interactions: ${result.hasPumpFun ? `⚠️ YES (${pumpFun.length})` : "✅ None"}`);

    // Check for 37X or v49j in counterparties
    const has37x = counterparties.some((cp) => cp.counterparty_address === "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2");
    const hasV49j = counterparties.some((cp) => cp.counterparty_address === "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5");
    result.interactedWith37x = has37x;
    result.interactedWithV49j = hasV49j;
    console.log(`   Interacted with 37Xxihfs: ${has37x ? "✅ YES" : "❌ No"}`);
    console.log(`   Interacted with v49j: ${hasV49j ? "✅ YES" : "❌ No"}`);

    // Show top counterparties
    console.log(`\n   Top counterparties:`);
    for (const cp of counterparties.slice(0, 5)) {
      const label = cp.counterparty_address_label?.join(", ") || "";
      console.log(`   ${cp.counterparty_address.slice(0, 16)}... | $${(cp.total_volume_usd || 0).toFixed(2)} ${label ? `| ${label}` : ""}`);
    }
  } catch (e) {
    result.counterpartyCount = 0;
    result.hasPumpFun = false;
  }

  return result;
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not set");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);

  console.log("🔍 COMPARING DEPLOYER CANDIDATES");
  console.log("Looking for the REAL fresh deployer\n");

  const candidates = [
    { address: "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y", label: "Bz2yexdH (found earlier)" },
    { address: "Bra1HUNKj1tcM3iKnL3pHc2m1rXkXZ9JELq4ceivag34", label: "Bra1HUNK (user question)" },
  ];

  const results: any[] = [];

  for (const candidate of candidates) {
    const result = await investigateWallet(client, candidate.address, candidate.label);
    results.push(result);
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Comparison table
  console.log("\n\n" + "=".repeat(70));
  console.log("📊 COMPARISON TABLE");
  console.log("=".repeat(70));

  console.log("\n| Metric | Bz2yexdH | Bra1HUNK |");
  console.log("|--------|----------|----------|");
  console.log(`| Balance | ${results[0].balance.toFixed(2)} SOL | ${results[1].balance.toFixed(2)} SOL |`);
  console.log(`| First Funder is 37X/v49j | ${results[0].connectedToChain ? "✅ YES" : "❌ NO"} | ${results[1].connectedToChain ? "✅ YES" : "❌ NO"} |`);
  console.log(`| Interacted with 37X | ${results[0].interactedWith37x ? "✅" : "❌"} | ${results[1].interactedWith37x ? "✅" : "❌"} |`);
  console.log(`| Interacted with v49j | ${results[0].interactedWithV49j ? "✅" : "❌"} | ${results[1].interactedWithV49j ? "✅" : "❌"} |`);
  console.log(`| Transaction Count | ${results[0].txCount} | ${results[1].txCount} |`);
  console.log(`| Has Pump.fun Activity | ${results[0].hasPumpFun ? "⚠️ YES" : "✅ NO"} | ${results[1].hasPumpFun ? "⚠️ YES" : "✅ NO"} |`);

  // Scoring
  console.log("\n\n" + "=".repeat(70));
  console.log("🎯 DEPLOYER LIKELIHOOD SCORE");
  console.log("=".repeat(70));

  for (const r of results) {
    let score = 0;
    const reasons: string[] = [];

    // Balance in deployment range (5-15 SOL)
    if (r.balance >= 5 && r.balance <= 15) {
      score += 25;
      reasons.push(`+25: Balance in deployment range (${r.balance.toFixed(2)} SOL)`);
    }

    // Connected to 37X/v49j chain (First Funder)
    if (r.connectedToChain) {
      score += 35;
      reasons.push("+35: First Funder is 37Xxihfs or v49j");
    }

    // Interacted with both 37X and v49j
    if (r.interactedWith37x && r.interactedWithV49j) {
      score += 20;
      reasons.push("+20: Funded by BOTH 37Xxihfs and v49j");
    } else if (r.interactedWith37x || r.interactedWithV49j) {
      score += 10;
      reasons.push("+10: Interacted with 37Xxihfs OR v49j");
    }

    // Fresh wallet (low tx count)
    if (r.txCount <= 10) {
      score += 15;
      reasons.push(`+15: Fresh wallet (${r.txCount} transactions)`);
    }

    // No pump.fun activity yet
    if (!r.hasPumpFun) {
      score += 5;
      reasons.push("+5: No pump.fun deployments yet");
    } else {
      score -= 20;
      reasons.push("-20: Already has pump.fun activity");
    }

    console.log(`\n${r.label}: ${score}/100`);
    for (const reason of reasons) {
      console.log(`  ${reason}`);
    }
  }

  console.log("\n\n" + "=".repeat(70));
  console.log("📋 VERDICT");
  console.log("=".repeat(70));

  const [bz2y, bra1] = results;

  if (bz2y.connectedToChain && !bra1.connectedToChain) {
    console.log("\n🎯 Bz2yexdH is MORE LIKELY the deployer");
    console.log("   Reason: First Funder is 37Xxihfs (matches deployer chain)");
    console.log("   Bra1HUNK's First Funder is NOT connected to 37X/v49j");
  } else if (!bz2y.connectedToChain && bra1.connectedToChain) {
    console.log("\n🎯 Bra1HUNK is MORE LIKELY the deployer");
  } else {
    console.log("\n⚠️ Both wallets need further investigation");
  }
}

main().catch(console.error);
