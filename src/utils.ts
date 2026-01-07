/**
 * Shared utility functions for the Nansen Profiler XRP investigation
 */

/**
 * Delay execution for a specified number of milliseconds
 * Used for rate limiting API calls (recommended: 1500-2000ms between calls)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse a timestamp string to a Date object
 * Handles timestamps with or without 'Z' suffix
 */
export function parseTimestamp(ts: string): Date {
  return new Date(ts.endsWith("Z") ? ts : ts + "Z");
}

/**
 * Format a wallet address for display (abbreviated)
 * Example: "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2" -> "37Xxihfs..."
 */
export function formatAddress(address: string, length: number = 8): string {
  if (address.length <= length) return address;
  return `${address.slice(0, length)}...`;
}
