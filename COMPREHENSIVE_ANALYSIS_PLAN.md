# Comprehensive Analysis Plan - Maximum Confidence Investigation

**Date**: November 14, 2025
**Objective**: Achieve 95%+ certainty on funding source identification
**Status**: Ready for execution
**Credit Constraint**: None (credits are cheap, use as needed)

---

## Executive Summary

This enhanced investigation goes beyond the initial findings to validate the primary funding source (v49jgwyQ...) and identify all potential alternative funding sources. By analyzing transaction history, counterparties, related wallets, and timing patterns across the entire wallet ecosystem, we will achieve maximum confidence in our monitoring strategy.

**Current Findings**:
- ✅ Both fresh deployers funded by v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5
- ⚠️ Risk: Entity could switch to CEX funding or use alternative wallet
- 🎯 Goal: Validate v49jgwyQ... as primary AND identify backup sources

---

## Analysis Phases

### Phase 1: Primary Target Deep Dive (v49jgwyQ...)

**Wallet**: `v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5`

**Objective**: Validate this wallet is the consistent, active primary funder

**Analysis Steps**:

1. **Transaction History Analysis**
   - Endpoint: `/api/v1/profiler/address/transactions`
   - Date Range: 2025-01-01 to 2025-12-31 (full year)
   - Parameters:
     ```json
     {
       "address": "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
       "chain": "solana",
       "date": { "from": "2025-01-01", "to": "2025-12-31" },
       "pagination": { "page": 1, "per_page": 100 }
     }
     ```
   - **Extract**:
     - All addresses it has funded (outbound transactions)
     - Transaction timestamps (identify activity patterns)
     - Transaction amounts (typical funding amounts)
     - Frequency of activity (daily/weekly/sporadic)
   - **Validate**:
     - Did it fund ONLY the 2 known deployers or others?
     - Are there other fresh wallets funded in 2025?
     - What is the timing pattern (time of day, day of week)?
   - **Cost**: ~50 credits

2. **Counterparty Analysis**
   - Endpoint: `/api/v1/profiler/address/counterparties`
   - Parameters:
     ```json
     {
       "address": "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
       "chain": "solana",
       "group_by": "wallet",
       "source_input": "Combined",
       "date": { "from": "2025-01-01", "to": "2025-12-31" },
       "order_by": [{ "field": "total_volume_usd", "direction": "DESC" }]
     }
     ```
   - **Extract**:
     - Top counterparties by volume
     - CEX deposit addresses (Coinbase, Binance, etc.)
     - High-interaction wallets
     - Inbound vs outbound volume patterns
   - **Validate**:
     - Does it receive funds from ROOT (9Z83ZAtd...) consistently?
     - Any other funding sources?
     - CEX relationships for liquidity?
   - **Cost**: ~50 credits

3. **Related Wallets Analysis**
   - Endpoint: `/api/v1/profiler/address/related-wallets`
   - Parameters:
     ```json
     {
       "address": "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
       "chain": "solana",
       "pagination": { "page": 1, "per_page": 20 }
     }
     ```
   - **Extract**:
     - First Funder (should be ROOT 9Z83ZAtd...)
     - Signer relationships (shared control = same entity)
     - Deployed via relationships
     - Any other special relationships
   - **Validate**:
     - Confirms ROOT → v49jgwyQ hierarchy
     - Identifies wallet cluster members
     - Finds wallets under shared control
   - **Cost**: ~50 credits

**Phase 1 Expected Outcomes**:
- ✅ Confirmation v49jgwyQ is active and consistent
- ✅ List of ALL addresses it has funded (potential deployer candidates)
- ✅ Timing patterns for funding activity
- ✅ CEX relationships identified
- ✅ Wallet cluster membership confirmed

**Phase 1 Total Cost**: ~150 credits

---

### Phase 2: ROOT Wallet Analysis (9Z83ZAtd...)

**Wallet**: `9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF`

**Objective**: Determine if ROOT could fund directly, bypassing v49jgwyQ

**Analysis Steps**:

1. **Transaction History of ROOT**
   - Date Range: 2025-01-01 to 2025-12-31
   - **Extract**:
     - ALL addresses funded by ROOT
     - Check if ROOT has funded deployers directly
     - Identify if there are multiple LEVEL 1 wallets
     - Check funding frequency and amounts
   - **Validate**:
     - Does ROOT ONLY fund v49jgwyQ or others?
     - Has ROOT funded fresh wallets directly?
     - Are there alternative LEVEL 1 intermediaries?
   - **Cost**: ~50 credits

