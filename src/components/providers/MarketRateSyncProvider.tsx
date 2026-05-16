'use client';

import { useMarketRateSync } from '@/hooks/useMarketRateSync';

/**
 * Global hook for market rate syncing and offline caching
 * Runs automatically on mount and when connection is restored
 */
export default function MarketRateSyncProvider() {
  useMarketRateSync();
  return null;
}
