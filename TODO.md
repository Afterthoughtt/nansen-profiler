# Nansen Profiler - Session Notes

**Last Session**: January 6, 2026
**Next Launch**: January 12 or 19, 2026 (Sunday)

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
| Session notes | `/TODO.md` (this file) |

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

### Future Refactoring (Lower Priority)
- [ ] Update scripts to use `WALLETS` from config (currently still have local wallet constants)
- [ ] Update scripts to use `TOKENS` from config
- [ ] Consider consolidating duplicate investigation scripts
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
