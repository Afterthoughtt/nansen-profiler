// Related Wallets API types (based on actual API documentation)
export type RelationType = "First Funder" | "Signer" | "Deployed via" | "Other";

export interface RelatedWallet {
  address: string;
  address_label?: string;
  relation: string; // Can be any relation type
  transaction_hash: string;
  block_timestamp: string;
  order: number;
  chain: string;
}

export interface WalletLabel {
  label: string;
  category?: string;
  address: string;
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  is_last_page: boolean;
}

export interface ClusterNode {
  address: string;
  level: number; // 0 = deployer, 1 = first funder, 2 = root
  relation: string;
  children: ClusterNode[];
  labels: WalletLabel[];
}

// Deployer wallet data
export interface DeployerRecord {
  address: string;
  chain: "solana";
  launchDate: string;
  ticker?: string;
  tokenAddress?: string;
  firstFunder?: string; // from related-wallets API
  fundingChain: string[]; // [root, level1, deployer]
  fundingSource?: string;
  fundingAmount?: number;
  fundingTimestamp?: string;
  timeDelta?: number; // hours between funding and deployment
  rootSource?: string;
  labels: WalletLabel[];
}

// Nansen API response types (based on actual API documentation)
export interface CounterpartyData {
  counterparty_address: string;
  counterparty_address_label?: string[];
  interaction_count: number;
  total_volume_usd?: number;
  volume_in_usd?: number;
  volume_out_usd?: number;
  tokens_info?: TokenInfo[];
}

export interface TokenInfo {
  token_address: string;
  token_symbol: string;
  token_name: string;
  num_transfer: string;
}

export interface ProfilerTokenInfo {
  token_symbol: string;
  token_amount: number;
  price_usd?: number;
  value_usd?: number;
  token_address: string;
  chain: string;
  from_address: string;
  to_address: string;
  from_address_label?: string;
  to_address_label?: string;
}

export interface Transaction {
  chain: string;
  method: string;
  tokens_sent?: ProfilerTokenInfo[];
  tokens_received?: ProfilerTokenInfo[];
  volume_usd?: number;
  block_timestamp: string;
  transaction_hash: string;
  source_type: string;
}

// Nansen API request types
export interface NansenRelatedWalletsRequest {
  address: string;
  chain: "solana";
  pagination?: {
    page: number;
    per_page: number;
  };
}

export interface NansenLabelsRequest {
  parameters: {
    chain: "solana";
    address: string;
  };
  pagination?: {
    page: number;
    recordsPerPage: number;
  };
}

export interface NansenCounterpartiesRequest {
  address: string;
  chain: "solana";
  date: {
    from: string;
    to: string;
  };
  source_input?: "Combined" | "Tokens" | "ETH";
  group_by?: "wallet" | "entity";
  filters?: {
    interaction_count?: { min?: number; max?: number };
    total_volume_usd?: { min?: number; max?: number };
    volume_in_usd?: { min?: number; max?: number };
    volume_out_usd?: { min?: number; max?: number };
    include_smart_money_labels?: string[];
    exclude_smart_money_labels?: string[];
  };
  pagination?: {
    page: number;
    per_page: number;
  };
  order_by?: Array<{
    field: string;
    direction: "ASC" | "DESC";
  }>;
}

export interface NansenTransactionsRequest {
  address: string;
  chain: "solana";
  date: {
    from: string;
    to: string;
  };
  hide_spam_token?: boolean;
  pagination?: {
    page: number;
    per_page: number;
  };
  filters?: {
    volume_usd?: { min?: number; max?: number };
  };
}

// Analysis results
export interface WalletAnalysis {
  deployer: DeployerRecord;
  relatedWallets: RelatedWallet[];
  counterparties: CounterpartyData[];
  transactions: Transaction[];
  fundingChain: string[]; // array of wallet addresses from root to deployer
  patterns: {
    primaryFundingSource?: string;
    fundingAmount?: number;
    timingPattern?: string;
  };
}

export interface InvestigationReport {
  analyzedAt: string;
  wallets: WalletAnalysis[];
  fundingHierarchy?: ClusterNode; // tree structure
  commonPatterns: {
    rootFundingWallet?: string;
    sharedFirstFunder?: string;
    averageFundingAmount?: number;
    averageTimeDelta?: number;
    recurringCounterparties: string[];
    confidence: number; // 0-100 based on Nansen scoring
    relationshipType: "direct" | "multi-level" | "unclear";
  };
  recommendations: string[];
}

// ============================================
// NEW TYPES FOR ENHANCED INVESTIGATION
// ============================================

// Token God Mode (TGM) Types
export interface TGMHolder {
  address: string;
  address_label?: string[];
  balance: number;
  balance_usd?: number;
  percentage?: number;
  holder_type?: string; // "smart_money", "whale", "exchange", etc.
}

