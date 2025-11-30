# Nansen API Testing Guide

## Current Status

**Remaining API Credits**: 400
**Test Wallet**: `37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2` (original deployer)

## What We Built

### Phase 1: Fixed API Integration ✅
- Updated `types.ts` with correct field names from API docs
- Fixed `nansen-client.ts` to parse `{pagination, data}` responses
- Disabled expensive labels endpoint (500 credits per call!)
- Updated `analyze.ts` to use correct field names

### Phase 2: Created Test Scripts ✅

We created 4 isolated test scripts to verify each endpoint individually:

1. **test-related-wallets.ts** - Tests the Related Wallets endpoint
   - Finds "First Funder" relationships
   - Shows all relationship types
   - Displays transaction details

2. **test-counterparties.ts** - Tests the Counterparties endpoint
   - Lists top counterparties by volume
   - Identifies funding sources
   - Shows interaction statistics

3. **test-transactions.ts** - Tests the Transactions endpoint
   - Retrieves transaction history
   - Displays first 10 transactions
   - Shows token transfers and values

4. **test-funding-chain.ts** - Tests multi-level chain tracing
   - Recursively finds "First Funder" up to 2 levels
   - Builds complete funding hierarchy
   - Identifies root funding wallet

## Testing Sequence

Run tests **ONE AT A TIME** in this order:

### Step 1: Test Related Wallets
```bash
npm run test:related
```
**Expected**: Should find related wallets and identify "First Funder"
**Credits**: ~50-100 credits

### Step 2: Test Counterparties
```bash
npm run test:counterparties
```
**Expected**: Should show top funding sources with volumes
**Credits**: ~50-100 credits

### Step 3: Test Transactions
```bash
npm run test:transactions
```
**Expected**: Should retrieve transaction history
**Credits**: ~50-100 credits

### Step 4: Test Funding Chain
```bash
npm run test:chain
```
**Expected**: Should trace multi-level funding chain (ROOT → Funder → Deployer)
**Credits**: ~100-200 credits (calls related-wallets multiple times)

## After Testing

If all tests pass:
- Review the funding chain from test 4
- Note the ROOT wallet address
- Decide if we should run full analysis on all 3 deployers

## Full Analysis

Only run after individual tests succeed:
```bash
npm run analyze
```

This will analyze all 3 deployer wallets and generate a complete investigation report.

**Estimated Credits**: ~300-400 (depending on chain depth)

## Important Notes

- ⚠️ **Labels endpoint is DISABLED** - costs 500 credits per call
- ⏳ **Rate limiting**: Tests include 2s delays between calls
- 💰 **Credit monitoring**: Check remaining credits after each test
- 🛑 **Stop immediately** if any test fails or uses unexpected credits

## Expected Outcomes

### High Confidence Scenario (95%+)
- All 3 deployers have same "First Funder" → Monitor that wallet

### Medium Confidence Scenario (80%+)
- Different First Funders, but same ROOT → Monitor root wallet

### Low Confidence Scenario (<60%)
- No clear pattern → Need Option 2 (advanced CLI tool)

## Next Steps

Based on test results:
1. If HIGH confidence → Use findings to monitor next launch
2. If MEDIUM confidence → Run full analysis to confirm patterns
3. If LOW confidence → Discuss building Option 2 tool
