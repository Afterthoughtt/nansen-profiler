import fetch from "node-fetch";
import { DATES } from "./config/index.js";
import type {
  CounterpartyData,
  Transaction,
  RelatedWallet,
  WalletLabel,
  NansenCounterpartiesRequest,
  NansenTransactionsRequest,
  NansenRelatedWalletsRequest,
  NansenLabelsRequest,
  // New types for enhanced investigation
  TGMHolder,
  TGMDexTrade,
  TGMWhoBoughtSold,
  CurrentBalance,
  BalanceSnapshot,
  NansenTGMHoldersRequest,
  NansenTGMDexTradesRequest,
  NansenTGMWhoBoughtSoldRequest,
  NansenHistoricalBalancesRequest,
  NansenCurrentBalanceRequest,
} from "./types.js";

export class NansenClient {
  private apiKey: string;
  private baseUrl = "https://api.nansen.ai";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      apiKey: this.apiKey,
      "Content-Type": "application/json",
    };

    const options: any = {
      method,
      headers,
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    console.log(`🔍 Making ${method} request to: ${endpoint}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nansen API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data as T;
  }

  async getCounterparties(
    request: NansenCounterpartiesRequest,
  ): Promise<CounterpartyData[]> {
    try {
      const response = await this.makeRequest<{
        pagination: any;
        data: CounterpartyData[];
      }>("/api/v1/profiler/address/counterparties", "POST", request);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching counterparties:", error);
      throw error;
    }
  }

  async getTransactions(
    request: NansenTransactionsRequest,
  ): Promise<{ data: Transaction[]; pagination?: any }> {
    try {
      const data = await this.makeRequest<{
        data: Transaction[];
        pagination?: any;
      }>("/api/v1/profiler/address/transactions", "POST", request);
      return data;
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      throw error;
    }
  }

  // Helper method to get funding sources for a wallet
  // Uses 90-day window by default to avoid timeouts
  async getFundingSources(
    address: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<CounterpartyData[]> {
    const request: NansenCounterpartiesRequest = {
      address,
      chain: "solana",
      date: {
        from: dateFrom || DATES.RECENT_90D.from,
        to: dateTo || DATES.RECENT_90D.to,
      },
      source_input: "Combined",
      group_by: "wallet",
    };

    return this.getCounterparties(request);
  }

  // Helper method to get first transactions for a wallet
  async getEarlyTransactions(
    address: string,
    limit: number = 50,
  ): Promise<Transaction[]> {
    const request: NansenTransactionsRequest = {
      address,
      chain: "solana",
      date: DATES.FULL_HISTORY,
      pagination: {
        page: 1,
        per_page: limit,
      },
    };

    const result = await this.getTransactions(request);
    return result.data || [];
  }

  // Get related wallets (First Funder, Signer, etc.)
  async getRelatedWallets(
    request: NansenRelatedWalletsRequest,
  ): Promise<RelatedWallet[]> {
    try {
      const response = await this.makeRequest<{
        pagination: any;
        data: RelatedWallet[];
      }>("/api/v1/profiler/address/related-wallets", "POST", request);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching related wallets:", error);
      return [];
    }
  }

  // Get wallet labels (DISABLED - costs 500 credits per call!)
  async getLabels(request: NansenLabelsRequest): Promise<WalletLabel[]> {
    console.log("  ⚠️  Labels endpoint disabled (500 credits per call)");
    return [];
  }

  // Helper: Find "First Funder" for a wallet
  async findFirstFunder(address: string): Promise<string | null> {
    const relatedWallets = await this.getRelatedWallets({
      address,
      chain: "solana",
      pagination: { page: 1, per_page: 20 },
    });

    const firstFunder = relatedWallets.find(
      (rw) => rw.relation === "First Funder",
    );
    return firstFunder ? firstFunder.address : null;
  }

  // Helper: Get labels for a wallet
  async getWalletLabels(address: string): Promise<WalletLabel[]> {
    return this.getLabels({
      parameters: {
        chain: "solana",
        address,
      },
      pagination: { page: 1, recordsPerPage: 100 },
    });
  }

  // ============================================
  // NEW ENDPOINTS FOR ENHANCED INVESTIGATION
  // ============================================

  // Get current balance for a wallet
  async getCurrentBalance(
    request: NansenCurrentBalanceRequest,
  ): Promise<CurrentBalance[]> {
    try {
      const response = await this.makeRequest<{
        data: CurrentBalance[];
      }>("/api/v1/profiler/address/current-balance", "POST", request);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching current balance:", error);
      return [];
    }
  }

  // Get historical balances for a wallet
  async getHistoricalBalances(
    request: NansenHistoricalBalancesRequest,
  ): Promise<BalanceSnapshot[]> {
    try {
      const response = await this.makeRequest<{
        data: BalanceSnapshot[];
      }>("/api/v1/profiler/address/historical-balances", "POST", request);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching historical balances:", error);
      return [];
    }
  }

  // Token God Mode: Get token holders
  async getTGMHolders(request: NansenTGMHoldersRequest): Promise<TGMHolder[]> {
    try {
      const response = await this.makeRequest<{
        data: TGMHolder[];
      }>("/api/v1/tgm/holders", "POST", request);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching TGM holders:", error);
      return [];
    }
  }

  // Token God Mode: Get DEX trades for a token
  async getTGMDexTrades(
    request: NansenTGMDexTradesRequest,
  ): Promise<TGMDexTrade[]> {
    try {
      const response = await this.makeRequest<{
        data: TGMDexTrade[];
      }>("/api/v1/tgm/dex-trades", "POST", request);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching TGM DEX trades:", error);
      return [];
    }
  }

  // Token God Mode: Get who bought/sold a token
  async getTGMWhoBoughtSold(
    request: NansenTGMWhoBoughtSoldRequest,
  ): Promise<TGMWhoBoughtSold[]> {
    try {
      const response = await this.makeRequest<{
        data: TGMWhoBoughtSold[];
      }>("/api/v1/tgm/who-bought-sold", "POST", request);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching TGM who bought/sold:", error);
      return [];
    }
  }

  // ============================================
  // HELPER METHODS FOR INVESTIGATION
  // ============================================

  // Get all wallets funded by an address (outbound transactions)
  // Get all wallets funded by an address (uses 90-day window by default)
  async getWalletsFundedBy(
    address: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<string[]> {
    const transactions = await this.getTransactions({
      address,
      chain: "solana",
      date: {
        from: dateFrom || DATES.RECENT_90D.from,
        to: dateTo || DATES.RECENT_90D.to,
      },
      pagination: { page: 1, per_page: 100 },
    });

    const fundedWallets = new Set<string>();
    for (const tx of transactions.data || []) {
      // Look for outbound SOL transfers
      if (tx.tokens_sent) {
        for (const sent of tx.tokens_sent) {
          if (sent.to_address && sent.to_address !== address) {
            fundedWallets.add(sent.to_address);
          }
        }
      }
    }
    return Array.from(fundedWallets);
  }

  // Get all signers for a wallet
  async getSigners(address: string): Promise<RelatedWallet[]> {
    const relatedWallets = await this.getRelatedWallets({
      address,
      chain: "solana",
      pagination: { page: 1, per_page: 50 },
    });
    return relatedWallets.filter((rw) => rw.relation === "Signer");
  }

  // Get complete funding chain (multi-level)
  async traceFundingChain(
    address: string,
    maxLevels: number = 3,
  ): Promise<string[]> {
    const chain: string[] = [address];
    let currentAddress = address;

    for (let level = 0; level < maxLevels; level++) {
      const firstFunder = await this.findFirstFunder(currentAddress);
      if (!firstFunder) break;

      chain.unshift(firstFunder);
      currentAddress = firstFunder;

      // Add delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return chain;
  }

  // Check if a wallet is "fresh" (low transaction count)
  // Uses 90-day window to avoid API timeouts
  async isWalletFresh(
    address: string,
    threshold: number = 10,
  ): Promise<boolean> {
    const counterparties = await this.getCounterparties({
      address,
      chain: "solana",
      date: DATES.RECENT_90D,
      group_by: "wallet",
      source_input: "Combined",
    });
    const totalInteractions = counterparties.reduce(
      (sum, cp) => sum + cp.interaction_count,
      0,
    );
    return totalInteractions < threshold;
  }
}