2. **Counterparty Analysis of ROOT**
   - **Extract**:
     - All wallets ROOT interacts with
     - CEX relationships (funding source for ROOT itself)
     - High-volume counterparties
     - Identify where ROOT gets its funds
   - **Validate**:
     - Is ROOT funded by CEX or another wallet?
     - What is ROOT's funding source?
     - Alternative LEVEL 1 candidates?
   - **Cost**: ~50 credits

3. **Related Wallets of ROOT**
   - **Extract**:
     - ROOT's own First Funder (if any)
     - Signer relationships
     - Wallet cluster at ROOT level
   - **Validate**:
     - Is there a LEVEL 3 (ROOT's ROOT)?
     - Shared control wallets?
     - Complete funding hierarchy
   - **Cost**: ~50 credits

**Phase 2 Expected Outcomes**:
- ✅ Validate ROOT only funds v49jgwyQ OR identify alternatives
- ✅ Understand ROOT's own funding source
- ✅ Identify if multi-path funding exists (ROOT → multiple LEVEL 1s)
- ✅ Complete funding chain (beyond 2 levels if needed)

**Phase 2 Total Cost**: ~150 credits

---

### Phase 3: CEX Funding Risk Assessment (Coinbase Wallet)

**Wallet**: `GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE` (Coinbase Hot Wallet)

**Objective**: Determine if CEX funding is still active or was one-time initial setup

**Analysis Steps**:

1. **Recent Transaction History (2025)**
   - Date Range: 2025-01-01 to 2025-12-31
   - **Extract**:
     - All addresses funded by Coinbase wallet in 2025
     - Check if it funded any fresh deployers recently
     - Transaction frequency and pattern
   - **Validate**:
     - Is Coinbase wallet still actively funding addresses?
     - Has it funded deployers besides original (37Xx...)?
     - Is it dormant or active?
   - **Cost**: ~50 credits

2. **Counterparty Analysis of Coinbase**
   - **Extract**:
     - All wallets it interacts with
     - Check if original deployer (37Xx...) still receives from it
     - Identify fresh deployer candidates
   - **Validate**:
     - Pattern: CEX used only for initial setup OR ongoing funding?
     - Any recent activity with known deployers?
   - **Cost**: ~50 credits

3. **Related Wallets of Coinbase**
   - **Extract**:
     - Wallets with relationships to this Coinbase address
     - Any deployers in related wallet list?
   - **Validate**:
     - Coinbase wallet's role in ecosystem
   - **Cost**: ~50 credits

**Phase 3 Expected Outcomes**:
- ✅ CEX usage status (active vs dormant)
- ✅ Probability of CEX being used for next launch
- ✅ Backup monitoring requirement for Coinbase wallet

**Phase 3 Total Cost**: ~150 credits

---

### Phase 4: Cross-Deployer Intelligence

**Wallets**: All 3 deployers (37Xx..., D7Ms..., DBmx...)

**Objective**: Find common counterparties and shared funding sources

**Analysis Steps**:

1. **Enhanced Counterparty Comparison**
   - Get detailed counterparties for all 3 deployers (already partially have)
   - Filter for wallets appearing in MULTIPLE deployers' counterparty lists
   - **Extract**:
     - Shared funding sources
     - Common CEX addresses
     - Shared liquidity providers
     - Common interaction patterns
   - **Validate**:
     - Are there funding sources beyond "First Funder"?
     - Common CEX addresses across all?
     - Alternative funding paths?
   - **Cost**: ~100 credits (we already have some data)

2. **Transaction Pattern Comparison**
   - Compare transaction patterns across all deployers
   - **Extract**:
     - Funding amounts (typical SOL received)
     - Timing between funding → first deployment
     - Common transaction methods
   - **Cost**: Minimal (using existing data)

**Phase 4 Expected Outcomes**:
- ✅ Shared counterparty list (backup funding sources)
- ✅ Common CEX addresses (if any)
- ✅ Funding pattern consistency validation

**Phase 4 Total Cost**: ~100 credits

---

### Phase 5: Historical Timing Analysis

**Objective**: Understand exact timing patterns for launch prediction

**Analysis Steps**:

1. **Sep 28, 2025 Launch (XRPEP3)**
   - Deployer: D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb
   - Get transaction history around launch date
   - **Extract**:
     - Exact timestamp: v49jgwyQ funded deployer
     - Exact timestamp: Deployer deployed token
     - Time delta: Funding → Deployment
     - Any pre-funding activity (ROOT → v49jgwyQ timing)
   - **Cost**: ~25 credits

2. **Nov 2, 2025 Launch (TrollXRP)**
   - Deployer: DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy
   - Same analysis as Sep 28
   - **Extract**:
     - Exact timestamps
     - Time deltas
     - Compare with Sep 28 pattern
   - **Cost**: ~25 credits

3. **Pattern Analysis**
   - Compare both launches
   - **Extract**:
     - Average time between funding → deployment
     - Time of day patterns
     - Day of week patterns
     - Any pre-funding signals (balance movements)
   - **Identify**:
     - How much warning time do we have?
     - Can we detect early signals?

**Phase 5 Expected Outcomes**:
- ✅ Exact timing playbook (X hours from funding to deployment)
- ✅ Early warning signals identified
- ✅ Optimal monitoring window refined

**Phase 5 Total Cost**: ~50 credits

---

### Phase 6: Complete Network Expansion

**Objective**: Build complete relationship graph of entire wallet ecosystem

**Analysis Steps**:

1. **Related Wallets for ALL Key Addresses**
   - Get related wallets for:
     - v49jgwyQ (LEVEL 1)
     - 9Z83ZAtd (ROOT)
     - GJRs4FwH (Coinbase)
     - 37Xx (Original deployer)
     - D7Ms (Fresh deployer 1)
     - DBmx (Fresh deployer 2)
   - **Extract**:
     - All "First Funder" relationships
     - All "Signer" relationships (CRITICAL - shared control)
     - All "Deployed via" relationships
     - Build multi-level graph
   - **Validate**:
     - Find wallet clusters
     - Identify shared control wallets (same entity)
     - Map complete funding hierarchy
   - **Cost**: ~150 credits (6 wallets × 25 credits)

2. **Cluster Analysis**
   - Identify wallets with "Signer" relationships to multiple addresses
   - These represent wallets under shared control (same entity)
   - Build entity-level view (not just wallet-level)
   - **Extract**:
     - Core entity wallet cluster
     - Peripheral wallets
     - Multisig or shared control patterns

**Phase 6 Expected Outcomes**:
- ✅ Complete wallet relationship graph
- ✅ Entity-level wallet clusters identified
- ✅ ALL potential funding sources mapped
- ✅ Shared control wallets highlighted

**Phase 6 Total Cost**: ~150 credits

---

### Phase 7: Advanced Intelligence

**Objective**: Extract maximum intelligence from metadata and advanced analysis

**Analysis Steps**:

1. **Smart Money / Label Metadata**
   - Review counterparty and related wallet responses for metadata
   - Look for any labels or tags in responses (not calling label endpoint)
   - **Extract**:
     - Any Smart Money indicators
     - Entity associations
     - Known wallet labels from metadata
   - **Cost**: 0 credits (using existing data)

2. **Volume Pattern Analysis**
   - Analyze volume patterns across counterparties
   - **Extract**:
     - Typical funding amounts
     - Volume spikes before launches
     - Balance movement patterns
   - **Cost**: Minimal (using existing data)

3. **Behavioral Fingerprinting**
   - Compile behavioral characteristics:
     - Transaction timing preferences
     - Amount patterns
     - Method preferences (token types, etc.)
     - Interaction patterns
   - **Use**: Create "fingerprint" to identify future activity

**Phase 7 Expected Outcomes**:
- ✅ Behavioral fingerprint for entity
- ✅ Volume pattern baselines
- ✅ Any Smart Money associations identified

**Phase 7 Total Cost**: ~100 credits

---

## Total Cost Estimate

| Phase | Description | Estimated Credits |
|-------|-------------|-------------------|
| Phase 1 | Primary Target (v49jgwyQ) Deep Dive | 150 |
| Phase 2 | ROOT Wallet Analysis | 150 |
| Phase 3 | CEX Funding Risk Assessment | 150 |
| Phase 4 | Cross-Deployer Intelligence | 100 |
| Phase 5 | Historical Timing Analysis | 50 |
| Phase 6 | Complete Network Expansion | 150 |
| Phase 7 | Advanced Intelligence | 100 |
| **TOTAL** | **All Phases** | **~750 credits** |

**Note**: Actual cost may vary based on:
- Pagination (large result sets requiring multiple calls)
- Follow-up analysis needs
- Additional wallet discoveries

---

## Methodology: Nansen API Endpoint Usage

### Transactions Endpoint
**Purpose**: Historical activity analysis
**Use Cases**:
- Identify all addresses funded by a wallet
- Timing pattern analysis
- Transaction volume and frequency
- Activity status (active vs dormant)

**Request Format**:
```json
{
  "address": "<wallet_address>",
  "chain": "solana",
  "date": { "from": "2025-01-01", "to": "2025-12-31" },
  "pagination": { "page": 1, "per_page": 100 },
  "hide_spam_token": true
}
```

### Counterparties Endpoint
**Purpose**: Interaction network analysis
**Use Cases**:
- Find funding sources
- Identify CEX relationships
- Discover high-interaction wallets
- Volume pattern analysis

**Request Format**:
```json
{
  "address": "<wallet_address>",
  "chain": "solana",
  "group_by": "wallet",
  "source_input": "Combined",
  "date": { "from": "2025-01-01", "to": "2025-12-31" },
  "order_by": [{ "field": "total_volume_usd", "direction": "DESC" }]
}
```

### Related Wallets Endpoint
**Purpose**: Relationship discovery
**Use Cases**:
- Find "First Funder" relationships
- Identify "Signer" (shared control) wallets
- Discover "Deployed via" relationships
- Build wallet clusters

**Request Format**:
```json
{
  "address": "<wallet_address>",
  "chain": "solana",
  "pagination": { "page": 1, "per_page": 20 }
}
```

---

## Expected Deliverables

### 1. Complete Wallet Network Map
**Format**: JSON + Visual markdown representation

**Structure**:
```json
{
  "root_wallets": [
    {
      "address": "9Z83ZAtd...",
      "role": "ROOT",
      "funds": ["v49jgwyQ..."],
      "funding_source": "<CEX or wallet>",
      "activity_status": "active"
    }
  ],
  "level_1_wallets": [
    {
      "address": "v49jgwyQ...",
      "role": "PRIMARY_FUNDER",
      "funded_by": "9Z83ZAtd...",
      "funds": ["D7Ms...", "DBmx...", "..."],
      "confidence": "95%",
      "last_activity": "2025-11-02"
    }
  ],
  "deployer_wallets": [...],
  "cex_wallets": [...],
  "cluster_relationships": {
    "signers": [...],
    "deployed_via": [...]
  }
}
```

### 2. Multi-Source Monitoring List
**Format**: Prioritized markdown table

| Tier | Wallet | Role | Confidence | Monitoring Priority | Notes |
|------|--------|------|------------|---------------------|-------|
| 1 | v49jgwyQ... | Primary Funder | 95% | HIGH | Funds both fresh deployers |
| 2 | 9Z83ZAtd... | ROOT | 80% | MEDIUM | Backup - funds LEVEL 1 |
| 2 | GJRs4FwH... | Coinbase | 30% | LOW | CEX fallback if pattern changes |
| 3 | [Others] | Alternative | TBD | OPTIONAL | Discovered in analysis |

### 3. Confidence Scoring Matrix
**Per funding source, calculate**:
- Historical consistency score (0-100)
- Recency score (when last used)
- Volume match score (typical amounts)
- Timing pattern match score
- **Overall confidence** (weighted average)

### 4. Timing Playbook
**Detailed timeline expectations**:

```
Expected Launch Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

T-24h to T-1h:  ROOT may fund LEVEL 1 (early signal)
T-1h to T-30m:  LEVEL 1 funds fresh deployer ← TRIGGER
T-30m to T-0:   Fresh deployer deploys token ← SNIPE

Monitoring Window: [4-6 hour window on launch day]
Alert Trigger: v49jgwyQ funds fresh address
Confidence: 95%
```

### 5. Updated Final Report
**Enhanced report including**:
- Validation of primary funding source
- Complete list of backup sources
- Risk mitigation strategies
- Multi-layered monitoring approach
- 95%+ confidence justification

---

## Risk Mitigation

### Scenario 1: Pattern Change - New Funding Wallet
**Risk**: Entity uses a completely new wallet we haven't seen

**Mitigation**:
- Monitor entire wallet cluster (Signers, related wallets)
- Watch ROOT for any new LEVEL 1 wallet funding
- Deploy fresh wallet detection (monitor all new Solana wallets during window)

### Scenario 2: Direct CEX Funding
**Risk**: Reverts to Coinbase or uses different CEX

**Mitigation**:
- Monitor Coinbase wallet (GJRs4FwH...)
- Analyze all CEX addresses from counterparty data
- Include CEX wallets in Tier 2 monitoring

### Scenario 3: Multi-Hop Obfuscation
**Risk**: Uses more intermediary wallets (ROOT → L1 → L2 → Deployer)

**Mitigation**:
- Complete network map captures all relationships
- Monitor at multiple levels (ROOT + LEVEL 1)
- Behavioral fingerprinting helps identify pattern despite hops

### Scenario 4: Timing Change
**Risk**: Funding → deployment timing changes

**Mitigation**:
- Monitor entire 4-6 hour window
- Set up alerts for ANY activity from monitored wallets
- Fresh wallet detection catches deployer regardless of timing

---

## Implementation Plan

### Script Architecture

**Option A: Single Comprehensive Script** (RECOMMENDED)
```
src/comprehensive-analysis.ts
├── Phase 1: Analyze v49jgwyQ
├── Phase 2: Analyze ROOT
├── Phase 3: Analyze Coinbase
├── Phase 4: Cross-reference deployers
├── Phase 5: Timing analysis
├── Phase 6: Network expansion
├── Phase 7: Advanced intelligence
└── Generate comprehensive report
```

**Advantages**:
- Single execution, complete results
- Parallel API calls where possible
- Consistent data collection
- Comprehensive output report

**Option B: Modular Phase Scripts**
```
src/analysis/
├── phase1-primary-target.ts
├── phase2-root-wallet.ts
├── phase3-cex-risk.ts
├── phase4-cross-deployer.ts
├── phase5-timing.ts
├── phase6-network.ts
└── phase7-advanced.ts
```

**Advantages**:
- Review findings per phase
- Adjust strategy mid-analysis
- More granular control

### Execution Approach

**Recommended: Option A with Progress Logging**
- Run all phases in sequence
- Log results after each phase
- Save intermediate data to `/data/analysis/`
- Generate final comprehensive report
- Allow manual review between phases if needed

### Output Structure

```
/data/analysis/
├── phase1-primary-target.json
├── phase2-root-wallet.json
├── phase3-cex-risk.json
├── phase4-cross-deployer.json
├── phase5-timing.json
├── phase6-network.json
├── phase7-advanced.json
└── comprehensive-report.json

/reports/
└── COMPREHENSIVE_INTELLIGENCE_REPORT.md
```

---

## Next Steps

### Immediate Actions

1. **Build comprehensive analysis script**
   - Implement all 7 phases
   - Include progress logging
   - Add error handling and retries
   - Rate limiting between API calls

2. **Execute analysis**
   - Run script with full data collection
   - Monitor credit usage
   - Review intermediate results

3. **Generate intelligence report**
   - Compile findings from all phases
   - Calculate confidence scores
   - Create monitoring strategy
   - Update final recommendations

### Post-Analysis

4. **Set up monitoring infrastructure**
   - Based on identified wallets
   - Multi-tiered alert system
   - Real-time notification setup

5. **Validate with user intelligence**
   - Cross-reference with any additional info user has
   - Adjust confidence scores based on feedback

---

## Success Criteria

✅ **95%+ confidence** in primary funding source
✅ **Complete wallet network** mapped
✅ **Backup funding sources** identified and prioritized
✅ **Timing playbook** with exact expectations
✅ **Multi-layered monitoring strategy** ready to deploy
✅ **Risk mitigation** plans for all scenarios
✅ **Actionable intelligence** for next launch

---

**Document Status**: Ready for implementation
**Next Action**: Build and execute comprehensive analysis script
**Expected Completion**: 1-2 hours (script + execution + report generation)

---

*Comprehensive Analysis Plan*
*Created: November 14, 2025*
*Investigation: Pump.fun Deployer Funding Source Identification*
