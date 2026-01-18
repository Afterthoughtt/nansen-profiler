# Nansen Profiler - Session Notes

**Last Session**: January 16, 2026 (Evening)
**CONFIRMED Launch**: Sunday, January 18, 2026
**Time to Launch**: ~2 DAYS

---

## Session 10: T-2 Days Final Check (Jan 16, 2026 Evening)

**Goal**: Full pre-launch readiness check, investigate v49j morning activity

### Wallet Status (Jan 16 Evening - 20:52 UTC)

| Wallet | Role | Balance | Change from AM |
|--------|------|---------|----------------|
| **v49j** | Primary Funder | **7.1791 SOL** | Stable (+0 from morning) |
| 37Xxihfs | Original Deployer | 0.0714 SOL | No change |
| GUCX6xNe | Pre-funded Sleeper | 0.0151 SOL | No change |
| Bz2yexdH | Nov30 Deployer | 0.0209 SOL | No change |
| FSbvLdrK | Connected Insider | 0.0511 SOL | No change |
| 4yWaU1Qr | Profit Extraction | 0.0000 SOL | Drained |
| H3qSndFC | 3-token Insider | 0.3496 SOL | No change |

### v49j Activity Analysis (Jan 15-17)

**Inbound (still accumulating)**:
- 0.75 SOL from HVRcXaCF (Trading Bot - known entity infrastructure)
- 0.70 SOL from 52eC8Uy5 ("JETNUT Token Deployer" label - interesting)
- 0.17 SOL from AvGeFw71

**Outbound**: NONE to fresh wallets - deployer NOT funded yet

### Fresh Wallet Discovery

Ran `npm run alt-paths` - found 1 candidate:
- **AyKGqBppiGDR** - First Funder IS v49j (deployer chain)
- BUT: Only 0.001 SOL, created & closed Jan 15
- **Assessment**: Test/dust cleanup wallet, NOT deployer

### Key Findings

1. **v49j still at 7.18 SOL** - no change from this morning
2. **NO deployer has been funded** - expected 2-3 hours before launch
3. **All other wallets dormant** - no activity on Tier 1/2/3 wallets
4. **Entity infrastructure active** - trading bots moving money to v49j
5. **52eC8Uy5 ("JETNUT Token Deployer")** sent 0.70 SOL to v49j - potential connection?

### USDC/USDT Movement Investigation

User flagged v49j USDC transfers:
- 199.2 USDC to E41iCF
- 100 USDC to HRcur4

**E41iCF Investigation**:
- Balance: 0.86 SOL + 200 USDC
- First Funder: 5bNCz3Z7 (NOT in deployer chain)
- Assessment: Operational/trading wallet, NOT deployer

**HRcur4 Investigation**:
- Balance: 3.62 SOL + 799 USDC + 1666 USDT
- First Funder: Ciwuet8g (GOATGUY Token Deployer)
- Chain trace: HRcur4 → GOATGUY → BOOMAS → Magic Eden user
- Assessment: Different token deployer chain, NOT connected to our entity

**Conclusion**: USDC transfers are to operational/trading wallets, not deployer prep.
BUT: Scripts updated to monitor ALL token movements (SOL + USDC + USDT) going forward.

### Scripts Created/Updated
- `src/investigate-v49j-today.ts` - v49j activity check
- `src/full-prelaunch-check.ts` - Comprehensive wallet status (NOW WITH USDC/USDT)
- `src/quick-status.ts` - Updated with USDC/USDT display
- `src/check-fresh-candidate.ts` - Fresh wallet investigation
- `src/investigate-usdc-recipients.ts` - USDC recipient investigation
- `src/trace-hrcur4-chain.ts` - HRcur4 First Funder chain trace
- `src/check-hrcur4.ts` - HRcur4 wallet investigation

### Launch Readiness

| Check | Status |
|-------|--------|
| v49j approaching threshold (8-15 SOL) | ⚠️ At 7.18 SOL |
| Deployer funded | ❌ NOT YET |
| Fresh wallet detected | ❌ None found |
| Insider activity | ❌ None |
| Expected timing | Deployer funding 2-3 hours before launch |

