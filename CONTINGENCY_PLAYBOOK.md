# Contingency Playbook: January 2026 Launch

**Created**: January 4, 2026
**Last Updated**: January 16, 2026 (USDC monitoring added)
**Launch Date**: Sunday, January 18, 2026
**Stakes**: Do or die - Cannot miss this launch
**Priority**: Accuracy over speed

---

## 🚨 JAN 16 EVENING STATUS UPDATE

**v49j now has 7.1791 SOL** - approaching deployer funding threshold (8-15 SOL)!
- Still accumulating (+1.6 SOL in last 2 days)
- NO outbound to fresh wallets yet - deployer NOT funded
- All other Tier 1/2/3 wallets dormant
- Expected: Deployer funding 2-3 hours before Sunday launch

This is a **PRE-LAUNCH SIGNAL** for Jan 18.

---

## Threat Matrix

| # | Threat | Likelihood | Impact | Current Detection | Status |
|---|--------|------------|--------|-------------------|--------|
| 1 | New funding chain | Medium | CRITICAL | Counterparty mapping done | **MONITORED** |
| 2 | Exchange direct funding | Low | CRITICAL | First Funder shows exchange | Covered |
| 3 | Sleeper wallet activation | HIGH | Medium | sleeper-inventory.ts exists | **COVERED** - Only GUCX tracked |
| 4 | Multiple hop obfuscation | Medium | Medium | traceFundingChain() available | Covered |
| 5 | Timing variation | Medium | Low | Balance monitoring | Covered |
| 6 | H3qSndFC unknown | N/A | STRATEGIC | investigate-h3qsndfc.ts | **✅ COMPLETE** - INDEPENDENT |
| 7 | Bz2yexdH reuse | Medium | Low | In `npm run status` | Covered |
| 8 | Insider rotation | Medium | Medium | FSbvLdrK discovered | **✅ COMPLETE** - CONNECTED |
| 9 | No announcement | Low | High | Wallet monitoring | Covered |

### Risk Priority Order (Updated Jan 15)

