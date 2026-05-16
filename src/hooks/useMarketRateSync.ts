'use client';

import { useEffect } from 'react';
import { offlineStore } from '@/lib/offlineStore';

/**
 * Hook that periodically syncs market rates and stores them offline
 * Runs after each sync to enable offline access to latest rates
 */
export function useMarketRateSync() {
  useEffect(() => {
    const syncAndCache = async () => {
      try {
        // Call the server action to sync market rates
        const response = await fetch('/api/market-rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Cache the rates for offline use
          if (data.success && data.data) {
            await offlineStore.saveMarketRates({
              gold24k: data.data.gold_24k,
              gold22k: data.data.gold_22k,
              silver: data.data.silver,
            });
            
            console.log('✅ Market rates cached for offline use');
          }
        }
      } catch (err) {
        console.warn('Failed to sync and cache market rates:', err);
      }
    };

    // Run sync on mount if online
    if (window.navigator.onLine) {
      syncAndCache();
    }

    // Listen for online events and sync
    window.addEventListener('online', syncAndCache);

    // Cleanup
    return () => {
      window.removeEventListener('online', syncAndCache);
    };
  }, []);
}