### Confidence Level
**90%** - Will detect deployer through:
1. v49j sends >5 SOL to fresh wallet
2. Fresh wallet First Funder = v49j or 37Xxihfs
3. FSbvLdrK gets funded (secondary signal)

### Next Actions
1. **Morning Jan 17**: Run `npm run status`
2. **Jan 17 evening**: Full check - expect v49j to hit 8+ SOL
3. **Jan 18 morning (6 AM Pacific)**: HIGH ALERT - watch for deployer funding
4. **Launch window**: 10 AM - 12 PM Pacific

---

## Session 9: Deep Investigation - Fill All Blind Spots (Jan 16, 2026)

**Goal**: Leave nothing to chance before Jan 18 launch

### Wallet Status (Jan 16)

| Wallet | Jan 15 | Jan 16 | Change |
|--------|--------|--------|--------|
| **v49j** | 7.0352 | **7.1793** | +0.14 SOL (still accumulating) |
| 37Xxihfs | 0.0714 | 0.0714 | No change |
| GUCX6xNe | 0.0151 | 0.0151 | No change |
| Bz2yexdH | 0.0209 | 0.0209 | No change |

### Critical Discoveries

**1. v49j Has NOT Funded Deployer Yet**
- All outbound is to trading bots/liquidity pools
- Still accumulating - deployer funding imminent

**2. FSbvLdrK is MORE Connected**
- Traces to Coinbase Hot Wallet (same as deployers)
- DIRECT counterparty with 37Xxihfs ($273 OUT)
- Also traded with DBmxMiP8 (known deployer)

**3. 2NuAgVk3 Whale EXTREMELY ACTIVE**
- 309.81 SOL ($44K)
- 30 transactions in January
- Active at time of investigation

**4. Profit Extraction Wallet Active Jan 9**
- 4yWaU1Qr was active 7 days ago
- Pass-through: HVRcXaCF → 4yWaU1Qr → Ed4UGBWK
- Entity is active and moving money

**5. Hqf4TZxp Downgrade CONFIRMED**
- Did NOT buy RXRP at all
- Removed from watchlist

**6. Trading Bots = Entity Infrastructure**
- HVRcXaCF: Funded v49j + Sent to profit wallet
- Ed4UGBWK: Funded Bz2yexdH + Received from profit wallet

**7. ROOT Confirmed Dormant**
- 0.0035 SOL, no activity since June 2025
- Removed from watchlist

### Updated Watchlist (7 wallets)

**Tier 1 (Critical):** v49j, 37Xxihfs, GUCX6xNe
**Tier 2 (High):** FSbvLdrK (UPGRADED), Bz2yexdH, 4yWaU1Qr
**Tier 3 (Intel):** H3qSndFC (3-token insider, 8 sec buy speed)

**Removed:** Hqf4TZxp, ROOT, HVRcXaCF, Ed4UGBWK, 2NuAgVk3 (just a whale, too noisy)

### Scripts Created
- `src/trace-unexplored.ts`
- `src/deep-investigation.ts`
- `src/check-hqf4-rxrp.ts`
- `src/explain-profit-extraction.ts`

### Confidence Level
90% we will detect deployer through v49j outbound or FSbvLdrK funding

---

## Session 8: Pre-Launch Check & Phase B Completion (Jan 15, 2026)

**🚨 PRE-LAUNCH SIGNAL DETECTED**: v49j now has 7.0352 SOL!

### Wallet Status (Jan 15)

| Wallet | Jan 8 | Jan 15 | Change |
|--------|-------|--------|--------|
| 37Xxihfs | 0.0714 | 0.0714 | No change |
| **v49j** | **0.0272** | **7.0352** | **+7.0 SOL** 🚨 |
| GUCX6xNe | 0.0151 | 0.0151 | No change |
| Bz2yexdH | 0.0209 | 0.0209 | No change |

### v49j Funding Investigation

v49j received ~7 SOL since Jan 8:
- Main source: HVRcXaCF (Trading Bot) - $1,676.67 IN
- Approaching deployer threshold (8-15 SOL)
- **This is a PRE-LAUNCH SIGNAL for Jan 18!**

