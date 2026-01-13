# Contingency Playbook: January 2026 Launch

**Created**: January 4, 2026
**Stakes**: Do or die - Cannot miss this launch
**Priority**: Accuracy over speed

---

## Threat Matrix

| # | Threat | Likelihood | Impact | Current Detection | Gap |
|---|--------|------------|--------|-------------------|-----|
| 1 | New funding chain | Medium | CRITICAL | None | Need counterparty mapping |
| 2 | Exchange direct funding | Low | CRITICAL | First Funder shows exchange | Need behavioral fallback |
| 3 | Sleeper wallet activation | HIGH | Medium | Only GUCX6xNe tracked | Need full inventory |
| 4 | Multiple hop obfuscation | Medium | Medium | 1-level trace only | Need 3+ level trace |
| 5 | Timing variation | Medium | Low | Balance monitoring | Covered |
| 6 | H3qSndFC unknown | N/A | STRATEGIC | Not investigated | PRIORITY investigation |
| 7 | Bz2yexdH reuse | Medium | Low | In `npm run status` | Covered |
| 8 | Insider rotation | Medium | Medium | Only H3qSndFC tracked | Need RXRP analysis |
| 9 | No announcement | Low | High | Wallet monitoring | Trust wallet > social |

### Risk Priority Order

1. **CRITICAL + Medium likelihood**: New funding chain (#1)
2. **STRATEGIC**: H3qSndFC connection (#6)
3. **HIGH likelihood**: Sleeper activation (#3)
4. **Medium × Medium**: Hop obfuscation (#4), Insider rotation (#8)
5. **Covered**: Timing (#5), Bz2yexdH reuse (#7), No announcement (#9)

---

## Response Protocols

### THREAT 1: New Funding Chain

**Scenario**: Entity abandons v49j/37Xxihfs, uses unknown intermediary we don't track.

**Detection Signals**:
- v49j/37Xxihfs show no outbound SOL by T-12 hours
- H3qSndFC gets funded from unknown source
- ROOT wallet (dormant since Jun 2025) shows activity

**Response**:
1. If no chain wallet activity by T-12 hours → Escalate to expanded scan
2. Run `investigate-h3qsndfc.ts` - their funder might reveal new chain
3. Run `expanded-counterparty-scan.ts` - find any wallet that received SOL from chain's Coinbase origins
4. Check ROOT for reactivation

**Confidence Required**: 70% from alternative signals before acting

---

### THREAT 2: Exchange Direct Funding

**Scenario**: Deployer funded directly from Coinbase/Binance, breaking First Funder link.

**Detection Signals**:
- Fresh wallet appears with exchange as First Funder
- Wallet has deployer signature: <10 transactions, 8-15 SOL balance

**Response**:
1. Cannot rely on First Funder chain - fall back to behavioral detection
2. Look for wallets matching deployer signature:
   - Balance: 8-15 SOL
   - Transaction count: <10
   - Age: <7 days
3. Cross-reference with H3qSndFC activity (if connected)
4. Run `fresh-wallet-behavioral-scan.ts` (to be created)

**Confidence Required**: 60% + H3qSndFC correlation

---

### THREAT 3: Sleeper Wallet Activation

**Scenario**: GUCX6xNe (pre-funded Jun 2025) or unknown sleeper activated.

**Detection Signals**:
- ANY activity on GUCX6xNe (currently 0.015 SOL, dormant)
- Unknown wallet with v49j/37Xxihfs as First Funder shows activity

**Response**:
1. If GUCX6xNe balance changes → HIGH ALERT, treat as confirmed deployer
2. Run `sleeper-inventory.ts` to find ALL chain-funded wallets (to be created)
3. Any sleeper with balance increase = potential deployer

**Confidence Required**: 80% for known sleeper (GUCX6xNe), 70% for newly discovered

---

### THREAT 4: Multiple Hop Obfuscation

**Scenario**: Entity adds 2-3 intermediate wallets between v49j/37Xxihfs and deployer.

**Detection Signals**:
- Fresh wallet appears, First Funder is unknown
- Unknown funder itself was funded by chain wallets

**Response**:
1. Any fresh wallet detected → Trace funding chain 3 levels deep
2. Look for v49j/37Xxihfs ANYWHERE in the chain, not just First Funder
3. Run `deep-chain-trace.ts` with target wallet (to be created)

**Confidence Required**: 75% if chain connection found at any level

---

### THREAT 5: Timing Variation

**Scenario**: Entity funds deployer days ahead instead of 2-3 hours before launch.

**Detection Signals**:
- Deployer wallet funded earlier than expected
- Pattern breaks from 2-3 hour pre-launch timing

**Response**:
1. Start monitoring at T-7 days, not T-1 day
2. Confidence increases as launch time approaches
3. Require dual-funding confirmation (both 37Xxihfs AND v49j) before highest confidence

**Confidence Required**: 50% at T-7 days, 90% at T-3 hours

---

### THREAT 6: H3qSndFC Connection Unknown

**Scenario**: We don't know if 3-token insider is truly connected or just skilled.

**Strategic Importance**:
- If connected → Their wallet is a leading indicator
- If independent → Cannot use as signal, only competitor

**Investigation Required**:
1. Trace H3qSndFC funding chain (3+ levels)
2. Map their counterparties
3. Look for shared funders/counterparties with v49j/37Xxihfs

**Outcome**:
- Connection found → Add to primary monitoring, use as early warning
- No connection → Acknowledge as independent actor, monitor competitively only

---

### THREAT 7: Bz2yexdH Reuse

**Scenario**: November 30 deployer (Bz2yexdH) gets refunded and reused.

**Detection Signals**:
- Bz2yexdH balance increases above 1 SOL
- Currently at 0.02 SOL

**Response**:
1. Already in `npm run status` monitoring
2. If balance rises → CONFIRMED deployer (proven Nov 30)
3. Expect dual-funding pattern again

**Confidence Required**: 95% (already confirmed deployer)

---

### THREAT 8: Insider Rotation

**Scenario**: H3qSndFC cut out, new insiders emerge we don't track.

**Detection Signals**:
- H3qSndFC doesn't buy new token early
- Unknown wallets appear in first 20 buyers across multiple tokens

**Response**:
1. Update `insider-hunt-v2.ts` to include RXRP data
2. Run cross-token analysis: Who bought RXRP early that WASN'T in previous tokens?
3. Investigate any new cross-token buyers

**Priority**: Run this analysis BEFORE launch day

---

### THREAT 9: No Announcement Launch

**Scenario**: Launch happens without January 10 announcement.

**Detection Signals**:
- Wallet funding detected before social announcement
- Breaks expected pattern

**Response**:
1. DO NOT rely solely on announcement timing
2. Continue daily `npm run status` regardless
3. Trust wallet signals over social signals
4. If funding detected → Proceed with normal verification

**Confidence Required**: Same as normal detection (wallet signals are primary)

---

## Pre-Launch Checklist

### Daily Monitoring (Jan 8-11)

```
[ ] Run `npm run status`
[ ] Check 37Xxihfs balance (currently 0.07 SOL)
[ ] Check v49j balance (currently 0.31 SOL)
[ ] Check Bz2yexdH balance (currently 0.02 SOL)
[ ] Check GUCX6xNe for any activity (currently 0.015 SOL, dormant)
[ ] Check H3qSndFC balance (insider)
```

### Pre-Investigation (Before Jan 10) - COMPLETED Jan 8

```
[x] Run H3qSndFC investigation (Threat #6) - INDEPENDENT (score 0/100)
[x] Run sleeper wallet inventory (Threat #3) - No new sleepers found
[x] Run RXRP cross-token analysis for new insiders (Threat #8) - Done Jan 3
```

**Key Findings (Updated Jan 8)**:
- H3qSndFC is NOT connected to deployer chain (Crypto.com/Binance origin)
- All chain-funded wallets are known; GUCX is only unused sleeper (0.015 SOL)
- H3qSndFC cannot be used as leading indicator - competitor only
- **FSbvLdrK IS CONNECTED** - traces to same Coinbase hot wallet as deployer chain!
- FSbvLdrK can be used as secondary leading indicator

---

## Decision Framework

### Confidence Thresholds

| Signal Combination | Confidence | Action |
|--------------------|------------|--------|
| Dual funding (37Xxihfs + v49j) + Fresh wallet | 95% | CONFIRMED - Prepare to act |
| Single funder + Fresh wallet + Deployer signature | 80% | HIGH confidence - Monitor closely |
| Behavioral match only (no chain link) | 60% | MEDIUM - Need H3qSndFC correlation |
| H3qSndFC funded + Unknown deployer candidate | 70% | Investigate chain, may be new pattern |
| Sleeper (GUCX6xNe) activated | 90% | CONFIRMED - Known chain wallet |

### Go/No-Go Criteria

**GO** (Act on deployer):
- Confidence ≥80%
- First Funder chain verified OR behavioral + H3qSndFC correlation
- Balance in expected range (5-20 SOL)

**WAIT** (More verification needed):
- Confidence 60-79%
- Single signal without correlation
- Unusual pattern not matching historical data

**NO-GO** (Do not act):
- Confidence <60%
- No chain connection AND no behavioral match
- Contradictory signals

---

## Scripts Reference

### Existing Scripts
| Script | Command | Purpose |
|--------|---------|---------|
| `quick-status.ts` | `npm run status` | Daily wallet balance check |
| `alternative-paths.ts` | `npm run alt-paths` | Fresh wallet discovery |
| `verify-deployer.ts` | `npm run verify` | Deep verification |
| `insider-hunt-v2.ts` | `npm run insider` | Cross-token insider detection |

### Scripts to Create

| Script | Purpose | Addresses Threat |
|--------|---------|------------------|
| `investigate-h3qsndfc.ts` | Full insider chain trace + counterparties | #1, #6 |
| `sleeper-inventory.ts` | All v49j/37Xxihfs First Funder wallets | #3 |
| `expanded-counterparty-scan.ts` | Map all chain wallet relationships | #1, #4 |
| `deep-chain-trace.ts` | Multi-level (3+) funding trace | #4 |

---

## Key Wallet Reference

### Deployer Chain (Primary Monitoring)
| Wallet | Role | Alert Threshold |
|--------|------|-----------------|
| `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | Original Deployer | Outbound >5 SOL |
| `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | Primary Funder | Outbound >5 SOL |
| `Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y` | Nov 30 Deployer | Balance >1 SOL |
| `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` | Pre-funded Sleeper | ANY activity |

### Insiders (Secondary Signal)
| Wallet | Role | Alert Threshold | Connection |
|--------|------|-----------------|------------|
| `FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE` | 2-token Insider | Balance >5 SOL | **CONNECTED** |
| `H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot` | 3-token Insider | Balance >5 SOL | Independent |

### Historical Reference (Dormant)
| Wallet | Role | Notes |
|--------|------|-------|
| `9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF` | ROOT | Dormant since Jun 2025 |

---

## Summary

**Primary Detection**: First Funder relationship to chain wallets (37Xxihfs, v49j)

**Secondary Detection**: H3qSndFC activity (if connected), behavioral signature

**Fallback Detection**: Expanded counterparty scan, deep chain trace

**Trust Order**: Wallet signals > Social signals > Timing assumptions

---

*Document will be updated as investigation progresses and new threats are identified.*
