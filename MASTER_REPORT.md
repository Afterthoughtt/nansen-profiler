# Nansen Profiler - Pump.fun Deployer Investigation

**Last Updated**: January 3, 2026 21:55 UTC
**Status**: ✅ **SUCCESS** - Deployer Correctly Identified (Nov 30)
**Result**: Bz2yexdH deployed RainXRP as predicted
**Next Target**: January 2026 launch (announcement Jan 10)

---

## ✅ NOVEMBER 30, 2025 - SUCCESSFUL PREDICTION

### Deployer Wallet (CONFIRMED)

```
Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y
```

| Property | Value |
|----------|-------|
| **Outcome** | ✅ **DEPLOYED** |
| **Balance at Detection** | 14.54 SOL ($1,995) |
| **First Funder** | 37Xxihfs ✅ |
| **Also Funded By** | v49j ✅ |
| **Created** | Nov 30, 2025 ~19:02 UTC |

### Funding Timeline (Nov 30, 2025)

| Time (UTC) | Amount | From | Label |
|------------|--------|------|-------|
| 19:02:41 | **8.85 SOL** | 37Xxihfs | DogwifXRP Token Deployer |
| 19:02:54 | **2.80 SOL** | v49j | BloomBot Trading Bot User |
| 20:33:00 | **2.89 SOL** | HVRcXaCF... | Intermediary |

### Why We Correctly Identified This Deployer

1. ✅ **First Funder was 37Xxihfs** (original deployer)
2. ✅ **Also funded by v49j** (confirmed funder for D7Ms/DBmx)
3. ✅ **Both deployer chain wallets contributed** - strongest signal
4. ✅ **Balance matched pattern** (14.54 SOL > historical 8-10 SOL)
5. ✅ **Fresh wallet with minimal transactions** - deployer signature

---

## Previous Status (Now Outdated)

### 37Xxihfs Status (Before Fresh Wallet Discovery)

| Metric | Value |
|--------|-------|
| **Current Balance** | **8.94 SOL** → Now depleted (sent to Bz2yexdH) |
| **Historical Dev Buys** | XRPEPE: 8.09 SOL, TrollXRP: 9.87 SOL |
| **Outbound Transfers** | ✅ 8.85 SOL sent to Bz2yexdH at 19:02 UTC |

### Wallet Status Comparison (Updated Nov 30, 22:20 UTC)

| Wallet | Balance | Role |
|--------|---------|------|
| **Bz2yexdH** | **14.54 SOL** | 🎯 **FRESH DEPLOYER** |
| 37Xxihfs | 0.09 SOL | Funder (depleted) |
| v49j | 0.04 SOL | Funder (depleted) |
| GUCX6xNe | 0.015 SOL | Pre-funded (not used) |
| DBmx | 0.008 SOL | Old deployer |
| D7Ms | 0.012 SOL | Old deployer |

### Bra1HUNK Investigation (Nov 30, 2025)

**Result**: NOT connected to our chain

| Property | Value |
|----------|-------|
| Address | `Bra1HUNKj1tcM3iKnL3pHc2m1rXkXZ9JELq4ceivag34` |
| Balance | 6.99 SOL |
| First Funder | `5g7yNHyGLJ...` ($1.87M whale) |
| Funding Chain | Amf2mf2C → EPj6VRcq → H8sMJSCQ → 5g7yNHyG |
| Connection to 37Xxihfs | ❌ NONE |

**Verdict**: Bra1HUNK is funded by a completely different chain. Not related to our target deployer.

---

## Executive Summary

This project uses the Nansen Blockchain Profiler API to identify and track the funding patterns of pump.fun token deployers on Solana. The goal is to predict which wallet will deploy the next token by monitoring the funding chain.

