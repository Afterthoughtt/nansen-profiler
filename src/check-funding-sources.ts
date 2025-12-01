import "dotenv/config";
import { NansenClient } from "./nansen-client.js";

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not set");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);

  // These are the wallets that funded 37Xxihfs today (from MASTER_REPORT)
  const fundingSources = [
    { address: "A77HErqtfN1hAXWE8pYXLLmRCwdmEU9p4F6Wq5aRxiP1", note: "Funded 37X 2.994 SOL at 05:49" },
    { address: "FSbvLdrK1FuWJxKDwPeHxWYZL8ib5xZLxxNv7fQk8g9E", note: "Funded 37X 2.0 SOL at 09:15" },
    { address: "HVRcXaCFyUFGzQkA8aPd4pKAJmz5t93Q2zHxEnDHPAMi", note: "Funded 37X 0.85 SOL at 09:44" },
  ];

  console.log("🔍 CHECKING 37Xxihfs FUNDING SOURCES");
  console.log("=".repeat(60));
  console.log("These wallets funded 37Xxihfs today - checking their outbound\n");

  const allRecipients: Array<{
    recipient: string;
    amount: number;
    fundedBy: string;
    timestamp: string;
  }> = [];

  for (const source of fundingSources) {
    console.log("\n" + "-".repeat(60));
    console.log("Wallet: " + source.address.slice(0, 16) + "...");
    console.log("Note: " + source.note);

    try {
      // Get current balance
      const balances = await client.getCurrentBalance({
        address: source.address,
        chain: "solana",
      });
      const sol = balances.find((b) => b.token_symbol === "SOL");
      console.log("Current Balance: " + (sol?.token_amount?.toFixed(4) || "0") + " SOL");

      await new Promise((r) => setTimeout(r, 1500));

      // Get recent transactions
      const txResp = await client.getTransactions({
        address: source.address,
        chain: "solana",
        date: { from: "2025-11-28", to: "2025-11-30" },
        pagination: { page: 1, per_page: 50 },
      });

      console.log("Transactions (Nov 28-30): " + (txResp.data?.length || 0));

      // Find SOL recipients (excluding 37Xxihfs since we know about that)
      const TARGET_37X = "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2";

      for (const tx of txResp.data || []) {
        if (!tx.tokens_sent) continue;
        for (const sent of tx.tokens_sent) {
          if (sent.token_symbol === "SOL" && sent.to_address && sent.to_address !== source.address) {
            const amount = sent.token_amount || 0;
            const recipient = sent.to_address;

            if (recipient === TARGET_37X) {
              console.log(`  → ${recipient.slice(0, 12)}... (${amount.toFixed(4)} SOL) [37Xxihfs - KNOWN]`);
            } else {
              console.log(`  → ${recipient.slice(0, 12)}... (${amount.toFixed(4)} SOL) [OTHER - INVESTIGATE]`);
              allRecipients.push({
                recipient,
                amount,
                fundedBy: source.address,
                timestamp: tx.block_timestamp,
              });
            }
          }
        }
      }
    } catch (e: any) {
      console.log("Error: " + e.message);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  // Investigate any OTHER recipients (not 37Xxihfs)
  if (allRecipients.length > 0) {
    console.log("\n\n🎯 INVESTIGATING OTHER RECIPIENTS");
    console.log("=".repeat(60));

    for (const r of allRecipients) {
      console.log(`\n${r.recipient}`);
      console.log(`  Received: ${r.amount.toFixed(4)} SOL at ${r.timestamp}`);

      await new Promise((res) => setTimeout(res, 1500));

      // Get First Funder
      try {
        const related = await client.getRelatedWallets({
          address: r.recipient,
          chain: "solana",
          pagination: { page: 1, per_page: 20 },
        });
        const ff = related.find((w) => w.relation === "First Funder");
        console.log(`  First Funder: ${ff?.address?.slice(0, 16) || "Unknown"}... ${ff?.address_label ? `(${ff.address_label})` : ""}`);
      } catch (e) {
        console.log("  First Funder: Error");
      }

      await new Promise((res) => setTimeout(res, 1500));

      // Get current balance
      try {
        const balances = await client.getCurrentBalance({
          address: r.recipient,
          chain: "solana",
        });
        const sol = balances.find((b) => b.token_symbol === "SOL");
        console.log(`  Current Balance: ${sol?.token_amount?.toFixed(4) || "0"} SOL`);

        if ((sol?.token_amount || 0) >= 5) {
          console.log("  🚨 HIGH PRIORITY - Has 5+ SOL!");
        }
      } catch (e) {
        console.log("  Current Balance: Error");
      }
    }
  } else {
    console.log("\n\nNo OTHER recipients found (only 37Xxihfs)");
    console.log("The funding sources only sent SOL to 37Xxihfs");
  }

  console.log("\n\n📊 CONCLUSION");
  console.log("=".repeat(60));
  console.log("If no fresh wallet candidates found from funding sources,");
  console.log("the fresh wallet is either:");
  console.log("  1. Not funded yet (monitor for new transfers)");
  console.log("  2. Funded via a completely different path");
  console.log("  3. They ARE using 37Xxihfs directly (they lied)");
}

main().catch(console.error);
