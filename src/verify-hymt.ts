import { NansenClient } from "./nansen-client.js";

const client = new NansenClient();
const CANDIDATE = "HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG";

async function verifyDeployerCandidate() {
  console.log("=== 🎯 DEPLOYER CANDIDATE VERIFICATION ===\n");
  console.log(`Wallet: ${CANDIDATE}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // 1. Check balance
  console.log("1. BALANCE CHECK:");
  try {
    const balance = await client.getCurrentBalance(CANDIDATE, "solana");
    const sol = balance.data?.find((t: any) => t.token_symbol === "SOL");
    console.log(`   SOL: ${sol?.token_amount || 0}`);

    if (sol && parseFloat(sol.token_amount) > 5) {
      console.log(`   ✅ FUNDED: Has ${sol.token_amount} SOL`);
    } else if (sol && parseFloat(sol.token_amount) > 0) {
      console.log(`   ⚠️ Has some SOL but less than expected`);
    } else {
      console.log(`   ❌ No SOL balance`);
    }

    // Show other tokens
    const otherTokens = balance.data?.filter((t: any) => t.token_symbol !== "SOL") || [];
    if (otherTokens.length > 0) {
      console.log(`\n   Other tokens:`);
      for (const token of otherTokens.slice(0, 5)) {
        console.log(`   - ${token.token_symbol}: ${token.token_amount}`);
      }
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 2. Check First Funder
  console.log("\n2. FIRST FUNDER CHECK:");
  try {
    const related = await client.getRelatedWallets(CANDIDATE, "solana");
    const firstFunder = related.data?.find((r: any) => r.relation === "first_funder");

    if (firstFunder) {
      console.log(`   First Funder: ${firstFunder.address}`);
      console.log(`   Label: ${firstFunder.address_label || "Unknown"}`);

      // Check if in our chain
      const chainWallets = [
        "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
        "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
        "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF"
      ];

      if (chainWallets.includes(firstFunder.address)) {
        console.log(`\n   ✅ CONFIRMED: First Funder is in deployer chain!`);

        if (firstFunder.address === "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5") {
          console.log(`   🚨 FIRST FUNDER IS v49j - THIS IS THE DEPLOYER!`);
        } else if (firstFunder.address === "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2") {
          console.log(`   🚨 FIRST FUNDER IS 37Xxihfs - THIS IS THE DEPLOYER!`);
        }
      } else {
        console.log(`   ⚠️ First Funder NOT in known chain`);
      }
    } else {
      console.log(`   No first funder data found`);
    }

    // Show other relations
    const otherRelations = related.data?.filter((r: any) => r.relation !== "first_funder") || [];
    if (otherRelations.length > 0) {
      console.log(`\n   Other relations:`);
      for (const rel of otherRelations.slice(0, 3)) {
        console.log(`   - ${rel.relation}: ${rel.address?.slice(0, 12)}... (${rel.address_label || "Unknown"})`);
      }
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 3. Check if has deployed any tokens
  console.log("\n3. DEPLOYMENT CHECK:");
  try {
    const related = await client.getRelatedWallets(CANDIDATE, "solana");
    const deployments = related.data?.filter((r: any) =>
      r.relation === "contract_creator" || r.relation === "deployed_contract"
    ) || [];

    if (deployments.length > 0) {
      console.log(`   🚨 HAS DEPLOYED ${deployments.length} CONTRACT(S)!`);
      for (const dep of deployments) {
        console.log(`   - ${dep.address} (${dep.address_label || "Unknown"})`);
      }
    } else {
      console.log(`   No deployments yet - wallet is waiting`);
    }
  } catch (error) {
    console.log(`   Error checking deployments: ${error}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("SUMMARY");
  console.log("=".repeat(50));
  console.log(`\nCandidate: ${CANDIDATE}`);
  console.log(`\nThis wallet should be monitored for pump.fun deployment activity.`);
  console.log(`\nExpected deployment window: 10 AM - 12 PM Pacific (Sunday Jan 18)`);
}

verifyDeployerCandidate().catch(console.error);
