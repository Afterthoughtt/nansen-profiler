# Nansen Profiler - Pump.fun Deployer Investigation

**Last Updated**: November 29, 2025 (API Compliance Update)
**Status**: Active Investigation
**Next Launch**: November 30, 2025 (Sunday)

---

## Executive Summary

This project uses the Nansen Blockchain Profiler API to identify and track the funding patterns of pump.fun token deployers on Solana. The goal is to predict which wallet will deploy the next token by monitoring the funding chain.

**Primary Target Wallet**:
```
v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5
```

**Confidence Level**: 90% (for known pattern)

---

## Confirmed Funding Chain

```
ROOT (9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF)
  ↓
LEVEL 1 / Primary Funder (v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5)
  ↓
Fresh Deployer Wallet
  ↓
pump.fun Token Deployment
```

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

## Monitoring Strategy

### Wallets to Monitor

| Priority | Wallet | Role | What to Watch |
|----------|--------|------|---------------|
| 1 | `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | Primary Funder | SOL outbound to fresh address |
| 2 | `DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy` | Existing Deployer | pump.fun deployment activity |
| 3 | `9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF` | ROOT | Activity (currently dormant) |

### Risk Matrix

| Scenario | Probability | Action |
|----------|-------------|--------|
| v49j funds fresh deployer | 60% | Primary monitor on v49j |
| Reuse DBmx deployer | 35% | Monitor DBmx for deployment |
| Different pattern | 5% | Watch ROOT wallet |

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
│   ├── nansen-client.ts      # API client wrapper (v1 compliant)
│   ├── types.ts              # TypeScript definitions (API aligned)
│   ├── pre-launch-analysis.ts # Main analysis orchestrator
│   ├── timing-analysis.ts    # Funding → deployment timing
│   ├── alternative-paths.ts  # Fresh wallet detection
│   ├── network-graph.ts      # Wallet relationship mapping
│   ├── historical-balance.ts # Balance tracking
│   └── signer-analysis.ts    # Signer relationship detection
├── data/
│   ├── deployers.json        # Known deployer addresses
│   ├── analysis/             # Current analysis outputs (~48KB)
│   └── archive/              # Archived phase files (~1MB)
├── .env                      # NANSEN_API_KEY
└── MASTER_REPORT.md          # This file
```

### Key Commands

```bash
npm run pre-launch          # Full analysis (6 modules)
npm run pre-launch:report   # Report only (skip analysis)
npm run timing              # Timing pattern analysis
npm run alt-paths           # Alternative paths analysis
npm run network             # Network graph generation
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

---

## Lessons Learned

1. **Always verify First Funder relationships** - Don't assume transaction presence = funding
2. **Check transaction types** - USDC transfers ≠ SOL deployer funding
3. **0.00 SOL amounts are a red flag** - Indicates token interactions, not funding
4. **API date fields are required** - `counterparties` and `historical-balances` require date ranges
5. **Cross-reference with official docs** - API field names differ (e.g., `token_amount` not `balance`)
6. **Labels endpoint is expensive** - 500 credits per call, use sparingly or disable

---

## Contact & Resources

- **Nansen API Docs**: https://docs.nansen.ai
- **Investigation Start**: November 14, 2025
- **Deployer Community**: Announced Nov 30 launch

---

*This document consolidates all investigation findings. Previous .md files have been archived.*
