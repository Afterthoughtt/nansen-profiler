# Pump.fun Deployer Wallet Investigation Plan

## Objective

Identify the funding wallet that will fund the next pump.fun token deployer with **100% certainty** before the launch occurs.

## Known Intelligence

- **Historical Data**: 3 successful deployer wallet snipes
- **Deployer Pattern**: Same person/group behind all launches
- **Blockchain**: Solana
- **Funding Window**: Fresh wallet funded within 24 hours before launch
- **Launch Window**: 4-6 hour variance on known launch day

## Investigation Approach

### Option 1: Related Wallets Clustering (Current)

**Methodology**: Based on Nansen's "Identifying Related Wallets at Scale" use case, which provides systematic wallet relationship discovery through special connection types.

**Step 1: Target Address Label Lookup**

For each known deployer wallet:

- Endpoint: `POST /api/beta/profiler/address/labels`
- Purpose: Identify if deployer has any Nansen labels
- Parameters:
  ```json
  {
    "parameters": {
      "chain": "solana",
      "address": "<deployer_wallet>"
    },
    "pagination": { "page": 1, "recordsPerPage": 100 }
  }
  ```

**Step 2: Initial Relationship Discovery**

- Endpoint: `POST /api/v1/profiler/address/related-wallets`
- Purpose: Find **"First Funder"** relationship (exact wallet that funded deployer)
- Parameters:
  ```json
  {
    "address": "<deployer_wallet>",
    "chain": "solana",
    "pagination": { "page": 1, "per_page": 20 }
  }
  ```
- Extract: Relationships with `relation: "First Funder"`, `"Signer"`, `"Deployed via"`

**Step 3: Counterparty Analysis (Validation)**

- Endpoint: `POST /api/v1/profiler/address/counterparties`
- Purpose: Validate funding relationships and identify high-interaction addresses
- Parameters:
  ```json
  {
    "address": "<deployer_wallet>",
    "chain": "solana",
    "group_by": "wallet",
    "source_input": "Combined",
    "filters": { "total_volume_usd": { "min": 100 } },
    "order_by": [{ "field": "total_volume_usd", "direction": "DESC" }]
  }
  ```

**Step 4: Multi-Level Clustering**

- For each "First Funder" identified in Step 2, repeat Steps 1-3
- Build funding chain: Root → Level 1 → Level 2 → Deployer
- Cross-reference: Find common wallets across all deployers' funding chains

**Step 5: Pattern Recognition**

- Analyze transaction timing using historical-balances endpoint
- Look for coordinated movements across potential cluster members
- Check for addresses depositing to same CEX addresses
- Identify behavioral similarities (transaction types, amounts, timing)

**Step 6: Confidence Assessment**

Apply Nansen's confidence scoring:

- **High confidence (>90%)**:
  - Same "First Funder" for all deployers
  - Shared signers or multisig relationships
  - Same CEX deposit addresses
  - Coordinated balance movements

- **Medium confidence (60-90%)**:
  - High interaction volume between wallets
  - Coordinated timing patterns
  - Partial overlap in funding chains

- **Low confidence (<60%)**:
  - Indirect relationships only
  - Behavioral similarities without direct connections

**Step 7: Validation and Refinement**

- Get transaction history for validation:
  ```json
  {
    "address": "<first_funder_wallet>",
    "chain": "solana",
    "filters": { "volume_usd": { "min": 10 } }
  }
  ```
- Filter out false positives from common protocol interactions
- Verify balance patterns show coordinated movements

## Success Criteria for Option 1

✅ All deployers have **same "First Funder"** or trace to **same root source**
✅ **High confidence score (>90%)** based on Nansen methodology
✅ **Clear relationship graph** showing funding hierarchy
✅ **Validated with counterparties** confirming interaction patterns
✅ Coordinated timing patterns across deployments

**If confidence ≥ 90% → Option 1 is sufficient**

## Monitoring Strategy (Option 1)

On next launch day:

1. Monitor the identified root funding wallet
2. When it funds a fresh Solana wallet during the launch window → **THAT'S THE TARGET**
3. Set up sniper on the fresh deployer wallet

## Option 2: Advanced CLI Tool (If Option 1 Insufficient)

### When to Escalate

Escalate to Option 2 if:

- Multiple different funding sources identified (not consistent)
- No clear timing pattern emerges
- Funding chain is obfuscated or changes per launch
- Need to monitor 10+ potential wallets simultaneously
- Confidence level < 95%

### Option 2 Features

**1. Multi-Pattern Analysis Engine**
- Analyze dozens of behavioral indicators simultaneously
- Machine learning for pattern recognition
- Probabilistic modeling of deployer selection
- Historical pattern database with version tracking

**2. Real-Time Monitoring System**
- Watch multiple suspected wallets during 4-6hr launch window
- Track fresh wallet creation across Solana network
- Cross-reference funding patterns in real-time
- Alert system with confidence scores

**3. Advanced Analytics**
- Graph database of wallet relationships
- Temporal pattern analysis
- Statistical modeling of funding behaviors
- Smart Money correlation (using Nansen Smart Money API)

**4. CLI Tool Structure**
```bash
# Analyze historical deployer
npx nansen-profiler analyze <wallet> --chain solana

# Add to deployer database
npx nansen-profiler add-deployer <wallet> --launch-date "2024-01-15"

# Extract patterns from all known deployers
npx nansen-profiler extract-patterns

# Monitor during launch window
npx nansen-profiler monitor --date "2024-02-01" --window 6h --confidence-threshold 95

# Generate comprehensive report
npx nansen-profiler report --output markdown
```