### Insider Activity Check

| Insider | Balance | Jan Activity | Status |
|---------|---------|--------------|--------|
| H3qSndFC | 0.35 SOL | 0 txns | Low |
| FSbvLdrK | 0.05 SOL | 0 txns | Low |
| **2NuAgVk3** | **350.12 SOL** | **20 txns** | **Active whale** |

### Phase B Completion

Bz2yexdH counterparty analysis confirmed:
- Child wallets: 4yWaU1Qr ($47K), HDTncsSn ($21K)
- Deployers share funds between each other

### Contingency Playbook Updates

- Threat #6 (H3qSndFC): ✅ COMPLETE - INDEPENDENT
- Threat #8 (Insider rotation): ✅ COMPLETE - FSbvLdrK CONNECTED

### Final Telegram Bot Watchlist (7 wallets)

**Tier 1 (Critical):** v49j, 37Xxihfs, GUCX6xNe
**Tier 2 (High):** Bz2yexdH, FSbvLdrK, 4yWaU1Qr
**Tier 3 (Intel):** H3qSndFC

### Scripts Created

- `src/check-v49j-funding.ts` - v49j funding investigation
- `src/check-insider-status.ts` - Insider activity check

### API Timeout Fix

Nansen API was timing out on counterparty queries with 2-year date range.

**Root Cause**: `DATES.FULL_HISTORY` used 2025-01-01 to 2026-12-31 (2 years)

**Solution**: Created dynamic 90-day windows in `dates.ts`:
- `DATES.RECENT_90D` - Rolling 90-day window
- `DATES.RECENT_30D` - Rolling 30-day window (fallback)

**Files Updated**:
- `src/config/dates.ts` - Added dynamic getters
- `src/alternative-paths.ts` - 7 usages updated
- `src/nansen-client.ts` - 3 helper methods updated
- `src/quick-status.ts` - Updated

**Test Result**: `npm run alt-paths` now completes without timeout.

### Status

All pre-launch preparations complete. Ready for Jan 18.

---

## Session 7: RXRP Deep-Dive Analysis (Jan 7, 2026)

Comprehensive post-mortem of RXRP (RainXRP) launch - first 30 seconds buyer analysis.

### RXRP First 30 Seconds Analysis

**Stats:**
- **89 unique buyers** in first 30 seconds
- **$21,502 total volume**
- First trade: Nov 30, 2025 @ 23:43:26 UTC

**Buyer Categories:**
| Category | Count | Notes |
|----------|-------|-------|
| USER | 4 | 321Ct, Dc5s, 9iUb, D8ZB (your wallets) |
| INSIDER | 1 | H3qSndFC (8s, $396) |
| CONNECTED | 1 | Bz2yexdH (deployer dev-buy, 0s, $2842) |
| UNKNOWN | 83 | No chain connections found |

**Result**: No NEW chain-connected insiders found in first 30s window.

### Bz2yexdH (RXRP Deployer) Counterparties

**Funding Sources (INTO deployer):**
| Source | Amount | Notes |
|--------|--------|-------|
| Ed4UGBWK (Trading Bot) | $63,085 | Largest funder - intermediary |
| 37Xxihfs (known) | $6,672 | DogwifXRP deployer |
| D7MsVpaX (XRPEP3 deployer) | $1,266 | Deployers share funds |
| v49j (known) | $383 | Primary funder |

**Key Finding**: Ed4UGBWK trading bot was largest funder. Deployers share funds between each other.

**Recipients (OUT from deployer):**
| Recipient | Amount | First Funder |
|-----------|--------|--------------|
| 4yWaU1Qr | $46,992 | Bz2yexdH (child wallet) |
| HDTncsSn | $21,505 | Bz2yexdH (child wallet) |
| Bra1HUNK | $2,382 | Different whale (INDEPENDENT) |

### FSbvLdrK Investigation (Saved to JSON)

**Funding Chain:**
```
FSbvLdrK → DfwNaPDh → 91CuNTxy (BloomBot) → GJRs4FwH (Coinbase Hot Wallet)
```

