# Playbook: February 2026 Launch

**Next Launch**: Expected mid-February 2026 (Sunday, ~15th or 22nd)
**Status**: WAITING - Monitoring for funding activity
**Last Updated**: Jan 25, 2026

---

## January 2026 Results - SUCCESS

**Deployer**: HYMt (correctly predicted)
**Chain**: Coinbase → ROOT → v49j → HYMt
**Method**: pump.fun (as expected)

### Key Learnings
1. v49j → fresh wallet pattern continues to work
2. HYMt received additional funding (7.1 → 13.65 SOL) before launch
3. Bundle wallets funded with 0.6-2 SOL each (6M2Pp, FSbvLdrK)
4. 9J9VHoLW remains reliable backup sniper (4/7 launches, 0-1s speed)

---

## Wallet Watchlist (Reset for February)

### Tier 1 - CRITICAL
| Wallet | Last Balance | Role |
|--------|-------------|------|
| v49j | ~0.08 SOL | Primary funder - WATCH FOR REFILL |
| 37Xxihfs | ~0.07 SOL | Original deployer |
| HYMt | Depleted | Jan deployer (may be reused) |

### Tier 2 - HIGH
| Wallet | Last Balance | Role |
|--------|-------------|------|
| ROOT | Unknown | Master funder |
| GUCX6xNe | 0.015 SOL | Sleeper wallet |
| FSbvLdrK | ~2.2 SOL | Bundle wallet (Jan) |

### Tier 3 - INTEL
| Wallet | Notes |
|--------|-------|
| 9J9VHoLW | Best backup sniper (4/7 launches) |
| H3qSndFC | 3-token insider, independent chain |

---

## Full Wallet Addresses

| Short | Full Address |
|-------|--------------|
| v49j | `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` |
| 37Xxihfs | `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` |
| HYMt | `HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG` |
| ROOT | `GtHxqXqV8p6PuqFzSHnSzRuLv7o1vZZZc3z7r9KVJWrk` |
| GUCX6xNe | `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` |
| FSbvLdrK | `FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE` |
| 9J9VHoLW | `9J9VHoLWgTRxuc6DtNYxRMi2jVqAFAPshUSMeWQ7wz3Y` |
| H3qSndFC | `H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot` |

---

## Launch History

| # | Date | Token | Ticker | Deployer | First Funder | Notes |
|---|------|-------|--------|----------|--------------|-------|
| 1 | Jun 15, 2025 | ArkXRP | ARKXRP | 37Xxihfs | Coinbase | Original deployer |
| 2 | Jul 20, 2025 | DogwifXRP | - | 37Xxihfs | Coinbase | Original deployer |
| 3 | Aug 24, 2025 | WFXRP | WFXRP | 37Xxihfs | Coinbase | Original deployer |
| 4 | Sep 28, 2025 | XRPEP3 | XRPEP3 | D7MsVpaX | v49j | First v49j-funded |
| 5 | Nov 2, 2025 | TrollXRP | TROLLXRP | DBmxMiP8 | v49j | |
| 6 | Nov 30, 2025 | RainXRP | RXRP | Bz2yexdH | 37Xxihfs | First pre-launch prediction |
| 7 | Jan 18, 2026 | Quantum X | - | HYMt | v49j | Second successful prediction |

**Pattern**: v49j funds fresh wallet 2-4 hours before launch

---

## Pre-Launch Checklist (February)

- [ ] Monitor v49j for inbound >5 SOL
- [ ] Check if HYMt gets refilled or new wallet funded
- [ ] Run `npm run status` daily starting Feb 10
- [ ] Run `npm run alt-paths` to find fresh candidates
- [ ] Watch Discord for launch hints

---

## Commands

```bash
npm run status          # Daily wallet balance check
npm run insider         # Unified insider detection (all tokens)
npm run insider:time    # Time-window mode (first 5 min)
npm run insider:bots    # With bot filtering
npm run timing:predict  # Launch timing + prediction
npm run smart-money     # Smart money flow analysis
npm run alt-paths       # Fresh wallet discovery
npm run comprehensive   # Full analysis pipeline
```

---

## Core Principles

1. **First Funder is the definitive signal** - When multiple wallets are candidates, First Funder relationship to the deployer chain wins
2. **Dual funding (37Xxihfs + v49j) is strongest confirmation** - Both chain wallets contributing = highest confidence
3. **Trust wallet signals over social signals** - Funding detection beats announcements

---

## Key Lessons

1. Always verify First Funder relationships - Don't assume transaction presence = funding
2. Check transaction types - USDC transfers ≠ SOL deployer funding
3. API date fields are required - `counterparties` and `historical-balances` require date ranges
4. Cross-reference with official docs - API field names differ (e.g., `token_amount` not `balance`)
5. Labels endpoint is expensive - 500 credits per call, use sparingly or disable
6. Transaction queries have limits - 100 per page, may miss historical data
7. "Recent activity" can be misleading - Dust spam creates noise
8. Wallet labels provide context - v49j is "BloomBot Trading Bot User"
9. Investigation is never 100% complete - Always document gaps
10. Transaction position > time - "First 20 transactions" is more precise than "first 5 minutes"
11. Bot filtering is essential - Check volume, counterparties, and balance before labeling insiders
12. Insiders getting funded creates noise - They're preparing to buy, not deploy
13. Fresh wallet with minimal transactions = deployer signature
14. Balance of 8-15 SOL matches historical dev buy pattern

---

## Decision Framework

| Signal Combination | Confidence | Action |
|--------------------|------------|--------|
| Dual funding (37Xxihfs + v49j) + Fresh wallet | 95% | CONFIRMED - Act |
| Single funder + Fresh wallet + Deployer signature | 80% | HIGH - Monitor closely |
| Behavioral match only (no chain link) | 60% | MEDIUM - Need correlation |
| Sleeper wallet activated | 90% | CONFIRMED - Known chain wallet |

### Go/No-Go Criteria

**GO** (Act on deployer):
- Confidence ≥80%
- First Funder chain verified OR behavioral + insider correlation
- Balance in expected range (5-20 SOL)

**WAIT** (More verification needed):
- Confidence 60-79%
- Single signal without correlation

**NO-GO** (Do not act):
- Confidence <60%
- No chain connection AND no behavioral match

---

## Verified Funding Chain

```
Coinbase Hot Wallet (GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE)
  │
  ↓ (June 14, 2025)
ROOT (9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF) - One-time hop, DORMANT
  │
  ↓
v49j (v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5) - Primary Funder
  │
  ↓ (2-3 hours before launch)
Fresh Deployer Wallet (8-15 SOL)
  │
  ↓
pump.fun Token Deployment
```

**Alternative Path**: 37Xxihfs can also fund deployers directly (same entity).

---

## Threat Framework

| # | Threat | Detection | Response |
|---|--------|-----------|----------|
| 1 | New funding chain | No chain wallet activity by T-12 hours | Expanded counterparty scan |
| 2 | Exchange direct funding | Fresh wallet with exchange as First Funder | Fall back to behavioral detection |
| 3 | Sleeper activation | Any activity on pre-funded wallets | HIGH ALERT - treat as confirmed |
| 4 | Multiple hop obfuscation | Fresh wallet, unknown First Funder | Trace 3 levels deep |
| 5 | Timing variation | Funding earlier than expected | Start monitoring at T-7 days |
| 6 | Insider rotation | Known insiders don't buy early | Cross-token analysis for new patterns |
| 7 | No announcement | Wallet funding before social signal | Trust wallet signals |
