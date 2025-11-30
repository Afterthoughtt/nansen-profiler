# Nov 29th Pre-Launch Todo List

**Target Launch:** Sunday, November 30th, 2025
**Preparation Day:** Saturday, November 29th, 2025

---

## Setup & Verification

- [ ] Verify `NANSEN_API_KEY` is set in `.env`
- [ ] Ensure sufficient API credits (~450 needed for full analysis)
- [ ] Verify all dependencies installed: `npm install`

---

## Run Full Analysis

```bash
# Run all 6 analysis modules + generate report
npm run pre-launch
```

**Estimated Time:** 15-20 minutes (includes rate limiting delays)

### Individual Scripts (if needed)

| Script | Command | Output |
|--------|---------|--------|
| Timing Analysis | `npm run timing` | `timing-playbook.json` |
| Alternative Paths | `npm run alt-paths` | `alternative-paths.json` |
| Network Graph | `npm run network` | `network-graph.json` |
| Token Analysis | `npm run tokens` | `token-intelligence.json` |
| Historical Balance | `npm run balance` | `historical-balance.json` |
| Signer Analysis | `npm run signers` | `signer-analysis.json` |

---

## Review Output Files

All outputs saved to `data/analysis/`

- [ ] **timing-playbook.json** - Funding → deployment time patterns
  - Check average time delta between funding and deployment
  - Note typical launch hour (UTC) and day of week

- [ ] **alternative-paths.json** - Fresh wallet candidates & CEX fallback
  - Review any fresh wallets funded by v49j in November
  - Check ROOT direct funding probability
  - Verify CEX fallback assessment

- [ ] **network-graph.json** - Complete wallet relationship map
  - Review all nodes and their roles
  - Check edge relationships (First Funder, Signer, etc.)

- [ ] **token-intelligence.json** - Token holder & early buyer analysis
  - Look for wallets that bought both XRPEP3 and TrollXRP early
  - Note any potential insider addresses

- [ ] **historical-balance.json** - SOL balance changes around launches
  - Check pre-launch inflow/outflow patterns
  - Identify any reliable balance-based signals

- [ ] **signer-analysis.json** - Shared signer clusters
  - Review entity clusters (shared control = same entity)
  - Note any hidden wallets discovered

---

## Manual Wallet Checks

- [ ] Check v49j for recent outbound activity
  ```
  v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5
  ```
  - Any transfers to fresh wallets?
  - Any unusual activity in past 24-48h?

- [ ] Check ROOT wallet for new LEVEL 1 funding
  ```
  9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF
  ```

---

## Final Report Review

- [ ] Review `PRE_LAUNCH_REPORT_NOV30.md`
- [ ] Verify confidence score is **95%+**
- [ ] Confirm primary monitoring target is correct
- [ ] Review risk assessment probabilities
- [ ] Check timing playbook recommendations

---

## Prepare for Nov 30th Launch

### Monitoring Setup

- [ ] Set up real-time alerts on primary target:
  ```
  v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5
  ```

- [ ] Configure backup monitoring on:
  - ROOT: `9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF`
  - Coinbase: `GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE`

### Sniper Bot Preparation

- [ ] Prepare sniper bot configuration template
- [ ] Set up fresh wallet detection trigger
- [ ] Configure pump.fun token creation monitoring

---

## Key Intelligence Summary

### Primary Target (95% confidence)
```
v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5
```
**Role:** LEVEL 1 Funder - Funds deployer wallets directly

### Known Deployers (Reference)
| Launch | Deployer | Funded By |
|--------|----------|-----------|
| Original | `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` | v49j |
| XRPEP3 (Sep 28) | `D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb` | v49j |
| TrollXRP (Nov 2) | `DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy` | v49j |

### Funding Chain Pattern
```
ROOT → LEVEL 1 (v49j) → Fresh Deployer → pump.fun Token
```

---

## Risk Matrix

| Scenario | Probability | Action |
|----------|-------------|--------|
| v49j funds deployer as expected | 85% | Monitor v49j |
| ROOT uses different LEVEL 1 | 10% | Monitor ROOT |
| Direct CEX funding | 3% | Monitor Coinbase |
| Completely new pattern | 2% | Fresh wallet detection |

---

## Launch Day Signal

**When v49j funds a fresh wallet → HIGH PROBABILITY DEPLOYER**

1. Alert triggers on v49j outbound transaction
2. Verify recipient is fresh wallet (low tx count)
3. Deploy sniper on fresh wallet address
4. Monitor for pump.fun token creation (typically within 1-2 hours)

---

## Notes

_Add any observations or notes during analysis:_

-
-
-

---

**Last Updated:** _Fill in when completed_
**Analysis Status:** Pending
**Confidence Score:** TBD after analysis
