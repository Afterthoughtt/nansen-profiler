import { NansenClient } from "./nansen-client.js";
import { DATES } from "./config/dates.js";

const client = new NansenClient();
const v49j = "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5";

async function checkV49jCounterparties() {
  console.log("=== 🚨 V49J COUNTERPARTY CHECK ===\n");
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Use 30-day window
  const dateRange = DATES.RECENT_30D;
  console.log(`Date range: ${dateRange.from} to ${dateRange.to}\n`);

  try {
    const counterparties = await client.getCounterparties(v49j, "solana", dateRange);

    if (!counterparties.data || counterparties.data.length === 0) {
      console.log("No counterparties found!");
      return;
    }

    console.log(`Found ${counterparties.data.length} counterparties\n`);

    // Sort by volume out (to find where v49j sent SOL)
    const sortedByOut = [...counterparties.data]
      .filter((c: any) => parseFloat(c.volume_out_usd || "0") > 100)
      .sort((a: any, b: any) => parseFloat(b.volume_out_usd || "0") - parseFloat(a.volume_out_usd || "0"));

    console.log("=== TOP RECIPIENTS (v49j sent TO these) ===\n");

    for (const cp of sortedByOut.slice(0, 15)) {
      console.log(`${cp.counterparty_address?.slice(0, 8)}...`);
      console.log(`  Label: ${cp.counterparty_address_label || "Unknown"}`);
      console.log(`  Volume OUT: $${parseFloat(cp.volume_out_usd || "0").toFixed(2)}`);
      console.log(`  Interactions: ${cp.interaction_count}`);

      // Show token info if available
      if (cp.tokens_info && cp.tokens_info.length > 0) {
        const solTransfer = cp.tokens_info.find((t: any) => t.token_symbol === "SOL");
        if (solTransfer) {
          console.log(`  SOL sent: ${solTransfer.volume_out || "0"}`);
        }
      }
      console.log("");
    }

    // Find fresh wallet candidates (high volume out, low interactions, no label)
    console.log("=== 🎯 FRESH WALLET CANDIDATES ===\n");

    const freshCandidates = sortedByOut.filter((cp: any) =>
      !cp.counterparty_address_label &&
      parseInt(cp.interaction_count || "0") <= 5 &&
      parseFloat(cp.volume_out_usd || "0") > 500
    );

    if (freshCandidates.length === 0) {
      console.log("No obvious fresh wallet candidates found.\n");
      console.log("Checking ALL unlabeled recipients...\n");

      const unlabeled = sortedByOut.filter((cp: any) => !cp.counterparty_address_label);
      for (const cp of unlabeled.slice(0, 10)) {
        console.log(`${cp.counterparty_address}`);
        console.log(`  Volume OUT: $${parseFloat(cp.volume_out_usd || "0").toFixed(2)}`);
        console.log(`  Interactions: ${cp.interaction_count}`);
        console.log("");
      }
    } else {
      for (const cp of freshCandidates) {
        console.log(`🎯 ${cp.counterparty_address}`);
        console.log(`   Volume OUT: $${parseFloat(cp.volume_out_usd || "0").toFixed(2)}`);
        console.log(`   Interactions: ${cp.interaction_count}`);
        console.log("");
      }
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

checkV49jCounterparties().catch(console.error);
