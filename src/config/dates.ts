// Centralized date configuration for all analysis scripts
// Update this file when entering a new year

// Helper to get date N days ago in YYYY-MM-DD format
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Helper to get today's date in YYYY-MM-DD format
function today(): string {
  return new Date().toISOString().split('T')[0];
}

export const DATES = {
  // Full history range - use sparingly (can cause timeouts)
  FULL_HISTORY: { from: "2025-01-01", to: "2026-12-31" },

  // 90-day window - recommended for counterparty queries
  // Covers 3 launch cycles, avoids timeouts
  get RECENT_90D() {
    return { from: daysAgo(90), to: today() };
  },

  // 30-day window - fallback if 90 days times out
  get RECENT_30D() {
    return { from: daysAgo(30), to: today() };
  },
};
