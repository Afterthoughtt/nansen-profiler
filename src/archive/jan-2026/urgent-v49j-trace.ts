import { NansenClient } from "./nansen-client.js";

const client = new NansenClient();
const v49j = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

async function traceV49jOutbound() {
  console.log("=== 🚨 URGENT: V49J SOL TRANSFER TRACE ===\n");
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Get transactions from the last 3 days
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  console.log("Fetching v49j transactions (last 3 days)...\n");

  const txns = await client.getTransactions(v49j, "solana", {
    from: threeDaysAgo.toISOString(),
    to: now.toISOString()
  });

  if (!txns.data || txns.data.length === 0) {
    console.log("No transactions found!");
    return;
  }

  console.log(`Found ${txns.data.length} transactions\n`);

  // Find all SOL transfers
  const solTransfers: any[] = [];

  for (const tx of txns.data) {
    const solSent = tx.tokens_sent?.find((t: any) => t.token_symbol === "SOL");
    const solReceived = tx.tokens_received?.find((t: any) => t.token_symbol === "SOL");

    if (solSent && parseFloat(solSent.token_amount) > 0.1) {
      solTransfers.push({
        time: tx.block_timestamp,
        type: "SENT",
        amount: solSent.token_amount,
        to: solSent.to_address || "unknown",
        hash: tx.transaction_hash
      });
    }

    if (solReceived && parseFloat(solReceived.token_amount) > 0.1) {
      solTransfers.push({
        time: tx.block_timestamp,
        type: "RECEIVED",
        amount: solReceived.token_amount,
        from: solReceived.from_address || "unknown",
        hash: tx.transaction_hash
      });
    }
  }

  console.log("=== SOL TRANSFERS > 0.1 SOL ===\n");

  // Sort by time, most recent first
  solTransfers.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  for (const transfer of solTransfers) {
    console.log(`${transfer.time}`);
    console.log(`  Type: ${transfer.type}`);
    console.log(`  Amount: ${transfer.amount} SOL`);
    if (transfer.type === "SENT") {
      console.log(`  To: ${transfer.to}`);
    } else {
      console.log(`  From: ${transfer.from}`);
    }
    console.log(`  Hash: ${transfer.hash}`);
    console.log("");
  }

  // Find the big outbound transfer
  const bigOutbound = solTransfers.find(t => t.type === "SENT" && parseFloat(t.amount) > 5);

  if (bigOutbound) {
    console.log("=== 🎯 DEPLOYER CANDIDATE FOUND ===\n");
    console.log(`Recipient: ${bigOutbound.to}`);
    console.log(`Amount: ${bigOutbound.amount} SOL`);
    console.log(`Time: ${bigOutbound.time}`);
    console.log(`Hash: ${bigOutbound.hash}`);

    // Now check the recipient
    console.log("\n=== INVESTIGATING RECIPIENT ===\n");

    await new Promise(r => setTimeout(r, 2000));

    // Get recipient balance
    const recipientBalance = await client.getCurrentBalance(bigOutbound.to, "solana");
    const recipientSol = recipientBalance.data?.find((t: any) => t.token_symbol === "SOL");
    console.log(`Recipient SOL Balance: ${recipientSol?.token_amount || 0}`);

    await new Promise(r => setTimeout(r, 2000));

    // Get recipient's First Funder
    const relatedWallets = await client.getRelatedWallets(bigOutbound.to, "solana");
    const firstFunder = relatedWallets.data?.find((r: any) => r.relation === "first_funder");

    if (firstFunder) {
      console.log(`\n🔑 FIRST FUNDER: ${firstFunder.address}`);
      console.log(`   Label: ${firstFunder.address_label || "Unknown"}`);

      // Check if First Funder is in our chain
      const chainWallets = [
        "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
        "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
        "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF"
      ];

      if (chainWallets.includes(firstFunder.address)) {
        console.log("\n✅ CONFIRMED: First Funder is in our deployer chain!");
        console.log("🚨 THIS IS THE DEPLOYER WALLET");
      } else {
        console.log("\n⚠️  First Funder is NOT in known chain - needs investigation");
      }
    }

    // Get recipient transaction count
    await new Promise(r => setTimeout(r, 2000));
    const recipientTxns = await client.getTransactions(bigOutbound.to, "solana", {
      from: threeDaysAgo.toISOString(),
      to: now.toISOString()
    });
    console.log(`\nRecipient transaction count (3 days): ${recipientTxns.data?.length || 0}`);

  } else {
    console.log("⚠️  No large outbound SOL transfer found (>5 SOL)");
    console.log("The SOL may have been sent in smaller amounts or to multiple recipients.");
  }
}

traceV49jOutbound().catch(console.error);
