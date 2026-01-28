// Centralized token information for the XRP deployer investigation

export interface TokenInfo {
  address: string;
  ticker: string;
  name: string;
  launchDate: string;
  launchDateLocal: string;
  deployer: string;
}

export const TOKENS: Record<string, TokenInfo> = {
  ARKXRP: {
    address: "2rQcoMECcsU3UBNfpsUxegnHc9js7usb2XagwUK3pump",
    ticker: "ARKXRP",
    name: "ArkXRP",
    launchDate: "2025-06-15T15:57:57.000Z",
    launchDateLocal: "Jun 15 2025 at 08:57:57 AM PDT",
    deployer: "ORIGINAL_DEPLOYER",
  },
  DOGWIFXRP: {
    address: "8mETm8mxyn7gP1igZLv4DryquuYLjcekkrQBVpZpFHvC",
    ticker: "DOGWIFXRP",
    name: "DogwifXRP",
    launchDate: "2025-07-20T00:00:00.000Z",
    launchDateLocal: "Jul 20 2025",
    deployer: "ORIGINAL_DEPLOYER",
  },
  WFXRP: {
    address: "FnzYzrkRL1JLHmxS8QctidKDGJgJRa6BN4QH3hkVpump",
    ticker: "WFXRP",
    name: "WFXRP",
    launchDate: "2025-08-24T00:00:00.000Z",
    launchDateLocal: "Aug 24 2025",
    deployer: "ORIGINAL_DEPLOYER",
  },
  XRPEP3: {
    address: "5K7ufVK7cGwU8vd66bFAzHgijVK8RoWZBxtMmvW1pump",
    ticker: "XRPEP3",
    name: "XRPEP3",
    launchDate: "2025-09-28T17:51:00.000Z",
    launchDateLocal: "Sep 28 2025 at 10:51:00 AM PDT",
    deployer: "DEPLOYER_D7MS",
  },
  TROLLXRP: {
    address: "CDjuuYYY9dGA85iojEhpRwjYhGRv6VAPyoKan5ytpump",
    ticker: "TROLLXRP",
    name: "TrollXRP",
    launchDate: "2025-11-02T19:28:36.000Z",
    launchDateLocal: "Nov 2 2025 at 11:28:36 AM PST",
    deployer: "DEPLOYER_DBMX",
  },
  RXRP: {
    address: "3VQU1DgaLE6E49HhqvH73Azsin8gAZRc14cvyV4hpump",
    ticker: "RXRP",
    name: "RainXRP",
    launchDate: "2025-11-30T23:43:26.000Z",
    launchDateLocal: "Nov 30 2025 at 03:43:26 PM PST",
    deployer: "DEPLOYER_BZ2Y",
  },
};

// Helper: Get all token addresses as an array
export const ALL_TOKEN_ADDRESSES = Object.values(TOKENS).map((t) => t.address);

// Helper: Get tokens by deployer type
export const ORIGINAL_DEPLOYER_TOKENS = Object.values(TOKENS).filter(
  (t) => t.deployer === "ORIGINAL_DEPLOYER"
);

export const FRESH_DEPLOYER_TOKENS = Object.values(TOKENS).filter(
  (t) => t.deployer !== "ORIGINAL_DEPLOYER"
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get launch date for a token by ticker
 * @param ticker Token ticker (e.g., "XRPEP3", "TROLLXRP")
 * @returns Launch date ISO string or undefined if token not found
 */
export function getLaunchDate(ticker: string): string | undefined {
  const upperTicker = ticker.toUpperCase();
  return TOKENS[upperTicker]?.launchDate;
}

/**
 * Get token info by ticker
 * @param ticker Token ticker (e.g., "XRPEP3", "TROLLXRP")
 * @returns TokenInfo or undefined if token not found
 */
export function getToken(ticker: string): TokenInfo | undefined {
  const upperTicker = ticker.toUpperCase();
  return TOKENS[upperTicker];
}

/**
 * Get all launches sorted by date (oldest first)
 * @returns Array of TokenInfo sorted by launchDate
 */
export function getLaunchesByDate(): TokenInfo[] {
  return Object.values(TOKENS).sort(
    (a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime()
  );
}

/**
 * Get the most recent launch
 * @returns Most recently launched TokenInfo
 */
export function getMostRecentLaunch(): TokenInfo {
  const sorted = getLaunchesByDate();
  return sorted[sorted.length - 1];
}

/**
 * Get days between two consecutive launches
 * @returns Array of day counts between launches
 */
export function getDaysBetweenLaunches(): number[] {
  const sorted = getLaunchesByDate();
  const daysBetween: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].launchDate);
    const curr = new Date(sorted[i].launchDate);
    const days = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    daysBetween.push(days);
  }

  return daysBetween;
}
