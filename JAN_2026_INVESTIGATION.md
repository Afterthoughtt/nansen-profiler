# January 2026 Launch Investigation

**Started**: January 3, 2026
**Announcement Date**: January 10, 2026
**Expected Launch**: January 12 or 19, 2026 (Sunday)

---

## Progress Tracker

### Phase A: Quick Status Check
- [x] Update deployers.json with RainXRP
- [x] Verify API key works
- [x] Check current wallet balances

### Phase B: RainXRP Post-Mortem
- [x] Validate insider predictions (H3qSndFC, Hqf4TZxp)
- [x] Identify new early buyers/insiders
- [ ] Analyze Bz2yexdH counterparties
- [ ] Document new patterns

### Phase C: Pre-Launch Prediction
- [x] Fresh wallet discovery
- [x] Monitor funder outbound activity
- [ ] Timing prediction update
- [ ] Final deployer candidate list

---

## Key Wallets

### Deployer Chain (Monitor Daily)

| Wallet | Role | Last Balance | Last Checked |
|--------|------|--------------|--------------|
| `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | Original Deployer | 0.0714 SOL | Jan 8, 2026 |
| `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5` | Primary Funder | 0.0272 SOL | Jan 8, 2026 |
| `Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y` | Nov 30 Deployer | 0.0209 SOL | Jan 8, 2026 |
| `GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb` | Pre-funded (unused) | 0.0151 SOL | Jan 8, 2026 |

### Known Insiders (Verified with RXRP)

| Wallet | Score | XRPEP3 | TrollXRP | RainXRP | Notes |
|--------|-------|--------|----------|---------|-------|
| `H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot` | **80/100** | Yes | Yes | **YES (8s)** | **3-TOKEN INSIDER** - $297 spent on RXRP |
| `Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT` | 60/100 | Yes | Yes | No (not in 5min) | May have bought later |

### New Insiders Discovered (from RXRP)

| Wallet | Tokens | Avg Buy Time | Score | Notes |
|--------|--------|--------------|-------|-------|
| `FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE` | XRPEP3, RXRP | 24s | **70%** | **CONNECTED** - Coinbase origin! |
| `2NuAgVk3hcb7s4YvP4GjV5fD8eDvZQv5wuN6ZC8igRfV` | TrollXRP, RXRP | 120s | 40% | Independent (871 SOL whale) |

### User-Owned Wallets (Exclude from Insider List)

| Wallet | RXRP Timing | Spent |
|--------|-------------|-------|
| `321CtfdFHdi7bji3qCBVhFz3B9JJEBpMAVimztUBqkpn` | 1 second | $451.63 |
| `Dc5s8MctjuEex6gKBQjMwUT3JjUZn1mWxeux4VuKoc2w` | 1 second | $782.62 |
| `9iUbP8d55rL1DSyEAU64XyqUzeRggzA5FkYBhNn82nV9` | 1 second | $790.14 |
| `D8ZBeiNNR8w1uX4g3D79PCmN7ht9QBVpWtuZ8jXr14eZ` | 1 second | $775.09 |
| **TOTAL** | | **~$2,800** |

*Faster than H3qSndFC (8s) - excellent execution!*

---

## Token History

| # | Token | Ticker | Deployer | CA | Date |
|---|-------|--------|----------|-------|------|
| 1 | ArkXRP | ARKXRP | 37Xxihfs | `2rQcoMECcsU3UBNfpsUxegnHc9js7usb2XagwUK3pump` | Jun 15, 2025 |
| 2 | DogwifXRP | - | 37Xxihfs | `8mETm8mxyn7gP1igZLv4DryquuYLjcekkrQBVpZpFHvC` | Jul 20, 2025 |
| 3 | WFXRP | WFXRP | 37Xxihfs | `FnzYzrkRL1JLHmxS8QctidKDGJgJRa6BN4QH3hkVpump` | Aug 24, 2025 |
| 4 | XRPEP3 | XRPEP3 | D7MsVpaX | `5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump` | Sep 28, 2025 |
| 5 | TrollXRP | TROLLXRP | DBmxMiP8 | `CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump` | Nov 2, 2025 |
| 6 | RainXRP | RXRP | Bz2yexdH | `3VQU1DgaLE6E49HhqvH73Azsin8gAZRc14cvyV4hpump` | Nov 30, 2025 |
| 7 | ??? | ??? | ??? | ??? | Jan 2026 |

---

## Investigation Log

### January 3, 2026

**Session Start**: Reviewing codebase after 34 days away

**Phase A Complete**:
- Updated `data/deployers.json` with RainXRP entry
- Created this tracking file
- API key verified and working
- Wallet status check complete

**Wallet Status Summary**:
- All wallets have LOW balances (typical for 7+ days before launch)
- 37Xxihfs last active Dec 23 (received 0.1022 SOL on Dec 5)
- v49j has 0.31 SOL - largest balance in the chain
- Bz2yexdH (RXRP deployer) now at 0.02 SOL

**Observation**: Deployer funding typically happens 2-3 hours before launch.
At 7 days before announcement, low balances are expected.

**Next Steps**:
1. Begin Phase B: RainXRP Post-Mortem Analysis
2. Validate insider predictions
3. Search for new patterns

---

**Phase B & C Complete** (21:55 UTC)

**RainXRP Post-Mortem Results**:
- H3qSndFC: CONFIRMED 3-token insider (bought RXRP in 8 seconds, $297)
- Hqf4TZxp: Downgraded (did NOT buy RXRP in first 5 min)
- New insiders found: FSbvLdrK1FuW (XRPEP3+RXRP), 2NuAgVk3hcb7 (TrollXRP+RXRP)
- User wallets confirmed and excluded (321Ct, Dc5s, 9iUb, D8ZB - all bought in 1 second!)

**Phase C Pre-Launch Check**:
- NO fresh deployer funding detected since Nov 30
- This is expected - funding happens 2-3 hours before launch
- All key wallets have low balances (<0.5 SOL)
- Next check: Jan 8, 2026 (daily monitoring begins)

**Status**: Investigation paused until closer to launch date.
Run `npm run status` daily starting Jan 8.

---

### January 8, 2026

**Daily Monitoring Resumes**

**Wallet Status Check**:
| Wallet | Jan 3 | Jan 8 | Change |
|--------|-------|-------|--------|
| 37Xxihfs | 0.0714 | 0.0714 | No change |
| v49j | 0.3087 | 0.0272 | -0.28 SOL |
| GUCX6xNe | 0.0151 | 0.0151 | No change |
| Bz2yexdH | 0.0209 | 0.0209 | No change |

**v49j Balance Drop Investigation**:
Checked v49j counterparties (Dec-Jan). The 0.28 SOL drop was:
- Trading activity (BloomBot)
- Small transfers: $849 to Bra1HUNK, $84 to 37Xxihfs
- NOT deployer funding (would need 8-15 SOL)

**Status**: No deployer wallet has been funded. All wallets < 0.1 SOL.

**Playbook Pre-Investigation Status**:
- [x] H3qSndFC investigation (Threat #6) - COMPLETE
- [x] Sleeper wallet inventory (Threat #3) - COMPLETE
- [x] RXRP cross-token analysis (Threat #8) - Done (Jan 3)

**H3qSndFC Investigation Result**:
- Connection Score: 0/100
- Verdict: **INDEPENDENT** - Not connected to deployer chain
- Funding Origin: Crypto.com → Binance (NOT Coinbase)
- Action: Monitor competitively only, not a leading indicator

**2-Token Insider Investigation** (Jan 8):
| Insider | Tokens | Funding Origin | Balance | Verdict |
|---------|--------|----------------|---------|---------|
| **FSbvLdrK** | XRPEP3 + RXRP | → Coinbase Hot Wallet | 0.05 SOL | **CONNECTED** |
| 2NuAgVk3 | TrollXRP + RXRP | → PYTH / Trading bots | 871 SOL | Independent (whale) |

**FSbvLdrK is CONNECTED to deployer chain!**
- Funding trace: FSbvLdrK → DfwNaPDh → 91CuNTxy (BloomBot) → **GJRs4FwH (Coinbase Hot Wallet)**
- Same Coinbase origin as our deployer chain
- Could be used as secondary leading indicator

**Sleeper Wallet Inventory Result**:
All chain-funded wallets verified:
| Deployer | First Funder | Status |
|----------|--------------|--------|
| D7Ms | v49j | Known deployer |
| DBmx | v49j | Known deployer |
| Bz2y | 37Xxihfs | Known deployer |
| GUCX | v49j | **Sleeper (0.015 SOL)** |

No NEW unknown sleeper wallets found. GUCX remains the only unused chain-funded wallet.

**Scripts Created**:
- `src/investigate-h3qsndfc.ts` - Insider chain investigation
- `src/sleeper-inventory.ts` - Chain-funded wallet discovery
- `src/quick-query.ts` - Ad-hoc query utility

**Next**: Daily monitoring (`npm run status`) until launch.

---

## RainXRP Post-Mortem Findings

**Analysis Date**: January 3, 2026
**Token**: RainXRP (RXRP)
**CA**: `3VQU1DgaLE6E49HhqvH73Azsin8gAZRc14cvyV4hpump`

### Trading Stats
- **First Trade**: Nov 30, 2025 @ 23:43:26 UTC
- **Early Buyers (5min window)**: 172 unique wallets
- **Trades in Window**: 489
- **Earliest Buy**: 1 second after first trade

### Insider Validation Results

| Known Insider | Bought RXRP? | Timing | Spent | Verdict |
|---------------|--------------|--------|-------|---------|
| H3qSndFC | **YES** | 8 seconds | $297 | **CONFIRMED 3-TOKEN INSIDER** |
| Hqf4TZxp | No (not in 5min) | N/A | N/A | Downgraded - may have stopped |

### New Cross-Token Insiders Found

| Wallet | Pattern | Avg Speed | Priority |
|--------|---------|-----------|----------|
| `FSbvLdrK1FuW...` | XRPEP3 + RXRP | 24s | HIGH |
| `2NuAgVk3hcb7...` | TrollXRP + RXRP | 120s | MEDIUM |

### Deployer (Bz2yexdH) Analysis
- **First Funder**: 37Xxihfs (confirmed)
- **Secondary Funder**: v49j (confirmed)
- **Current Balance**: 0.0209 SOL
- **Counterparties**: *pending deeper analysis*
- **Side Wallets**: *pending deeper analysis*

### Key Insight
H3qSndFC continues to be an active insider - bought within 8 seconds of RXRP's first trade. This wallet should be monitored for the January launch.

**Upgraded Watchlist**:
1. `H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot` - 3-token insider (HIGHEST priority)
2. `FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE` - 2-token insider
3. `2NuAgVk3hcb7s4YvP4GjV5fD8eDvZQv5wuN6ZC8igRfV` - 2-token insider

---

## January 2026 Prediction

### Current Status (Jan 3, 2026)

**No fresh deployer wallet has been funded yet.** This is expected - funding typically happens 2-3 hours before launch.

| Check | Result |
|-------|--------|
| 37Xxihfs outbound (since Nov 30) | No significant transfers |
| v49j outbound (since Nov 30) | No significant transfers |
| Fresh wallet candidates | None detected |
| Insider activity | H3qSndFC last seen Nov 30 |

### Possible Scenarios

| Scenario | Probability | Signal to Watch |
|----------|-------------|-----------------|
| New fresh wallet funded | 60% | v49j or 37Xxihfs sends 8-15 SOL |
| Reuse Bz2yexdH (RXRP) | 25% | Bz2yexdH receives new funding |
| Reuse GUCX6xNe (pre-funded) | 10% | Any activity on GUCX6xNe |
| New pattern | 5% | Unknown |

### Confidence Assessment
- **Current Confidence**: 30% (waiting for funding signal)
- **Target Confidence**: 90%+
- **Confidence will increase when**: Fresh wallet receives 8-15 SOL from chain

### Timing Prediction
- **Announcement**: Jan 10, 2026
- **Expected Launch**: Jan 12 (Sunday) or Jan 19 (Sunday)
- **Launch Window**: 10 AM - 12 PM Pacific
- **Funding Signal**: 2-3 hours before launch

### Action Items
1. Run `npm run status` daily starting Jan 8
2. Watch for v49j/37Xxihfs outbound SOL > 5
3. When funding detected, verify First Funder = deployer chain

---

## Quick Reference

### Commands
```bash
npm run status        # Wallet balances
npm run pre-launch    # Full analysis
npm run insider       # Insider detection
npm run alt-paths     # Fresh wallet discovery
npm run predict       # Timing prediction
```

### Success Signals
1. Fresh wallet, First Funder = 37Xxihfs or v49j
2. Balance: 8-15 SOL
3. Minimal transactions
4. Funded 2-3 hours before launch

### Launch Window
- Day: Sunday
- Time: 10 AM - 12 PM Pacific
- Funding signal: 2-3 hours before