**5. Confidence Scoring Algorithm**
- Weight different pattern matches
- Assign probability scores
- Only flag wallets above threshold (e.g., 95%+)
- Explain reasoning for each score

## Implementation Stack

### Minimal (Option 1)
- Node.js 20+ with TypeScript
- Simple scripts in `/src` directory
- Nansen API client wrapper
- JSON output for analysis results

### Full Tool (Option 2)
- Complete TypeScript CLI application
- Commander.js for CLI interface
- Rate-limited API client
- Local JSON database for patterns
- Terminal UI (Chalk, cli-table3, ora)
- Report generator (markdown/JSON)

## Data Structure

### Related Wallet
```typescript
interface RelatedWallet {
  address: string;
  relation: 'First Funder' | 'Signer' | 'Deployed via' | 'Other';
  chain: string;
  confidence?: number;
}
```

### Wallet Label
```typescript
interface WalletLabel {
  label: string;
  category?: string;
  address: string;
}
```

### Cluster Node (Funding Hierarchy)
```typescript
interface ClusterNode {
  address: string;
  level: number; // 0 = deployer, 1 = first funder, 2 = root
  relation: string;
  children: ClusterNode[];
  labels: WalletLabel[];
}
```

### Deployer Record
```typescript
interface DeployerRecord {
  address: string;
  chain: 'solana';
  launchDate: string;
  firstFunder?: string; // from related-wallets API
  fundingChain: string[]; // [root, level1, deployer]
  rootSource?: string;
  labels: WalletLabel[];
}
```

### Investigation Report
```typescript
interface InvestigationReport {
  analyzedAt: string;
  wallets: WalletAnalysis[];
  fundingHierarchy: ClusterNode; // tree structure
  commonPatterns: {
    rootFundingWallet?: string;
    sharedFirstFunder?: string;
    confidence: number; // 0-100 based on Nansen scoring
    relationshipType: 'direct' | 'multi-level' | 'unclear';
  };
  recommendations: string[];
}
```

## Progress Update (2025-11-14)

### ✅ Completed Tasks

1. ✅ Created investigation plan document
2. ✅ Received 3 deployer wallet addresses (1 original + 2 fresh)
3. ✅ Set up TypeScript project structure
4. ✅ Implemented Nansen API client with correct response parsing
5. ✅ Fixed all API type definitions based on actual API documentation
6. ✅ Disabled expensive labels endpoint (500 credits per call!)
7. ✅ Created 4 isolated test scripts for systematic testing
8. ✅ **Test #1 PASSED**: Related Wallets - Found "First Funder" = Coinbase Hot Wallet
9. ✅ **Test #2 PASSED**: Counterparties - Identified funding sources and liquidity pools
10. ✅ **Test #3 PASSED**: Transactions - Retrieved transaction history successfully

### 📊 Current Status

**API Credits Remaining**: ~300-350 credits (started with 900, used ~500 on labels, ~50-100 on tests)

**Key Finding from Test #1**:
- Original deployer (`37Xx...`) was initially funded by Coinbase Hot Wallet
- This is expected for the initial setup, but doesn't reveal the pattern for fresh wallets

**Tests Completed**: 3 of 4
**Tests Remaining**: Test #4 (Funding Chain - Most Important!)

### ⏳ Next Steps (For New Session)

1. **Run Test #4**: Funding Chain
   ```bash
   npm run test:chain
   ```
   - Will trace multi-level funding backwards (ROOT → Funder → Deployer)
   - Uses ~100-200 credits
   - **CRITICAL**: This reveals the funding hierarchy

2. **Test Fresh Deployers**: After Test #4 succeeds
   - Modify test scripts to use fresh deployer wallets:
     - `D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb`
     - `DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy`
   - Run Test #1 (Related Wallets) on both fresh deployers
   - Find their "First Funder" relationships
   - **HYPOTHESIS**: Fresh deployers will have different First Funder than Coinbase

3. **Cross-Reference Findings**:
   - Compare First Funders across all 3 deployers
   - If same → HIGH CONFIDENCE (95%+)
   - If different but same root → MEDIUM CONFIDENCE (80%+)
   - Build complete funding hierarchy

4. **Generate Final Report**:
   - Run full `npm run analyze` if patterns are clear
   - Or manually compile findings from individual tests
   - Identify wallet to monitor for next launch

### 🎯 Expected Outcome

Once we complete testing on fresh deployers, we should identify:
- **The wallet that funds fresh deployers before each launch**
- This is the wallet to monitor during the next 4-6 hour launch window
- When it funds a new fresh wallet → that's the snipe target

### 📁 Files Ready for Next Session

- `/src/test-related-wallets.ts` - Test related wallets endpoint
- `/src/test-counterparties.ts` - Test counterparties endpoint
- `/src/test-transactions.ts` - Test transactions endpoint
- `/src/test-funding-chain.ts` - Test multi-level chain tracing
- `/src/analyze.ts` - Full analysis (use after individual tests pass)
- `/TESTING.md` - Complete testing guide

## Expected Timeline

- **Option 1 Investigation**: 1-2 hours of development + API analysis
- **Option 2 Full Tool** (if needed): 6-8 hours of development

## Notes

- All analysis will be documented in `/reports` directory
- API responses cached in `/data/cache` to avoid redundant calls
- Nansen API key required (user has access confirmed)
- Rate limiting implemented to respect API constraints
