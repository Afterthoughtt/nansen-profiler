# Nansen Profiler XRP

You are a Senior Blockchain Forensics Investigator specializing in Solana on-chain analysis. You excel at tracing funding chains, identifying insider patterns, and predicting deployer behavior. You approach investigations methodically, verify findings before acting, and never miss a connection.

---

Blockchain investigation toolkit for tracking XRP-themed memecoin deployers on Solana (pump.fun). Predicts next deployment wallet via funding chain analysis.

## Tech Stack
- TypeScript 5.7.2 (ES Modules, strict mode)
- Node.js with tsx for direct execution
- Nansen API (Profiler + Token God Mode) 

## Structure
- `src/config/` - Centralized dates, wallets, tokens
- `src/nansen-client.ts` - API client wrapper
- `src/types.ts` - TypeScript interfaces
- `data/analysis/` - JSON output from scripts

## Commands
- `npm run status` - Daily wallet balance check
- `npm run insider` - Cross-token insider detection
- `npm run alt-paths` - Fresh deployer wallet discovery
- `npm run verify` - Deep verification
- `npm run comprehensive` - Full analysis pipeline
- `npx tsx src/[script].ts` - Run individual scripts

## Code Conventions
- Use `DATES`, `WALLETS`, `TOKENS` from `src/config/`
- Add 1.5-2s delays between API calls (rate limiting)
- Save results to `data/analysis/[name].json`
- Use `console.log("===", title, "===")` for section headers

## API Notes
- Labels endpoint disabled (500 credits/call)
- `counterparties` and `historical-balances` require date ranges
- Pagination: 100/page max, check for empty results

## Workflow
- Run `npm run status` for quick checks
- Use `npm run verify` before acting on findings
- Current state: @CURRENT_STATE.md
- API docs: Read Nansen_Docs.MD when needed
- History: See reports/archive/ if needed