export interface TGMDexTrade {
  // API returns trader_address, not address
  trader_address: string;
  trader_address_label?: string;
  transaction_hash: string;
  block_timestamp: string;
  // API returns action ("BUY" | "SELL"), not side
  action: "BUY" | "SELL";
  token_address: string;
  token_name?: string;
  token_amount: number;
  traded_token_address?: string;
  traded_token_name?: string;
  traded_token_amount?: number;
  price_usd?: number;
  value_usd?: number;
  dex?: string;
  // Legacy fields for compatibility
  address?: string;
  side?: "buy" | "sell";
}

export interface TGMWhoBoughtSold {
  address: string;
  address_label?: string[];
  total_bought_amount: number;
  total_bought_usd?: number;
  total_sold_amount: number;
  total_sold_usd?: number;
  net_position: number;
  trade_count: number;
}

// Historical Balance Types (matches API v1 response)
export interface BalanceSnapshot {
  block_timestamp: string;
  token_address: string;
  chain: string;
  token_amount: number;
  value_usd?: number;
  token_symbol: string;
}

export interface HistoricalBalance {
  address: string;
  chain: string;
  snapshots: BalanceSnapshot[];
}

// Current Balance Types (matches API v1 response)
export interface CurrentBalance {
  chain: string;
  address?: string;
  token_address: string;
  token_symbol: string;
  token_name?: string;
  token_amount: number;
  price_usd?: number;
  value_usd?: number;
}

// Network Graph Types
export interface NetworkNode {
  address: string;
  label?: string;
  role: "root" | "level1" | "deployer" | "cex" | "unknown";
  firstFunder?: string;
  signers: string[];
  deployedVia?: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  relation: RelationType | string;
  transaction_hash?: string;
  timestamp?: string;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  generatedAt: string;
}

// Entity Cluster Types
export interface EntityCluster {
  entityId: string;
  wallets: string[];
  relationships: {
    address: string;
    relation: RelationType | string;
  }[];
  confidenceScore: number;
  primaryWallet?: string;
  description?: string;
}

// Timing Analysis Types
export interface LaunchTimingData {
  deployerAddress: string;
  tokenTicker: string;
  tokenAddress?: string;
  launchDate: string;
  fundingTimestamp?: string;
  deploymentTimestamp?: string;
  timeDeltaMinutes?: number;
  timeDeltaHours?: number;
  fundingAmount?: number;
  funderAddress?: string;
}

export interface TimingPlaybook {
  averageTimeDeltaMinutes: number;
  minTimeDeltaMinutes: number;
  maxTimeDeltaMinutes: number;
  typicalLaunchHourUTC?: number;
  typicalLaunchDayOfWeek?: string;
  preFundingSignals: {
    rootToLevel1Hours?: number;
    level1ToDeployerHours?: number;
  };
  launches: LaunchTimingData[];
  generatedAt: string;
}

// TGM API Request Types
export interface NansenTGMHoldersRequest {
  token_address: string;
  chain: "solana";
  pagination?: {
    page: number;
    per_page: number;
  };
}

export interface NansenTGMDexTradesRequest {
  token_address: string;
  chain: "solana";
  date?: {
    from?: string;
    to?: string;
  };
  pagination?: {
    page: number;
    per_page: number;
  };
}

export interface NansenTGMWhoBoughtSoldRequest {
  token_address: string;
  chain: "solana";
  // Note: This endpoint does NOT accept date parameters per API docs
}

export interface NansenHistoricalBalancesRequest {
  address: string;
  chain: "solana";
  date: {
    from: string;
    to: string;
  };
  filters?: {
    value_usd?: { min?: number; max?: number };
    token_amount?: { min?: number; max?: number };
    token_symbol?: string;
    token_address?: string;
    hide_spam_tokens?: boolean;
  };
  pagination?: {
    page: number;
    per_page: number;
  };
  order_by?: Array<{
    field: string;
    direction: "ASC" | "DESC";
  }>;
}

export interface NansenCurrentBalanceRequest {
  address: string;
  chain: "solana";
}

// Pre-Launch Report Types
export interface PreLaunchReport {
  generatedAt: string;
  targetLaunchDate: string;
  confidenceScore: number;
  primaryMonitorTarget: {
    address: string;
    label?: string;
    confidence: number;
  };
  backupMonitorTargets: {
    address: string;
    label?: string;
    confidence: number;
    reason: string;
  }[];
  timingPlaybook: TimingPlaybook;
  networkGraph: NetworkGraph;
  entityClusters: EntityCluster[];
  riskAssessment: {
    scenario: string;
    probability: number;
    mitigation: string;
  }[];
  potentialDeployers: {
    address: string;
    reason: string;
    confidence: number;
  }[];
  recommendations: string[];
}
