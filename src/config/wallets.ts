// Centralized wallet addresses for the XRP deployer investigation

export const WALLETS = {
  // ============================================
  // FUNDING CHAIN (ROOT → LEVEL 1 → DEPLOYER)
  // ============================================

  // Root level - Coinbase funded, dormant since June 2025
  ROOT: "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",

  // Level 1 - Primary funder for fresh deployers
  PRIMARY_FUNDER: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",

  // Original deployer - used directly for first 3 tokens
  ORIGINAL_DEPLOYER: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",

  // ============================================
  // CEX WALLETS
  // ============================================

  COINBASE_HOT_1: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
  COINBASE_HOT_2: "FpwQQhQQoEaVu3WU2qZMfF1hx48YyfwsLoRgXG83E99Q",

  // ============================================
  // FRESH DEPLOYERS (Used for specific launches)
  // ============================================

  // XRPEP3 deployer (Sep 28, 2025)
  DEPLOYER_D7MS: "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",

  // TrollXRP deployer (Nov 2, 2025)
  DEPLOYER_DBMX: "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",

  // RainXRP deployer (Nov 30, 2025)
  DEPLOYER_BZ2Y: "Bz2yexdH6YyDbru3nmUmeex2ZZyfpKLgmAN7w4C2Bt4Y",

  // Pre-funded but unused
  DEPLOYER_GUCX: "GUCX6xNeH3AqPwoo4GfniPYuGxjMdLGdw1BAbRqghjXb",

  // ============================================
  // CONFIRMED INSIDERS (Cross-token early buyers)
  // ============================================

  // 3-token insider - HIGHEST PRIORITY
  // Bought XRPEP3, TrollXRP, RainXRP (8 seconds on RXRP)
  INSIDER_H3Q: "H3qSndFCAyjvcNzhLcimVZcUbceeeSRGqnHDdcLQDCot",

  // 2-token insider - downgraded (didn't buy RXRP in first 5 min)
  INSIDER_HQF4: "Hqf4TZxph6H4P2uC3qdR1RjT6iiJA999VtvpBSU48EbT",

  // 2-token insider (XRPEP3 + RXRP)
  INSIDER_FSBV: "FSbvLdrK1FuWJSNVfyguDQgvt93Zk92KnGxxSHoFjAyE",

  // 2-token insider (TrollXRP + RXRP)
  INSIDER_2NUA: "2NuAgVk3hcb7s4YvP4GjV5fD8eDvZQv5wuN6ZC8igRfV",

  // ============================================
  // USER WALLETS (Exclude from insider analysis)
  // ============================================

  USER_321CT: "321CtfdFHdi7bji3qCBVhFz3B9JJEBpMAVimztUBqkpn",
  USER_DC5S: "Dc5s8MctjuEex6gKBQjMwUT3JjUZn1mWxeux4VuKoc2w",
  USER_9IUB: "9iUbP8d55rL1DSyEAU64XyqUzeRggzA5FkYBhNn82nV9",
  USER_D8ZB: "D8ZBeiNNR8w1uX4g3D79PCmN7ht9QBVpWtuZ8jXr14eZ",
};

// Helper arrays for common use cases
export const DEPLOYER_CHAIN = [
  WALLETS.ROOT,
  WALLETS.PRIMARY_FUNDER,
  WALLETS.ORIGINAL_DEPLOYER,
];

export const ALL_DEPLOYERS = [
  WALLETS.ORIGINAL_DEPLOYER,
  WALLETS.DEPLOYER_D7MS,
  WALLETS.DEPLOYER_DBMX,
  WALLETS.DEPLOYER_BZ2Y,
  WALLETS.DEPLOYER_GUCX,
];

export const ALL_INSIDERS = [
  WALLETS.INSIDER_H3Q,
  WALLETS.INSIDER_HQF4,
  WALLETS.INSIDER_FSBV,
  WALLETS.INSIDER_2NUA,
];

export const USER_WALLETS = [
  WALLETS.USER_321CT,
  WALLETS.USER_DC5S,
  WALLETS.USER_9IUB,
  WALLETS.USER_D8ZB,
];