**Verdict**: CONNECTED (Score: 80/100)
**Reason**: Funded via same Coinbase hot wallet as deployer chain

### Scripts Created
- `src/rxrp-early-buyers.ts` - First 30s buyer extraction with chain analysis
- `src/rxrp-deployer-counterparties.ts` - Deployer relationship mapping
- `src/investigate-fsbvldrk.ts` - FSbvLdrK deep investigation

### Data Files Created
- `data/analysis/rxrp-first-30s-buyers.json` - All 89 buyers with categories
- `data/analysis/rxrp-deployer-counterparties.json` - Bz2yexdH interactions
- `data/analysis/fsbvldrk-investigation.json` - FSbvLdrK funding chain

### Key Takeaways for January Launch
1. H3qSndFC remains the only confirmed 3-token insider (independent)
2. FSbvLdrK confirmed connected to deployer chain via Coinbase
3. No new chain-connected insiders found in RXRP first 30s
4. Deployers share funds - watch Ed4UGBWK trading bot as potential signal

---

## Session 6: Deep Investigation (Jan 8, 2026)

Comprehensive investigation session following playbook pre-investigation checklist.

### Investigations Completed

**1. H3qSndFC Investigation (Threat #6)**
- Connection Score: 0/100
- Verdict: **INDEPENDENT** - Not connected to deployer chain
- Funding: Crypto.com → Binance origin (NOT Coinbase)
- Action: Competitor only, not a leading indicator

**2. Sleeper Wallet Inventory (Threat #3)**
- All 4 chain-funded wallets verified (D7Ms, DBmx, Bz2y, GUCX)
- No NEW unknown sleepers found
- GUCX remains only unused sleeper (0.015 SOL)

**3. 2-Token Insider Investigation**
| Insider | Funding Origin | Verdict |
|---------|----------------|---------|
| **FSbvLdrK** | → Coinbase Hot Wallet | **CONNECTED!** |
| 2NuAgVk3 | → PYTH / Trading bots | Independent (871 SOL whale) |

**Key Finding**: FSbvLdrK traces to same Coinbase origin as deployer chain!

**4. CHOCO Investigation**
- Dead end - dormant wallet, $0 balance, 0 transactions
- Not relevant to our investigation

### Scripts Created
- `src/investigate-h3qsndfc.ts` - Insider chain investigation
- `src/sleeper-inventory.ts` - Chain-funded wallet discovery
- `src/quick-query.ts` - Ad-hoc query utility

### Wallet Status (Jan 8)
| Wallet | Balance | Change from Jan 3 |
|--------|---------|-------------------|
| 37Xxihfs | 0.0714 SOL | No change |
| v49j | 0.0272 SOL | -0.28 (trading) |
| GUCX6xNe | 0.0151 SOL | No change |
| Bz2yexdH | 0.0209 SOL | No change |

**Status**: No deployer funded. All wallets < 0.1 SOL.

### Updated Monitoring Priority
1. v49j / 37Xxihfs - Primary signal (deployer funders)
2. Bz2yexdH / GUCX - Reuse detection
3. **FSbvLdrK** - Secondary indicator (connected insider)
4. H3qSndFC - Competitive only

---

## Session 5: Refactoring Review (Jan 8, 2026)

Reviewed phases 1-3 (all verified complete) and assessed remaining phases 4-6.

**Phases 4-6 Assessment**:
- Phase 4 (error handling): Current "return empty array" pattern is intentional for resilience
- Phase 5 (types cleanup): Legacy fields documented, `any` usage acceptable
- Phase 6 (script renaming): Names are semantically meaningful; renaming adds no value

**Decision**: Phases 4-6 skipped as low-value. Refactoring work complete.

---

## Session 4: Codebase Audit & Refactor (Jan 7, 2026)

Comprehensive audit and refactor to improve code organization and maintainability.

### Completed

#### Phase 1: Minimal Cleanup ✅
- Deleted 3 duplicate JSON files (date-prefixed older versions):
  - `data/analysis/2025-11-30_insider-hunt-v2.json`
  - `data/analysis/2025-11-30_insider-v3.json`
  - `data/analysis/2025-11-30_early-buyer-investigation.json`
- Deleted empty `reports/investigation-report.json`
- Renamed `TODO.md` → `SESSION_NOTES.md`

#### Phase 2: Consolidate Config Usage ✅
Updated 4 scripts to import wallet addresses from `src/config/` instead of hardcoding:

| File | Change |
|------|--------|
| `quick-status.ts` | Uses `CONFIG_WALLETS.ORIGINAL_DEPLOYER`, etc. |
| `insider-hunt-v2.ts` | Uses `DEPLOYER_CHAIN`, `ALL_DEPLOYERS`, `USER_WALLETS` |
| `insider-detection-v3.ts` | Uses `WALLETS`, `DEPLOYER_CHAIN`, `ALL_DEPLOYERS`, `TOKENS` |
| `comprehensive-analysis.ts` | Uses `CONFIG_WALLETS.*` |

**Bug fixed**: Token key case mismatch (`TROLLXRP` not `TrollXRP`)

#### Phase 3: Create Shared Utilities ✅
Created `src/utils.ts` with:
- `delay(ms)` - Rate limiting helper
- `parseTimestamp(ts)` - Handles timestamps with/without 'Z' suffix
- `formatAddress(addr, length)` - Abbreviates wallet addresses

Updated 5 files to import from utils (removed duplicate definitions):
- `insider-hunt-v2.ts` - removed `delay()`, `parseTimestamp()`
- `insider-detection-v3.ts` - removed `delay()`, `parseTimestamp()`
- `comprehensive-analysis.ts` - removed `wait()`, now uses `delay()`
- `complete-investigation.ts` - removed `delay()`
- `launch-prediction.ts` - removed `delay()`

### Skipped Phases (Low Value)

After review on Jan 8, phases 4-6 were assessed and skipped:

| Phase | Proposed Change | Reason Skipped |
|-------|-----------------|----------------|
| 4 | Standardize error handling | Current behavior works; "return empty array" is intentional for script resilience |
| 5 | Clean up types.ts | Legacy fields documented, `any` usage acceptable, `RelationType` unsafe for API responses |
| 6 | Rename insider scripts | Names are semantically meaningful ("hunt" vs "detection"); would require doc updates |

**Decision**: Refactoring complete. Focus on high-priority investigation scripts instead.

### Files Created/Modified

```
NEW FILES:
  src/utils.ts (shared utilities)

MODIFIED FILES:
  src/quick-status.ts (config imports)
  src/insider-hunt-v2.ts (config + utils imports)
  src/insider-detection-v3.ts (config + utils imports)
  src/comprehensive-analysis.ts (config + utils imports)
  src/complete-investigation.ts (utils import)
  src/launch-prediction.ts (utils import)

DELETED FILES:
  data/analysis/2025-11-30_insider-hunt-v2.json
  data/analysis/2025-11-30_insider-v3.json
  data/analysis/2025-11-30_early-buyer-investigation.json
  reports/investigation-report.json

RENAMED FILES:
  TODO.md → SESSION_NOTES.md
```

---

## Session 3: Documentation & Cleanup (Jan 6, 2026)

Major documentation and codebase cleanup session.

### 1. CLAUDE.md Files Created

**Project CLAUDE.md** (`/CLAUDE.md`):
- Role: "Senior Blockchain Forensics Investigator"
- Tech stack, structure, commands documented
- API notes (rate limits, gotchas)
- @imports to master_report.md and jan_2026_investigation.md

**Global CLAUDE.md Updated** (`~/.claude/CLAUDE.md`):
- Trimmed from 93 → 54 lines
- Removed project-specific content (React/Tailwind/Netlify)
- Added Agent Configuration: **ALWAYS use Opus for subagents**

**Template Created** (`~/.claude/templates/react-frontend-stack.md`):
- React/Vite/Tailwind/Netlify stack for copy-paste into projects

### 2. CONTINGENCY_PLAYBOOK.md Created

9 threats identified with response protocols:

| # | Threat | Likelihood | Impact |
|---|--------|------------|--------|
| 1 | New funding chain | Medium | CRITICAL |
| 2 | Exchange direct funding | Low | CRITICAL |
| 3 | Sleeper wallet activation | HIGH | Medium |
| 4 | Multiple hop obfuscation | Medium | Medium |
| 5 | Timing variation | Medium | Low |
| 6 | H3qSndFC connection unknown | N/A | STRATEGIC |
| 7 | Bz2yexdH reuse | Medium | Low |
| 8 | Insider rotation | Medium | Medium |
| 9 | No announcement launch | Low | High |

### 3. Major Codebase Cleanup

**Before**: 57 scripts in src/
**After**: 23 active scripts + 34 archived

**Moved to archive**:
- 12 investigate-*.ts (concluded investigations)
- 8 check-*.ts (one-off checks)
- 7 find-*/compare-*/direct-*.ts (superseded)
- 3 debug-*/test-wider-range.ts
- 4 quick-check/urgent-check/verify-deployer/thorough-investigation.ts

**Deleted** (old archive - pre-refactoring backups):
- 24 outdated script versions

### 4. package.json Cleaned

**Removed**:
- `dev` - referenced non-existent index.ts
- `start` - referenced non-existent dist/index.js
- `test:*` shortcuts - can still run with `npx tsx`
- `pre-launch:report` - unused variant

**Kept** (18 scripts): status, predict, alt-paths, insider, insider-v3, thorough-insider, verify, complete, comprehensive, pre-launch, analyze, timing, launch-window, network, tokens, balance, signers, build

### 5. Files Reference (Updated)

| Purpose | Location |
|---------|----------|
| Project instructions | `/CLAUDE.md` |
| Contingency plans | `/CONTINGENCY_PLAYBOOK.md` |
| Investigation tracking | `/JAN_2026_INVESTIGATION.md` |
| Full history | `/MASTER_REPORT.md` |
| API documentation | `/Nansen_Docs.MD` |
| Session notes | `/SESSION_NOTES.md` (this file) |

---

## Next Steps (Before Jan 12 Launch)

### HIGH Priority Scripts to Build
| Script | Purpose | Threat |
|--------|---------|--------|
| `investigate-h3qsndfc.ts` | Confirm insider connection | #1, #6 |
| `sleeper-inventory.ts` | Find all chain-funded wallets | #3 |

### MEDIUM Priority
| Script | Purpose | Threat |
|--------|---------|--------|
| Update `insider-hunt-v2.ts` | Include RXRP in analysis | #8 |
| `expanded-counterparty-scan.ts` | Map chain relationships | #1, #4 |

### Daily Monitoring (Jan 8+)
- [ ] Run `npm run status` daily
- [ ] Watch for v49j/37Xxihfs outbound SOL > 5
- [ ] Check H3qSndFC balance changes

---

## Session 2: Review & Fixes (Jan 4, 2026)

Thorough review of previous session's work found and fixed these issues:

### Issues Fixed

1. **nansen-client.ts** - 2 hardcoded "2020-01-01" dates
   - Line 107: `getFundingSources()` - now uses `DATES.FULL_HISTORY.from`
   - Line 335: `isWalletFresh()` - now uses `DATES.FULL_HISTORY.from`

2. **6 Check Scripts** - Added missing DATES import
   - `check-nov2-funding.ts`
   - `check-insider-bot.ts`
   - `check-funding-sources.ts`
   - `check-37x-inbound.ts`
   - `check-other-recipients.ts`
   - `check-recent-funding.ts`

3. **types.ts** - Fixed API spec mismatches
   - `NansenTransactionsRequest.date.from/to` - Made required (was optional)
   - `NansenTGMWhoBoughtSoldRequest` - Removed unused `date` field

### Verified
- `npm run status` works correctly
- No remaining hardcoded "2025-12-31" dates in main src/

---

## Session 1: Centralized Configuration (Jan 4, 2026)

### 1. Centralized Configuration (COMPLETED)

Created `src/config/` directory with:

- **`dates.ts`** - Single date range: `{ from: "2025-01-01", to: "2026-12-31" }`
- **`wallets.ts`** - All wallet addresses (deployer chain, insiders, users)
- **`tokens.ts`** - All 6 token records with addresses, tickers, launch dates
- **`index.ts`** - Single export point for all config

### 2. Fixed Hardcoded Dates (COMPLETED)

- Backed up 26 original scripts to `src/archive/`
- Updated 45+ hardcoded date patterns across the codebase
- All scripts now import `DATES.FULL_HISTORY` from config
- Tested with `npm run status` - working

### 3. Files Changed

```
NEW FILES:
  src/config/index.ts
  src/config/dates.ts
  src/config/wallets.ts
  src/config/tokens.ts
  src/archive/ (26 backup files)

MODIFIED FILES:
  src/nansen-client.ts (added DATES import, uses DATES.FULL_HISTORY)
  src/quick-status.ts
  src/alternative-paths.ts
  src/timing-analysis.ts
  src/analyze.ts
  src/comprehensive-analysis.ts
  src/complete-investigation.ts
  src/deep-verification.ts
  src/thorough-investigation.ts
  src/thorough-insider-investigation.ts
  src/investigate-*.ts (all investigation scripts)
  src/check-*.ts (all check scripts)
  src/trace-insider-funding.ts
  src/verify-deployer.ts
  src/urgent-check.ts
  src/quick-check.ts
  src/test-counterparties.ts
  src/find-actual-funding.ts
```

---

## What's Left To Do

### Before January 8 (Daily Monitoring Starts)
- [ ] Run `npm run status` daily to check wallet balances
- [ ] Watch for v49j/37Xxihfs outbound SOL > 5

### Refactoring (Session 4 - COMPLETE)
- [x] ~~Update scripts to use `WALLETS` from config~~ ✅ Phase 2 complete
- [x] ~~Update scripts to use `TOKENS` from config~~ ✅ Phase 2 complete
- [x] ~~Consolidate duplicate utility functions~~ ✅ Phase 3 complete
- [x] ~~Phases 4-6~~ Skipped (low value) - see Session 4 notes

### Future Enhancements (Lower Priority)
- [ ] Add new API endpoints from docs:
  - `/search/entity-name` (FREE)
  - `/tgm/flow-intelligence` (1 credit)
  - `/profiler/address/pnl-summary` (1 credit)

### Notes for Future Sessions
- User has Nansen Telegram bot for alerts (no need to build monitoring)
- User tracks API credits via Nansen dashboard (no need to track in code)
- Archive folder contains original scripts before date fixes
- Date range is now 2025-01-01 to 2026-12-31 (update when entering 2027)

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Date config | `src/config/dates.ts` |
| Wallet addresses | `src/config/wallets.ts` |
| Token info | `src/config/tokens.ts` |
| Shared utilities | `src/utils.ts` |
| API client | `src/nansen-client.ts` |
| Quick status | `src/quick-status.ts` (`npm run status`) |
| Pre-launch | `src/pre-launch-analysis.ts` (`npm run pre-launch`) |
| Fresh wallets | `src/alternative-paths.ts` (`npm run alt-paths`) |
| Insider hunt | `src/insider-hunt-v2.ts` (`npm run insider`) |

---

## Investigation Status

| Item | Status |
|------|--------|
| H3qSndFC (3-token insider) | CONFIRMED - Monitor for Jan launch |
| Hqf4TZxp | DOWNGRADED - Didn't buy RXRP |
| Fresh deployer funded | NOT YET (expected 2-3 hours before launch) |
| All wallets low balance | YES (<0.5 SOL) - Normal for 7+ days before |

---

## Commands

```bash
npm run status      # Quick wallet balance check
npm run pre-launch  # Full pre-launch analysis
npm run alt-paths   # Fresh wallet detection
npm run insider     # Insider detection v2
npm run predict     # Timing prediction
```

---

*See `JAN_2026_INVESTIGATION.md` for detailed investigation tracking.*
*See `MASTER_REPORT.md` for full investigation history.*
