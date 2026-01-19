# Launch Day Intelligence Report

**Date**: January 18, 2026
**Last Updated**: 10:45 AM MST
**Status**: ACTIVE MONITORING - Awaiting Discord confirmation

---

## 🚨 CRITICAL UPDATE

**NEW Launch Window**: 1:15 PM - 4:15 PM MST (~3-6 hours from 10:15 AM)
**Dev Quote**: "Dropping in approximately 3 to 6 hours, nothing certain"
**Project Name**: "Quantum X" (per Discord)
**Expected Method**: pump.fun (standard, like all previous launches)

---

## Primary Target: HYMt (pump.fun path)

```
Coinbase → ROOT → v49j → HYMt (7.1 SOL) → pump.fun deployment
```

**This is the most likely launch path based on historical pattern.**

| Wallet | Address | Balance | Status |
|--------|---------|---------|--------|
| **HYMt** | `HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG` | **7.10 SOL** | PRIMARY - Watch for pump.fun interaction |

---

## Secondary Discovery: QuantumCore Chain (Uncertain Relevance)

```
EbMRVzXVRH8y (5.87 SOL) → 9dcT4Cw (4.92 SOL) → Bz2yexdH
```

### Token Details
| Token Name | Ticker | Mint Address | Minted | Status |
|------------|--------|--------------|--------|--------|
| QuantumCore | **THE** | `7U9e3PvKsu33ZHYnQdszVwtr9JyuJq56GJYqocrij5Ho` | Dec 2, 2025 | 0 holders, dormant 6 weeks |
| b2FK | **COIN** | `b2FK3rJJPFDzhbJegwdkwe1b8B92XHKKH1o8mvTNogs` | Dec 3, 2025 | 0 holders, dormant 6 weeks |

### Connection to Our Chain
- 9dcT4Cw sent 557 transfers of THE/COIN to Bz2yexdH (RXRP deployer)
- Transaction proof: `5qVty9Ci5kqKYUa9aq5g41sE3XW61FVF6x6CrHC4DeiWuVxMu7dqE9hQzRH7d837LbZCuYVQ79oP3opm3iQ2Eqei`

### ⚠️ UNCERTAINTY
**If pump.fun is the launch method, THE/COIN tokens would be worthless** - pump.fun creates a NEW token mint. Pre-minted tokens serve no value purpose.

Possible explanations:
1. **Test transactions** - Testing distribution mechanics
2. **Different project** - Unrelated to Quantum X
3. **Shared wallet** - Bz2yexdH used for multiple operations
4. **Unknown utility** - Purpose unclear

**Current assessment**: Interesting but may be noise. Focus on HYMt.

---

## Wallet Watchlist (Prioritized)

### Tier 1 - PRIMARY
| Wallet | Full Address | Balance | Watch For |
|--------|--------------|---------|-----------|
| **HYMt** | `HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG` | 7.10 SOL | pump.fun interaction |

### Tier 2 - SECONDARY (Keep watching, lower priority)
| Wallet | Full Address | Balance | Watch For |
|--------|--------------|---------|-----------|
| Bz2yexdH | `Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y` | 0.02 SOL | SOL funding (would signal reuse) |
| EbMRVzXVRH8y | `EbMRVzXVRH8yp6nmFSGQEyMDLQAsqk5GJjQMJi3inciV` | 5.87 SOL | Any activity (uncertain relevance) |
| 9dcT4Cw | `9dcT4CwjFk8oJFs5nVXGz88DyEkXyiCPKhjptVwdTi66` | 4.92 SOL | More transfers (uncertain relevance) |

### Tier 3 - BACKGROUND
| Wallet | Full Address | Balance | Notes |
|--------|--------------|---------|-------|
| v49j | `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | 0.08 SOL | Depleted |
| 37Xxihfs | `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | 0.07 SOL | Original deployer |
| GUCX6xNe | `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` | 0.015 SOL | Sleeper |

---

## Launch Scenarios (Revised)

| Scenario | Probability | Signal | Action |
|----------|-------------|--------|--------|
| **A: pump.fun via HYMt** | **75%** | HYMt interacts with pump.fun program | Snipe on pump.fun |
| B: pump.fun via different wallet | 15% | Unknown wallet deploys, trace First Funder | Trace and verify |
| C: Custom SPL (THE/COIN) | 10% | DEX liquidity added to THE or COIN | Watch Raydium/Orca |

---

## Timeline

| Time | Event |
|------|-------|
| Nov 30, 2025 | RXRP launched via pump.fun (Bz2yexdH) |
| Dec 2-3, 2025 | THE/COIN tokens minted by EbMRVzXVRH8y |
| Jan 11-17 | 557 SPL transfers from 9dcT4Cw to Bz2yexdH |
| Jan 17, 7:56 PM | v49j funded HYMt with 7.1 SOL |
| Jan 18, 10:15 AM | Dev announces 3-6 hour window |
| **Jan 18, 1:15-4:15 PM** | **EXPECTED LAUNCH WINDOW** |

---

## Key Findings Summary

1. **HYMt is primary target** - 7.1 SOL, funded by v49j, fresh wallet
2. **QuantumCore chain discovered** - EbMRVzXVRH8y → 9dcT4Cw → Bz2yexdH connection
3. **THE/COIN tokens** - Minted Dec 2-3, being sent to Bz2yexdH, purpose unclear
4. **Uncertainty** - If pump.fun launch, pre-minted tokens are worthless
5. **Leaning pump.fun** - Standard method, awaiting Discord confirmation

---

## Open Questions

- [ ] Discord confirmation of launch method (pump.fun vs custom)
- [ ] Why do THE/COIN tokens exist if using pump.fun?
- [ ] Is EbMRVzXVRH8y chain actually related to Quantum X?

---

## Quick Commands

```bash
npm run status                    # Check HYMt and chain balances
npx tsx src/quantum-status.ts     # Check QuantumCore chain (secondary)
```

---

## Primary Monitoring Address

```
HYMtCcfQTkBGw7uufDZtYHzg48pUmmBWPf5S44akPfdG
```

**Watch for interaction with pump.fun program:**
```
6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
```

---

*Report updated: Jan 18, 2026 10:45 AM MST*