1. **WATCH NOW**: v49j has 7 SOL - expect fresh deployer funding soon
2. **CRITICAL + Medium likelihood**: New funding chain (#1) - Monitoring active
3. **HIGH likelihood**: Sleeper activation (#3) - GUCX6xNe at 0.015 SOL
4. **COMPLETED**: H3qSndFC (#6) - Confirmed INDEPENDENT (Crypto.com/Binance)
5. **COMPLETED**: Insider rotation (#8) - FSbvLdrK confirmed CONNECTED to Coinbase chain

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

### Daily Monitoring (Jan 16-18)

```
[ ] Run `npm run status`
[ ] Check v49j balance (currently 7.18 SOL) - 🚨 WATCH FOR OUTBOUND
[ ] Check 37Xxihfs balance (currently 0.07 SOL)
[ ] Check Bz2yexdH balance (currently 0.02 SOL)
[ ] Check GUCX6xNe for any activity (currently 0.015 SOL, dormant)
[ ] Check insider balances (H3qSndFC, FSbvLdrK)
```

### Pre-Investigation - COMPLETED Jan 15

```
[x] Run H3qSndFC investigation (Threat #6) - INDEPENDENT (score 0/100)
[x] Run sleeper wallet inventory (Threat #3) - No new sleepers found
[x] Run RXRP cross-token analysis for new insiders (Threat #8) - Done Jan 3
[x] Bz2yexdH counterparty analysis (Phase B gap) - Done Jan 7
[x] v49j funding investigation - Has 7.18 SOL (Jan 16)
[x] Deep investigation - Filled all blind spots (Jan 16)
```

**Key Findings (Updated Jan 16)**:
- **v49j has 7.1793 SOL** - PRE-LAUNCH SIGNAL! Expect fresh deployer funding soon
- H3qSndFC is NOT connected to deployer chain (Crypto.com/Binance origin)
- All chain-funded wallets are known; GUCX is only unused sleeper (0.015 SOL)
- **FSbvLdrK IS CONNECTED** - traces to same Coinbase hot wallet as deployer chain
- 4yWaU1Qr (profit extraction wallet) was active Jan 9 - entity is moving money
- Bz2yexdH child wallets identified: 4yWaU1Qr ($47K), HDTncsSn ($21K)

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
| `deep-verification.ts` | `npm run verify` | Deep verification |
| `insider-hunt-v2.ts` | `npm run insider` | Cross-token insider detection |
| `investigate-h3qsndfc.ts` | `npx tsx src/investigate-h3qsndfc.ts` | Insider chain trace (Threat #6) ✅ |
| `sleeper-inventory.ts` | `npx tsx src/sleeper-inventory.ts` | Find all chain-funded wallets (Threat #3) ✅ |
| `check-v49j-funding.ts` | `npx tsx src/check-v49j-funding.ts` | v49j funding investigation |
| `check-insider-status.ts` | `npx tsx src/check-insider-status.ts` | Insider activity check |

### Scripts Not Needed

| Script | Reason |
|--------|--------|
| `expanded-counterparty-scan.ts` | Covered by existing counterparty analysis in data/analysis/ |
| `deep-chain-trace.ts` | `traceFundingChain()` in nansen-client.ts handles 3+ level tracing |

---

## Key Wallet Reference (Updated Jan 16)

### Tier 1 - CRITICAL (Deployer Chain)
| Wallet | Role | Balance (Jan 16) | Alert Threshold |
|--------|------|------------------|-----------------|
| `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | Primary Funder | **7.1793 SOL** 🚨 | Outbound >5 SOL |
| `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | Original Deployer | 0.0714 SOL | Outbound >5 SOL |
| `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` | Pre-funded Sleeper | 0.0151 SOL | ANY activity |

### Tier 2 - HIGH (Secondary Signals)
| Wallet | Role | Balance (Jan 16) | Connection | Alert |
|--------|------|------------------|------------|-------|
| `FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE` | CONNECTED Insider | 0.0511 SOL | Direct to 37Xxihfs + DBmx | Balance >2 SOL |
| `Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y` | Nov 30 Deployer | 0.0209 SOL | Known deployer | Balance >1 SOL |
| `4yWaU1QrwteHi1gixoFehknRP9a61T5PhAfM6ED3U2bs` | Profit Extraction | Low | Active Jan 9 | ANY activity |

### Tier 3 - INTEL (Insider Monitoring)
| Wallet | Role | Balance (Jan 16) | Notes |
|--------|------|------------------|-------|
| `H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot` | 3-token Insider | 0.35 SOL | 8 sec buy speed, independent |

### REMOVED from Watchlist (Jan 16)
| Wallet | Reason |
|--------|--------|
| `Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT` | Did NOT buy RXRP - confirmed |
| `9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF` | ROOT - Dormant since Jun 2025 |
| `HVRcXaCFyUFG7iZLm3T1Qn8ZGDMHj3P3BpezUfWfRf2x` | Trading bot - not predictive |
| `Ed4UGBWKgQBrPPgfMVejG5uLTK7qcLvMM2WgmrHvroLL` | Trading bot - not predictive |

### Entity Infrastructure (Reference Only)
| Wallet | Role | Notes |
|--------|------|-------|
| `HVRcXaCFyUFG7iZLm3T1Qn8ZGDMHj3P3BpezUfWfRf2x` | Trading Bot | Funded v49j, 3650 SOL |
| `Ed4UGBWKgQBrPPgfMVejG5uLTK7qcLvMM2WgmrHvroLL` | Trading Bot | Funded Bz2yexdH |
| `HDTncsSnBmJWNRXd641Xuh8tYjKXx1xcJq8ACuCZQz52` | Profit Extraction | Received $21K from Bz2y |

---

## Summary

**Primary Detection**: First Funder relationship to chain wallets (37Xxihfs, v49j)

**Secondary Detection**: H3qSndFC activity (if connected), behavioral signature

**Fallback Detection**: Expanded counterparty scan, deep chain trace

**Trust Order**: Wallet signals > Social signals > Timing assumptions

---

*Document will be updated as investigation progresses and new threats are identified.*
