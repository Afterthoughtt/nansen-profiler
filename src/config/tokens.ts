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