**Primary Target Wallet** (UPDATED):
```
37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2
```
*(Previously v49j - now monitoring 37Xxihfs directly as it's funded)*

**Confidence Level**: 95% (37Xxihfs funded with dev-buy-sized balance)

---

## Confirmed Funding Chain

```
Coinbase Hot Wallet (FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q)
  ↓ 0.1 SOL (June 14, 2025)
ROOT (9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF) - DORMANT since Jun 15
  ↓ 0.077 SOL
LEVEL 1 / Primary Funder (v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5)
  ↓
Fresh Deployer Wallet
  ↓
pump.fun Token Deployment
```

**Chain Verified**: Nov 30, 2025 via Nansen First Funder API

---

## Verified Deployers

| Deployer | Token | Token Address | Launch Date | First Funder |
|----------|-------|---------------|-------------|--------------|
| `D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb` | XRPEP3 | `5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump` | Sep 28, 2025 | v49j ✅ |
| `DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy` | TrollXRP | `CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump` | Nov 2, 2025 | v49j ✅ |
| `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | Original | Multiple | 2024-2025 | Coinbase |

**Note**: DBmx was reused on Nov 23, 2025 for RizzmasCTO and RizzmasRug tokens.

## Key Wallet Addresses (Full Reference)

| Role | Address | Status |
|------|---------|--------|
| **PRIMARY FUNDER (v49j)** | `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | Active |
| **ROOT** | `9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF` | Dormant (since Jun 2025) |
| **Coinbase Hot Wallet** | `GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE` | Active (CEX fallback) |
| **ROOT's Funder** | `FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q` | Coinbase |

---

## Timing Pattern

Based on TrollXRP launch (Nov 2, 2025):

| Event | Timestamp (UTC) | Pacific Time |
|-------|-----------------|--------------|
| v49j funds deployer | 16:55:07 | 8:55 AM PST |
| Token deployment | 19:28:36 | 11:28 AM PST |
| **Time delta** | **156 minutes** | **2.6 hours** |

**Historical Launch Times (Pacific)**:
- XRPEP3 (Sep 28): 10:51 AM
- TrollXRP (Nov 2): 11:28 AM

**Expected Window**: 10 AM - 12 PM Pacific on Sundays

---

## Critical Findings (Nov 29, 2025 Session)

### What We Verified

1. **v49j IS the confirmed First Funder** for both fresh deployers (D7Ms and DBmx)
2. **Funding chain is consistent**: ROOT → v49j → Deployer
3. **Time between funding and deployment**: ~2.5 hours (not days as previously thought)

### Critical Correction

The Nov 29 analysis initially identified 27 "fresh wallet candidates" funded by v49j in November. **This was incorrect.**

Upon verification:
- These wallets received **USDC/token transfers**, NOT SOL funding
- Their **First Funder is NOT v49j** - they were funded by other wallets
- They are **NOT deployer candidates**

**Lesson**: Always verify "First Funder" relationship via Nansen API, don't rely on transaction history alone.

### Current State (as of Nov 29)

- **v49j has NOT funded any new deployer wallet** in the past 2 weeks
- **DBmx (existing deployer)** was last active Nov 24, 2025
- The deployer for Nov 30 either:
  1. Will be funded by v49j today/tonight (watch for SOL outbound)
  2. Is DBmx (they may reuse the existing deployer)

---

## Deep Verification Findings (Nov 30, 2025 Session)

### What We Verified

1. **ROOT → v49j First Funder relationship CONFIRMED**
   - v49j's First Funder IS ROOT (9Z83ZAtd...)
   - ROOT's First Funder IS Coinbase (FpwQQhQQ...)

2. **All wallets v49j is First Funder for** (5 total):
   | Wallet | Status | Balance | Deployed Tokens? |
   |--------|--------|---------|------------------|
   | `DBmxMiP8...` | KNOWN DEPLOYER | 0.008 SOL | Yes |
   | `BdtGEty8...` | Trading bot wallet | 5.9 SOL | No |
   | `3xHtXHxy...` | Unknown | 0.0009 SOL | No |
   | `D3Jw99nJ...` | Fresh | 0.001 SOL | No |
   | `GUCX6xNe...` | Fresh | 0.015 SOL | No |

3. **6 ROOT-funded wallets investigated** - All LOW risk (dust balance, inactive)

4. **No high-risk alternative LEVEL 1 wallets found**

### ROOT Wallet Investigation

ROOT is NOT an exchange. It's a one-time intermediary "hop" wallet:
- Received 0.1 SOL from Coinbase on June 14, 2025
- Distributed funds to v49j and created dust accounts
- **DORMANT since June 15, 2025** (only 0.003 SOL remaining)
- Only 16 total transactions ever

### BdtGEty8 Investigation (5.9 SOL wallet)

Despite having significant balance and v49j as First Funder:
- **NOT a deployer** - Has never deployed tokens
- **Trading bot wallet** - All counterparties labeled "BloomBot Trading Bot User"
- **DORMANT since July 2025**
- Received millions of "JRVSLK" tokens (airdrops/rewards)

### Nansen Labels Discovered

| Wallet | Label |
|--------|-------|
| v49j | "BloomBot Trading Bot User" |
| FpwQQhQQ (ROOT's funder) | "Coinbase: Hot Wallet" |
| 7gNepQgH | "Pump.fun: (TESTPARK) Bonding Curve" |

### Outstanding Gaps (NOT YET INVESTIGATED)

| Gap | Priority | Notes |
|-----|----------|-------|
| `GUCX6xNe...` | HIGH | Fresh wallet v49j funded, 0.015 SOL |
| `D3Jw99nJ...` | MEDIUM | Fresh wallet v49j funded |
| `3xHtXHxy...` | MEDIUM | v49j funded wallet |
| D7Ms missing from scan | HIGH | Transaction query didn't capture it |
| Original deployer (37Xxihfs) | MEDIUM | Used Coinbase directly, different pattern |
| BloomBot connection | LOW | What is BloomBot? Why is v49j labeled as user? |
| TESTPARK connection | LOW | What is this pump.fun bonding curve? |
| Only 2 data points | HIGH | Pattern based on D7Ms + DBmx only |

### Honest Assessment

**Investigation completeness: ~60-70%**

We verified the main chain but have NOT:
- Exhaustively checked all v49j-funded wallets
- Investigated alternative patterns (original deployer used Coinbase directly)
- Understood the BloomBot / TESTPARK connections
- Ruled out other funding chains from Coinbase

---

## Complete Investigation Findings (Nov 30, 2025 - Session 2)

### 🚨 CRITICAL DISCOVERY: 37Xxihfs is ACTIVE and Connected to v49j

The original deployer (37Xxihfs) was assumed to be dormant. **This was WRONG.**

| Finding | Value | Implication |
|---------|-------|-------------|
| **37Xxihfs sent SOL TO v49j** | Nov 27: 0.1053 SOL | They're the SAME entity! |
| Last activity | Nov 30, 2025 07:34 | Active just hours ago |
| Current balance | 6.09 SOL | Has funds to deploy |
| First Funder | `GJRs4FwH...` (DIFFERENT Coinbase) | Two Coinbase accounts? |
| Transactions since Sep | 50 | Still actively used |

**Key Transaction (Nov 27, 2025)**:
```
37Xxihfs → 0.1053 SOL → v49j
```

This proves:
1. **Same entity controls both wallets** - Money flows bidirectionally
2. **37Xxihfs is NOT dormant** - Active as of today
3. **Alternative deployment path exists** - They could use 37Xxihfs directly

### GUCX6xNe Investigation - HIGH RISK

| Property | Value |
|----------|-------|
| Address | `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` |
| First Funder | v49j ✅ |
| Balance | 0.015 SOL |
| Created | June 25, 2025 |
| Transactions | 1 (only the funding) |
| Has Deployed | No |
| Risk Level | **HIGH** |

**Assessment**: This is a pre-funded deployer wallet. Created before any v49j-chain launches, funded once, never used. Could be activated at any time.

### 3xHtXHxy Investigation - MEDIUM RISK

| Property | Value |
|----------|-------|
| Address | `3xHtXHxyL23nmyJwS1jc7DnQFrtkZvsgSs8qxycvxCwc` |
| First Funder | v49j ✅ |
| Balance | 0.0009 SOL |
| Created | June 25, 2025 |
| Transactions | 50 |
| Last Active | October 23, 2025 |
| Has Deployed | No |
| Risk Level | **MEDIUM** |

**Assessment**: Operational wallet, not a deployer. Many counterparties, active until October. Low balance makes deployment unlikely.

### Insider Wallet Hunt Results (v2 - FIXED)

**Methodology Update**: Previous analysis was broken due to timezone bug. Fixed version uses:
- FIRST TRADE TIME (not deployment time) as reference
- First 5 minutes after trading opens
- All 5 tokens (ArkXRP, DogwifXRP, WFXRP, XRPEP3, TrollXRP)

| Token | Early Buyers | Trades in Window | Gap from Deployment |
|-------|-------------|------------------|---------------------|
| ArkXRP | 40 | 115 | 27.6 min |
| DogwifXRP | 44 | 115 | 29.8 min |
| WFXRP | 80 | 167 | 28.5 min |
| XRPEP3 | 24 | 27 | 14.6 min |
| TrollXRP | 3 | 40 | 18.6 min |

**Total**: 191 early buyers, 185 unique addresses

### 🎯 Cross-Token Insiders Found (5 wallets)

| Address | Tokens | Score | Avg Buy Time | First Funder |
|---------|--------|-------|--------------|--------------|
| `BNmf81tG5ApZ...` | ArkXRP, WFXRP, XRPEP3 | 60% | 51s | **Coinbase** ⚠️ |
| `Eu39U8uecYBj...` | ArkXRP, WFXRP | 40% | 57s | E22uk7U7... |
| `DHTtxjAQ6GvJ...` | DogwifXRP, WFXRP | 40% | 194s | 5VCwKtCX... |
| `BAnk5hYWoUdK...` | WFXRP, XRPEP3 | 40% | 89s | GnWFhrfg... |
| `56S29mZ3wqvw...` | XRPEP3, TrollXRP | 40% | **6s** | Fkq1moif... |

**Critical Finding**:
- **BNmf81tG5ApZ...** is funded by **Coinbase** (`GJRs4FwHtemZ...`) - same wallet that funded 37Xxihfs!
- **56S29mZ3wqvw...** bought BOTH v49j-chain tokens (XRPEP3 + TrollXRP) with avg 6 seconds after first trade - strongest insider signal!

**Insider Watchlist** (backup detection):
- `BNmf81tG5ApZWxVqARFWCiF3ppA8c4gLF8ssgZPKjpz4` - Coinbase-funded, 3 tokens
- ~~`56S29mZ3wqvw8hATuUUFqKhGcSGYFASRRFNT38W8q7G3`~~ - **REMOVED: Confirmed BOT** ($77M+ volume)
- `Eu39U8uecYBj2V4WmCsGADzbDGYQk71NHcPSnHtRCaH3`
- `DHTtxjAQ6GvJqfPz7EPZeUp53PZBXnodTWGbaYXUkQfV`
- `BAnk5hYWoUdKroWLHwRyk1LC33YJEogmQmrPAYd6k54L`

### Insider Detection v3 - First 20 Transactions Analysis

**Methodology Update**: Analyze first 20 BUY transactions (not time-based) + bot filtering.

**XRPEP3 + TrollXRP Cross-Token Buyers** (first 20 txns of BOTH):

| Wallet | XRPEP3 Position | TrollXRP Position | Bot Status |
|--------|-----------------|-------------------|------------|
| `BoBo2S28s9E2...` | #5 | #6 | ❌ BOT ($15.2M volume) |
| `H3qSndFCAyjv...` | #14 | #14 | ✅ Not a bot |
| `Hqf4TZxph6H4...` | #16 | #7 | ✅ Not a bot |

**🎯 VERIFIED INSIDER CANDIDATES (Non-bots)**:
```
Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT (Avg position: #11.5)
H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot (Avg position: #14)
```

These wallets were in the **first 20 buyers of BOTH v49j-chain tokens** and passed all bot filters.

### Early Buyer Deep Dive (Nov 30, 2025)

**Investigated 3 TrollXRP early buyers** with full funding chain trace (3 levels), counterparty analysis, and bot detection.

| Wallet | Position | Verdict | Score | Status | Recommendation |
|--------|----------|---------|-------|--------|----------------|
| `9EqrK8wW...` | TrollXRP #5 | UNKNOWN | 30/100 | 0 SOL, active | Low priority |
| `H3qSndFC...` | Both #14 | **INSIDER** | 60/100 | 2.4 SOL, active | **MONITOR** |
| `Hqf4TZxp...` | XRPEP3 #16, TrollXRP #7 | **INSIDER** | 60/100 | 0.002 SOL, active | **MONITOR** |

**Key Findings:**

1. **H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot**
   - Cross-token buyer (both XRPEP3 + TrollXRP)
   - **STILL ACTIVE** with 2.43 SOL balance
   - First Funder: `BDVgXauNbs7A...` labeled "CHOCO Token Deployer"
   - Total trading volume: $209K
   - No direct connection to v49j/ROOT chain

2. **Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT**
   - Cross-token buyer (both XRPEP3 + TrollXRP)
   - Avg position: #11.5 across both tokens
   - Still active (last tx Nov 3, 2025)
   - Total volume: $10.8K
   - No direct connection to v49j/ROOT chain

3. **9EqrK8wW4JhSRcz8kJKSaiKaYvRfuUuNjYkkZqA7b7UX**
   - Only bought TrollXRP (position #5)
   - Wallet drained (0 SOL)
   - Low volume ($5.2K) - likely retail

**Insider Watchlist (Updated):**
```
H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot (ACTIVE, 2.4 SOL)
Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT (active, low balance)
```

**Note**: Neither insider is connected to the v49j/ROOT/Coinbase deployer chain. They may be independent actors who discovered the launches through other means (Telegram groups, social monitoring, etc.).

### Updated Risk Assessment

| Wallet | Risk | Notes |
|--------|------|-------|
| **v49j** | PRIMARY | Main funder, Telegram bot active |
| **37Xxihfs** | HIGH | NOT dormant, connected to v49j, has 6.09 SOL |
| **GUCX6xNe** | HIGH | Pre-funded deployer, 0.015 SOL |
| **DBmx** | MEDIUM | Known deployer, low balance (0.008 SOL) |
| **3xHtXHxy** | LOW | Operational wallet, not deployer |

### Investigation Completeness

**Updated**: ~95% complete

| Gap | Status |
|-----|--------|
| GUCX6xNe investigation | ✅ Complete |
| 3xHtXHxy investigation | ✅ Complete |
| 37Xxihfs dormancy check | ✅ Complete - NOT dormant! |
| Insider wallet hunt v2 | ✅ Complete - **5 cross-token buyers found!** |
| D3Jw99nJ investigation | ⏭️ Skipped (user confirmed not relevant) |
| Cross-token insiders | ✅ **5 found** - strongest: 56S29mZ3 (6s avg) |
| Coinbase connection | ✅ BNmf81tG funded by same Coinbase as 37Xxihfs |
| Early buyer deep dive | ✅ **2 confirmed insiders** - H3qSndFC and Hqf4TZxp |

---

## Monitoring Strategy

### Wallets to Monitor (Updated)

| Priority | Wallet | Role | What to Watch |
|----------|--------|------|---------------|
| 1 | `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | Primary Funder | SOL outbound to fresh address |
| 2 | `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | **Original Deployer (ACTIVE)** | pump.fun deployment, SOL outbound |
| 3 | `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` | Pre-funded Deployer | ANY activity |
| 4 | `DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy` | Known Deployer | pump.fun deployment activity |

### Risk Matrix (Updated)

| Scenario | Probability | Action |
|----------|-------------|--------|
| v49j funds fresh deployer | 50% | Primary monitor on v49j |
| 37Xxihfs deploys directly | 25% | **NEW**: Add 37Xxihfs to monitoring |
| GUCX6xNe gets activated | 15% | Watch for any activity |
| Reuse DBmx deployer | 10% | Monitor DBmx for deployment |

---

## Launch Day Protocol

### Pre-Launch (6 AM Pacific)
- [ ] Check v49j for overnight SOL outbound transactions
- [ ] Check DBmx for any new activity
- [ ] Verify monitoring bot is active

### Launch Window (10 AM - 12 PM Pacific)
1. **Signal A**: v49j sends SOL to fresh wallet → That's the deployer
2. **Signal B**: DBmx deploys to pump.fun → Snipe immediately
3. **Timeline**: Expect deployment ~2.5 hours after funding

### Action Sequence
1. Detect funding/deployment signal
2. Verify recipient is fresh wallet (if new funding)
3. Deploy sniper on target address
4. Monitor for pump.fun token creation

---

## API Usage

### Endpoints Used
| Endpoint | Credits | Purpose |
|----------|---------|---------|
| `/api/v1/profiler/address/related-wallets` | 1 | Find First Funder relationships |
| `/api/v1/profiler/address/transactions` | 1 | Transaction history |
| `/api/v1/profiler/address/counterparties` | 5 | Interaction analysis |
| `/api/v1/profiler/address/current-balance` | 1 | Wallet holdings |
| `/api/v1/profiler/address/historical-balances` | 1 | Balance over time |
| `/api/v1/tgm/holders` | 5 | Token holder analysis |
| `/api/v1/tgm/dex-trades` | 1 | Token trading history |

### Important Notes
- **Labels endpoint disabled** - Costs 500 credits per call
- **Date field required** for counterparties and historical-balances endpoints
- **Rate limiting**: 20 req/sec, 500 req/min (2 second delays recommended)

### API v1 Compliance (Nov 29, 2025)

Cross-referenced implementation against official Nansen API docs. All critical types now align:

| Type | Field Fixed | Before → After |
|------|-------------|----------------|
| `CurrentBalance` | balance | `balance` → `token_amount` |
| `CurrentBalance` | USD value | `balance_usd` → `value_usd` |
| `BalanceSnapshot` | timestamp | `timestamp` → `block_timestamp` |
| `BalanceSnapshot` | balance | `balance` → `token_amount` |
| `NansenCounterpartiesRequest` | date | optional → **required** |
| `NansenHistoricalBalancesRequest` | date | optional → **required** |

Files modified:
- `src/types.ts` - Fixed response types to match API
- `src/nansen-client.ts` - Added required date fields to methods
- `src/historical-balance.ts` - Updated field references

---

## Project Structure

```
/nansen-profiler
├── src/
│   ├── nansen-client.ts         # API client wrapper (v1 compliant)
│   ├── types.ts                 # TypeScript definitions (API aligned)
│   ├── pre-launch-analysis.ts   # Main analysis orchestrator
│   ├── timing-analysis.ts       # Funding → deployment timing
│   ├── alternative-paths.ts     # Fresh wallet detection
│   ├── network-graph.ts         # Wallet relationship mapping
│   ├── historical-balance.ts    # Balance tracking
│   ├── signer-analysis.ts       # Signer relationship detection
│   ├── deep-verification.ts     # 6-phase verification (Nov 30)
│   ├── thorough-investigation.ts # Gap-filling investigation (Nov 30)
│   ├── investigate-root.ts      # ROOT wallet investigation (Nov 30)
│   ├── investigate-bdtg.ts      # BdtGEty8 wallet investigation (Nov 30)
│   ├── quick-check.ts           # Quick deployer verification (Nov 30)
│   ├── quick-status.ts          # Wallet balance comparison (Nov 30)
│   ├── launch-prediction.ts     # Pre-launch timing analysis (Nov 30)
│   ├── insider-hunt-v2.ts       # Cross-token insider detection (Nov 30)
│   └── insider-detection-v3.ts  # First 20 txns analysis + bot filtering (Nov 30)
├── data/
│   ├── deployers.json           # Known deployer addresses
│   ├── analysis/
│   │   ├── verification-report.json      # Deep verification results
│   │   ├── thorough-investigation.json   # Full investigation results
│   │   ├── insider-hunt-v2.json          # Cross-token insider results
│   │   └── insider-v3.json               # First 20 txns analysis results
│   └── archive/                 # Archived phase files (~1MB)
├── .env                         # NANSEN_API_KEY
└── MASTER_REPORT.md             # This file
```

### Key Commands

```bash
# Pre-launch monitoring (USE THESE)
npm run status              # Quick wallet balance comparison
npm run predict             # Launch timing prediction

# Full analysis
npm run pre-launch          # Full analysis (6 modules)
npm run pre-launch:report   # Report only (skip analysis)
npm run timing              # Timing pattern analysis
npm run alt-paths           # Alternative paths analysis
npm run network             # Network graph generation
npm run verify              # Deep verification (6-phase)
npm run insider             # Cross-token insider detection (v2)
npm run insider-v3          # First 20 txns + bot filtering (v3)

# Individual investigation scripts (run with npx tsx)
npx tsx src/thorough-investigation.ts  # Full gap-filling investigation
npx tsx src/investigate-root.ts        # ROOT wallet deep dive
npx tsx src/investigate-bdtg.ts        # BdtGEty8 wallet investigation
npx tsx src/quick-check.ts             # Quick deployer verification
```

---

## Session History

| Date | Key Actions |
|------|-------------|
| Nov 14, 2025 | Initial investigation, identified v49j as primary funder |
| Nov 14, 2025 | Completed 7-phase comprehensive analysis |
| Nov 29, 2025 | Pre-launch analysis for Nov 30 launch |
| Nov 29, 2025 | **Critical correction**: Verified fresh wallet candidates were false positives |
| Nov 29, 2025 | Archived outdated phase files to `data/archive/` |
| Nov 29, 2025 | **API Compliance**: Cross-referenced docs, fixed type mismatches |
| Nov 30, 2025 | **Deep Verification**: Created thorough-investigation.ts |
| Nov 30, 2025 | **Verified**: ROOT → v49j First Funder chain |
| Nov 30, 2025 | **Found**: 5 wallets where v49j is First Funder |
| Nov 30, 2025 | **Investigated**: ROOT wallet (Coinbase-funded, dormant hop wallet) |
| Nov 30, 2025 | **Investigated**: BdtGEty8 (trading bot wallet, NOT deployer) |
| Nov 30, 2025 | **Discovered**: v49j labeled as "BloomBot Trading Bot User" |
| Nov 30, 2025 | **Identified**: Outstanding gaps requiring further investigation |
| Nov 30, 2025 | **Complete Investigation**: Filled remaining gaps |
| Nov 30, 2025 | **🚨 CRITICAL**: 37Xxihfs is NOT dormant - sent SOL to v49j on Nov 27 |
| Nov 30, 2025 | **Investigated**: GUCX6xNe (HIGH risk pre-funded deployer) |
| Nov 30, 2025 | **Investigated**: 3xHtXHxy (MEDIUM risk operational wallet) |
| Nov 30, 2025 | **Insider Hunt v1**: Found 6 watchlist wallets, no cross-token buyers |
| Nov 30, 2025 | **Confidence**: Downgraded from 90% to 80% due to 37Xxihfs activity |
| Nov 30, 2025 | **Insider Hunt v2**: Fixed timezone bug, found **5 cross-token insiders!** |
| Nov 30, 2025 | **🎯 Key Finding**: BNmf81tG funded by same Coinbase as 37Xxihfs |
| Nov 30, 2025 | **🎯 Key Finding**: 56S29mZ3 bought XRPEP3+TrollXRP avg 6s after first trade |
| Nov 30, 2025 | **Investigation**: Upgraded to ~95% complete |
| Nov 30, 2025 | **Bot Check**: 56S29mZ3 confirmed as BOT ($77M+ volume) - REMOVED from watchlist |
| Nov 30, 2025 | **Insider v3**: First 20 transactions analysis with bot filtering |
| Nov 30, 2025 | **🎯 Found 2 verified insiders**: Hqf4TZxph6H4 and H3qSndFCAyjv (both in first 20 of BOTH tokens) |
| Nov 30, 2025 | **Early Buyer Deep Dive**: Full 3-level funding chain + counterparty analysis on 3 wallets |
| Nov 30, 2025 | **Confirmed**: H3qSndFC and Hqf4TZxp are INSIDERS (score 60/100), both still ACTIVE |
| Nov 30, 2025 | **Finding**: Neither insider connected to v49j/ROOT chain - may be independent actors |
| Nov 30, 2025 | **H3qSndFC interesting**: First Funder is "CHOCO Token Deployer" - another token deployer! |
| Nov 30, 2025 | **PRE-LAUNCH**: Created quick-status.ts for wallet balance comparison |
| Nov 30, 2025 | **🚨 CRITICAL**: 37Xxihfs confirmed funded with **8.94 SOL** |
| Nov 30, 2025 | **Pattern Match**: Balance matches historical dev buy pattern (8-10 SOL) |
| Nov 30, 2025 | **Funding Sources**: 3 deposits today from intermediary wallets (not direct Coinbase) |
| Nov 30, 2025 | **Outbound Check**: No SOL sent out - 37Xxihfs is accumulating |
| Nov 30, 2025 | **Created**: launch-prediction.ts for comprehensive pre-launch analysis |
| Nov 30, 2025 | **Confidence**: Upgraded to 95% - 37Xxihfs is the deployment wallet |
| Nov 30, 2025 | **22:20 UTC UPDATE**: Full investigation refresh |
| Nov 30, 2025 | **Bz2yexdH balance UP**: 11.65 → 14.54 SOL (still accumulating, NO deployment) |
| Nov 30, 2025 | **Bra1HUNK investigated**: NOT connected to our chain (First Funder is $1.87M whale from different chain) |
| Nov 30, 2025 | **37Xxihfs depleted**: 8.94 → 0.09 SOL (sent to Bz2yexdH) |
| Nov 30, 2025 | **Insider wallets**: No new activity (H3qSndFC: 2.44 SOL, Hqf4TZxp: 0.002 SOL) |
| Nov 30, 2025 | **23:21 UTC**: Hqf4TZxp (insider) suddenly funded with 10.39 SOL from A77HErqt |
| Nov 30, 2025 | **Discovery**: A77HErqt ($5M whale) funds BOTH 37Xxihfs chain AND insider wallet |
| Nov 30, 2025 | **Conclusion**: Hqf4TZxp is a BUYER not deployer - same snipe strategy as us |
| Nov 30, 2025 | **Final verification**: Confirmed Bz2yexdH as deployer (First Funder = 37Xxihfs) |
| Nov 30, 2025 | ✅ **SUCCESS**: Bz2yexdH deployed the token as predicted! |
| Jan 3, 2026 | **Session Start**: Reviewing codebase after 34 days away |
| Jan 3, 2026 | **Database Update**: Added RainXRP (RXRP) to deployers.json |
| Jan 3, 2026 | **Created**: JAN_2026_INVESTIGATION.md tracking document |
| Jan 3, 2026 | **API Verified**: Nansen API key working, credits available |
| Jan 3, 2026 | **Wallet Status**: All key wallets at low balance (<0.5 SOL) |
| Jan 3, 2026 | **RainXRP Post-Mortem**: Analyzed Nov 30 launch early buyers |
| Jan 3, 2026 | **🎯 H3qSndFC CONFIRMED**: 3-token insider - bought RXRP in 8 seconds |
| Jan 3, 2026 | **Hqf4TZxp Downgraded**: Did NOT buy RXRP in first 5 minutes |
| Jan 3, 2026 | **New Insiders Found**: FSbvLdrK1FuW (XRPEP3+RXRP), 2NuAgVk3hcb7 (TrollXRP+RXRP) |
| Jan 3, 2026 | **User Wallets Excluded**: 321Ct, Dc5s, 9iUb, D8ZB (all bought in 1 second!) |
| Jan 3, 2026 | **Fresh Wallet Check**: No deployer funding since Nov 30 (expected) |
| Jan 3, 2026 | **Plan**: Daily monitoring starts Jan 8, expect launch Jan 12 or 19 |

---

## Finale: November 30, 2025 Investigation Summary

### What Worked

1. **First Funder relationship was the key signal**
   - Bz2yexdH had 37Xxihfs as First Funder (original deployer)
   - This was the strongest indicator and proved correct

2. **Dual funding confirmation**
   - Both 37Xxihfs AND v49j sent SOL to Bz2yexdH
   - This double confirmation increased confidence significantly

3. **Pattern recognition**
   - Balance of 14.54 SOL matched historical dev buy pattern (8-10+ SOL)
   - Fresh wallet with minimal transactions = deployer signature

4. **Eliminating false positives**
   - Bra1HUNK: Ruled out by tracing First Funder to different chain
   - Hqf4TZxp: Identified as buyer (historical cross-token purchases), not deployer

### Key Insight: Insider vs Deployer Distinction

When Hqf4TZxp got funded with 10 SOL during the investigation, it created uncertainty. The distinction was:

| Signal | Deployer (Bz2yexdH) | Buyer (Hqf4TZxp) |
|--------|---------------------|------------------|
| First Funder | 37Xxihfs (deployer chain) | Different wallet |
| Historical role | Fresh wallet | Bought previous tokens |
| Funding source | 37Xxihfs + v49j | Exchange/whale |

**The First Funder relationship was the definitive signal.**

### Reflections for Next Month

1. **Monitor 37Xxihfs and v49j outbound** - When either sends SOL to a fresh wallet, that's likely the deployer
2. **Check First Funder immediately** - This is the fastest way to confirm deployer chain connection
3. **Insiders getting funded ≠ deployers** - They're preparing to buy, not deploy
4. **Trust the pattern** - The funding chain has been consistent across multiple launches

### Wallets to Monitor (December 2025)

| Priority | Wallet | Role |
|----------|--------|------|
| 1 | `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | Original Deployer - watch outbound |
| 2 | `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | Primary Funder - watch outbound |
| 3 | `Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y` | Nov 30 deployer - may be reused |
| 4 | `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` | Pre-funded - still unused |

### Prediction Accuracy

| Launch | Deployer | Predicted? | Method |
|--------|----------|------------|--------|
| XRPEP3 (Sep 28) | D7Ms | Post-hoc | v49j First Funder |
| TrollXRP (Nov 2) | DBmx | Post-hoc | v49j First Funder |
| **Nov 30 Token** | **Bz2yexdH** | ✅ **PRE-LAUNCH** | 37Xxihfs First Funder |

**First successful pre-launch deployer prediction!**

---

## Lessons Learned

1. **Always verify First Funder relationships** - Don't assume transaction presence = funding
2. **Check transaction types** - USDC transfers ≠ SOL deployer funding
3. **0.00 SOL amounts are a red flag** - Indicates token interactions, not funding
4. **API date fields are required** - `counterparties` and `historical-balances` require date ranges
5. **Cross-reference with official docs** - API field names differ (e.g., `token_amount` not `balance`)
6. **Labels endpoint is expensive** - 500 credits per call, use sparingly or disable
7. **Transaction queries have limits** - 100 per page, may miss historical data (D7Ms was missed)
8. **"Recent activity" can be misleading** - 6rYLG55Q had "activity" but it was just dust spam
9. **Wallet labels provide context** - v49j is "BloomBot Trading Bot User", explains trading activity
10. **Investigation is never 100% complete** - Always identify and document gaps
11. **Fast buyers ≠ insiders** - Many "first minute" buyers are high-volume bots (e.g., 56S29mZ3 had $77M+ volume)
12. **Transaction position > time** - "First 20 transactions" is more precise than "first 5 minutes" for insider detection
13. **Bot filtering is essential** - Check volume, counterparties, and balance before labeling someone an "insider"
14. **First Funder is the definitive deployer signal** - When multiple wallets are candidates, First Funder to the deployer chain wins
15. **Insiders getting funded creates noise** - They're preparing to buy, not deploy; don't confuse buyer funding with deployer funding
16. **Dual funding (37Xxihfs + v49j) is strongest confirmation** - Both chain wallets contributing = high confidence

---

## Contact & Resources

- **Nansen API Docs**: https://docs.nansen.ai
- **Investigation Start**: November 14, 2025
- **First Successful Pre-Launch Prediction**: November 30, 2025

---

## Investigation Scripts Created

| Script | Purpose |
|--------|---------|
| `quick-status.ts` | Wallet balance comparison |
| `verify-deployer.ts` | Final deployer verification |
| `urgent-check.ts` | Rapid status check on key wallets |
| `investigate-update.ts` | Full wallet investigation |
| `trace-insider-funding.ts` | Trace funding sources |
| `check-a77h.ts` | Whale/intermediary investigation |
| `check-insiders.ts` | Insider wallet monitoring |

---

## January 2026 Investigation

### Session: January 3, 2026

**Context**: Token announcement scheduled for January 10, 2026. Expected launch January 12 or 19 (Sunday).

### RainXRP (RXRP) Post-Mortem

The November 30, 2025 token launch was analyzed to validate our models:

| Metric | Value |
|--------|-------|
| **Token** | RainXRP (RXRP) |
| **CA** | `3VQU1DgaLE6E49HhqvH73Azsin8gAZRc14cvyV4hpump` |
| **Deployer** | `Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y` |
| **First Trade** | Nov 30, 2025 @ 23:43:26 UTC |
| **Early Buyers (5min)** | 172 unique wallets |
| **Trades in Window** | 489 |

### Insider Validation Results

| Wallet | Previous Score | RXRP Activity | New Status |
|--------|---------------|---------------|------------|
| `H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot` | 60/100 | Bought in 8 seconds, $297 | **CONFIRMED 3-TOKEN INSIDER** (80/100) |
| `Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT` | 60/100 | NOT in first 5 minutes | Downgraded (may have stopped) |

### New Cross-Token Insiders Discovered

| Wallet | Tokens | Avg Buy Time | Priority |
|--------|--------|--------------|----------|
| `FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE` | XRPEP3 + RXRP | 24 seconds | HIGH |
| `2NuAgVk3hcb7s4YvP4GjV5fD8eDvZQv5wuN6ZC8igRfV` | TrollXRP + RXRP | 120 seconds | MEDIUM |

### Current Wallet Status (Jan 3, 2026)

| Wallet | Role | Balance | Status |
|--------|------|---------|--------|
| `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | Original Deployer | 0.0714 SOL | Low - last active Dec 23 |
| `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | Primary Funder | 0.3087 SOL | Low |
| `Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y` | Nov 30 Deployer | 0.0209 SOL | Low |
| `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` | Pre-funded (unused) | 0.0151 SOL | Dormant |

### Fresh Wallet Funding Check

**Result**: No fresh deployer wallet has been funded since Nov 30, 2025.

This is expected - deployer funding typically happens 2-3 hours before launch, not weeks ahead.

### January 2026 Prediction Framework

#### Possible Scenarios

| Scenario | Probability | Signal |
|----------|-------------|--------|
| New fresh wallet funded | 60% | v49j or 37Xxihfs sends 8-15 SOL |
| Reuse Bz2yexdH (RXRP deployer) | 25% | Bz2yexdH receives new funding |
| Reuse GUCX6xNe (pre-funded) | 10% | Any activity on GUCX6xNe |
| New pattern | 5% | Unknown |

#### Timeline

| Date | Event |
|------|-------|
| Jan 10 | Token announcement (details only) |
| Jan 11 | Final pre-launch check |
| Jan 12 (Sunday) | **Potential launch day** |
| Jan 19 (Sunday) | Backup launch day |

#### Launch Day Protocol

1. Morning wallet check (6 AM Pacific)
2. Watch for v49j/37Xxihfs outbound SOL > 5
3. When funding detected → Verify First Funder
4. Fresh wallet with 8-15 SOL from chain = deployer
5. Launch expected 2-3 hours after funding

### Updated Insider Watchlist (January 2026)

| Priority | Wallet | Reason |
|----------|--------|--------|
| 1 | `H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot` | 3-token insider, fastest non-bot buyer |
| 2 | `FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE` | 2-token insider (XRPEP3 + RXRP) |
| 3 | `2NuAgVk3hcb7s4YvP4GjV5fD8eDvZQv5wuN6ZC8igRfV` | 2-token insider (TrollXRP + RXRP) |

### Updated Token History

| # | Token | Ticker | Deployer | Date |
|---|-------|--------|----------|------|
| 1 | ArkXRP | ARKXRP | 37Xxihfs | Jun 15, 2025 |
| 2 | DogwifXRP | - | 37Xxihfs | Jul 20, 2025 |
| 3 | WFXRP | WFXRP | 37Xxihfs | Aug 24, 2025 |
| 4 | XRPEP3 | XRPEP3 | D7MsVpaX | Sep 28, 2025 |
| 5 | TrollXRP | TROLLXRP | DBmxMiP8 | Nov 2, 2025 |
| 6 | RainXRP | RXRP | Bz2yexdH | Nov 30, 2025 |
| 7 | ??? | ??? | ??? | Jan 2026 |

### Files Created This Session

| File | Purpose |
|------|---------|
| `JAN_2026_INVESTIGATION.md` | Detailed tracking document for January launch |
| `src/check-recent-funding.ts` | Check funder outbound activity |

### Next Actions

1. **Jan 8-11**: Run `npm run status` daily
2. **Jan 12 (Sunday)**: Monitor from 6 AM Pacific for launch signals
3. **When funding detected**: Immediately verify First Funder relationship

---

*This document consolidates all investigation findings. See `JAN_2026_INVESTIGATION.md` for detailed January 2026 tracking.*
