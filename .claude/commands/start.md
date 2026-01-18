# Session Start: Nansen Profiler XRP

You are resuming work on the Nansen Profiler XRP investigation - a blockchain forensics project tracking XRP-themed memecoin deployers on Solana (pump.fun).

## First Steps

1. Read `CURRENT_STATE.md` for current wallet watchlist and status
2. Run `npm run status` to check live wallet balances

## Key Files

| File | Purpose |
|------|---------|
| `CURRENT_STATE.md` | **Current watchlist, balances, findings** (read this first) |
| `CONTINGENCY_PLAYBOOK.md` | Threat scenarios and responses |
| `Nansen_Docs.MD` | API endpoint reference |
| `src/config/wallets.ts` | All wallet addresses in code |
| `reports/archive/` | Historical investigation reports |

## Key Commands

```bash
npm run status      # Check all wallet balances
npm run alt-paths   # Find fresh wallet candidates
npx tsx src/[script].ts  # Run any script directly
```

## Success Signal

Fresh wallet with:
- First Funder = known funder (v49j, 37Xxihfs, or current funder)
- Balance = 8-15 SOL
- Minimal transaction history

## Project Structure

- `src/config/` - Centralized wallets, tokens, dates
- `src/nansen-client.ts` - API client
- `src/quick-status.ts` - Daily monitoring
- `data/analysis/` - JSON output files

---

Now read `CURRENT_STATE.md` for current status.
