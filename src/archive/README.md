# Archive Pattern Index

Quick reference for reusable algorithms and patterns in archived investigation scripts.

---

## Bot Detection

**File:** `check-insider-bot.ts` (lines 76-92)

Identify bot wallets based on activity metrics:

```typescript
// Thresholds
const isHighFrequency = txnArray.length > 50;  // >50 txns = bot
const manyCounterparties = cpArray.length > 30; // >30 counterparties = bot
const manyTokens = tokenCount > 20;            // >20 token types = bot

// Activity pattern
const avgTxPerDay = txnArray.length / uniqueDates.size;
if (avgTxPerDay > 20) // HIGH FREQUENCY - likely a bot
if (avgTxPerDay > 5)  // MODERATE - could be bot or active trader
else                  // LOW - likely manual trading
```

**Use case:** Filter out bots from insider analysis.

---

## Connection Scoring

**File:** `investigate-h3qsndfc.ts` (lines 132-195)

Score wallet connections to the deployer chain:

```typescript
// Scoring system (out of 100):
// - Funding chain includes chain wallet: +40 per level
// - Chain wallet in counterparties: +20 per counterparty
// - Funded via Coinbase (same origin): +15
// - Deployer-related labels: +10

// Assessment thresholds:
if (score >= 60) → "CONNECTED - High confidence link"
if (score >= 30) → "POSSIBLY CONNECTED - Some overlap"
if (score >= 10) → "WEAK CONNECTION - Minor overlap"
else            → "INDEPENDENT - No chain connection"
```

**Use case:** Determine if an insider is actually connected to the deployer.

---

## Risk Tiers

**File:** `sleeper-inventory.ts` (lines 84-93)

Categorize sleeper wallets by risk level:

```typescript
function assessRisk(wallet): "HIGH" | "MEDIUM" | "LOW" | "DORMANT" {
  if (wallet.isKnownDeployer) return "HIGH";
  if (wallet.balanceSOL >= 5) return "HIGH";   // Enough for deployment
  if (wallet.balanceSOL >= 1) return "MEDIUM"; // Could be topped up
  if (wallet.balanceSOL >= 0.01) return "LOW"; // Has some funds
  return "DORMANT";                            // Essentially empty
}
```

**Use case:** Prioritize which sleeper wallets to monitor.

---

## Buyer Categorization

**File:** `rxrp-early-buyers.ts` (lines 44-57)

Categorize early buyers:

```typescript
type BuyerCategory = "USER" | "INSIDER" | "WHALE" | "BOT" | "CONNECTED" | "UNKNOWN";

// Decision tree:
// 1. If in KNOWN_USER_WALLETS → "USER"
// 2. If in KNOWN_INSIDERS → "INSIDER"
// 3. If in DEPLOYER_CHAIN → "CONNECTED"
// 4. If First Funder is Coinbase → "CONNECTED"
// 5. If high volume (>$50k) → "WHALE"
// 6. Else → "UNKNOWN"
```

**Use case:** Classify buyers in early trading analysis.

---

## Funding Chain Tracing

**File:** `investigate-fsbvldrk.ts` (lines 42-85)

Recursive First Funder lookup up to N levels:

```typescript
async function traceFundingChain(address: string, maxDepth: number = 4): Promise<FundingLevel[]> {
  const chain: FundingLevel[] = [];
  let current = address;

  for (let depth = 0; depth < maxDepth; depth++) {
    const related = await client.getRelatedWallets({ address: current, chain: "solana" });
    const firstFunder = related.find((r) => r.relation === "First Funder");

    chain.push({
      address: current,
      firstFunder: firstFunder?.address,
      isDeployerChain: DEPLOYER_CHAIN.has(current),
      isCoinbase: COINBASE_WALLETS.has(current),
    });

    // Stop if we find a chain connection
    if (isDeployerChain || isCoinbase) break;
    if (!firstFunder?.address) break;

    current = firstFunder.address;
    await delay(2000); // Rate limiting
  }
  return chain;
}
```

**Use case:** Trace wallet origins to find deployer connections.

---

## Cross-Launch Analysis

**File:** `rxrp-early-buyers.ts` (pattern throughout)

Set-based intersection across multiple token buyer lists:

```typescript
// Get early buyers from each token
const xrpep3Buyers = new Set(getEarlyBuyers("XRPEP3"));
const trollxrpBuyers = new Set(getEarlyBuyers("TROLLXRP"));
const rxrpBuyers = new Set(getEarlyBuyers("RXRP"));

// Find wallets that bought multiple tokens
const crossTokenInsiders = [...xrpep3Buyers].filter(
  (w) => trollxrpBuyers.has(w) || rxrpBuyers.has(w)
);

// Score by how many tokens they bought
const score = [xrpep3Buyers, trollxrpBuyers, rxrpBuyers]
  .filter((set) => set.has(wallet)).length;
```

**Use case:** Identify insiders who consistently buy early across launches.

---

## Counterparty Analysis Pattern

**File:** `investigate-h3qsndfc.ts` (lines 101-130)

Filter and rank counterparties by significance:

```typescript
const counterparties = await client.getCounterparties({
  address,
  chain: "solana",
  date: DATES.FULL_HISTORY,
});

// Filter noise, rank by volume
const significant = counterparties
  .filter((c) => c.total_volume_usd > 50) // Filter low-value noise
  .map((c) => ({
    address: c.counterparty_address,
    volume_usd: c.total_volume_usd,
    direction: c.volume_in_usd > c.volume_out_usd * 2 ? "in"
             : c.volume_out_usd > c.volume_in_usd * 2 ? "out"
             : "both",
  }))
  .sort((a, b) => b.volume_usd - a.volume_usd)
  .slice(0, 20);
```

**Use case:** Find meaningful relationships while filtering noise.

---

## Rate Limiting Pattern

Used consistently across all scripts:

```typescript
import { delay } from "./utils.js";

// Between API calls (1.5-2s recommended)
await delay(1500);

// After batch processing
if (checked >= 20) {
  console.log("(Stopping at 20 checks to conserve API credits)");
  break;
}
```

**Use case:** Avoid hitting API rate limits while investigating.

---

## Additional Archived Scripts

| Directory | Contents |
|-----------|----------|
| `jan-2026/` | January 2026 investigation scripts (HYMt confirmation, token creation analysis) |
| Root files | Core investigation patterns, deployer counterparties, sleeper inventory |

---

## Related Active Scripts

These patterns have been consolidated into the main `src/` scripts:

| Archive Pattern | Now In |
|-----------------|--------|
| Bot detection | `insider-detect.ts --bot-filter` |
| Cross-token analysis | `insider-detect.ts --mode position` |
| Time-window analysis | `insider-detect.ts --mode time` |
| Funding chain trace | `insider-detect.ts --funding-check` |
| Risk assessment | `timing-analysis.ts --predict` |

---

*Last updated: January 2026*
