/**
 * Compare sniper performance across launches
 */
import * as fs from "fs";

const data = JSON.parse(fs.readFileSync("data/analysis/early-buyers-all-tokens.json", "utf-8"));

const WALLETS = [
  { short: "9J9VHoLW", address: "9J9VHoLWgTRxuc6DtNYxRMi2jVqAFAPshUSMeWQ7wz3Y" },
  { short: "6yjqK7VW", address: "6yjqK7VWTiDFN2gfyLDTde63jCUmqZcp16SCgq9bNjov" },
  { short: "JAfv6AiN", address: "JAfv6AiNzsAbGzvsSNpJz4qXvc3xuybDTxB9y3uLcxeG" },
];

const tokens = ["ARKXRP", "DOGWIFXRP", "WFXRP", "XRPEP3", "TROLLXRP", "RXRP"];

console.log("\n" + "=".repeat(70));
console.log("  SNIPER COMPARISON: Buy Speed & Consistency");
console.log("=".repeat(70));

for (const wallet of WALLETS) {
  console.log(`\n📍 ${wallet.short}`);
  console.log(`   ${wallet.address}`);
  console.log("");

  let appearances = 0;
  const buyTimes: string[] = [];

  for (const token of tokens) {
    const buyers = data[token] || [];

    // Find first buy timestamp for reference
    const firstBuy = buyers[0]?.timestamp;
    if (!firstBuy) continue;

    const firstBuyTime = new Date(firstBuy).getTime();

    // Find this wallet's buy
    const walletBuy = buyers.find((b: any) => b.wallet === wallet.address);

    if (walletBuy) {
      appearances++;
      const walletBuyTime = new Date(walletBuy.timestamp).getTime();
      const delayMs = walletBuyTime - firstBuyTime;
      const delayStr = delayMs === 0 ? "SAME SECOND" : `+${(delayMs / 1000).toFixed(1)}s`;

      // Find position in buy order
      const position = buyers.findIndex((b: any) => b.wallet === wallet.address) + 1;

      console.log(`   ${token.padEnd(12)} | Position: #${position.toString().padStart(2)} | Delay: ${delayStr.padStart(12)} | Amount: ${walletBuy.amount.toLocaleString()}`);
      buyTimes.push(delayStr);
    }
  }

  console.log(`\n   SUMMARY: Appeared in ${appearances}/6 launches`);
  if (appearances > 0) {
    console.log(`   Buy delays: ${buyTimes.join(", ")}`);
  }
}

// Verdict
console.log("\n" + "=".repeat(70));
console.log("  RECOMMENDATION");
console.log("=".repeat(70));
console.log(`
  9J9VHoLW - BEST CHOICE
  - Appeared in 4/6 launches (most consistent)
  - Always buys in first 1-2 seconds
  - High volume buyer
  - Part of BDVg/CHOCO network (Crypto.com funded)

  6yjqK7VW & JAfv6AiN - Only appeared in RXRP
  - Less history to judge
  - Same network as 9J9VHoLW

  FOLLOW: 9J9VHoLWgTRxuc6DtNYxRMi2jVqAFAPshUSMeWQ7wz3Y
`);
