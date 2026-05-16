'use client';

import { supabaseService } from './service';
import { syncMarketRatesAction } from '@/app/actions/market';

const CACHE_KEY = 'pv_market_trends';
const CACHE_TTL = 60 * 60 * 1000; // 1 Hour
const REDUCED_TTL = 5 * 60 * 1000; // 5 Mins for retry after failure

export const metalRateService = {
  /**
   * getLiveRates
   * Pulls the absolute latest rates from the Local Database only.
   */
  async getLiveRates() {
    const latest = await supabaseService.getLatestMarketRates();
    
    if (!latest) {
      return {
        gold24k: 7650,
        gold22k: 7010,
        silver: 92,
        isFromDb: false,
        isMock: true
      };
    }

    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    return {
      gold24k: latest.gold_24k,
      gold22k: latest.gold_22k || Math.round(latest.gold_24k * (22 / 24)),
      silver: latest.silver,
      isFromDb: true,
      updatedAt: latest.created_at,
      isWeekend: isWeekend
    };
  },

  /**
   * getMarketTrends
   * Fetches the last 2 rates, calculates percentage change, and caches in LS.
   * Optimized for zero-egress after first load.
   */
  async getMarketTrends() {
    // 1. Check LocalStorage Cache
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data;
        }
      }
    }

    // 2. Fetch History (Optimized: 7 records for sparklines, specific columns)
    const history = await supabaseService.getRecentRateHistory();
    
    if (history.length < 2) {
      return { goldChange: 0, silverChange: 0, isNew: true, history: [] };
    }

    const [current, previous] = history;
    
    let goldChange = ((current.gold_24k - previous.gold_24k) / previous.gold_24k) * 100;
    let silverChange = ((current.silver - previous.silver) / previous.silver) * 100;

    // Sanity Check: Cap extreme outliers (likely data artifacts or mock issues)
    if (Math.abs(goldChange) > 20) goldChange = goldChange > 0 ? 2.5 : -2.5; 
    if (Math.abs(silverChange) > 20) silverChange = silverChange > 0 ? 1.8 : -1.8;

    const trendData = {
      goldChange: parseFloat(goldChange.toFixed(2)),
      silverChange: parseFloat(silverChange.toFixed(2)),
      lastUpdate: current.created_at,
      history: history.reverse().map(h => ({
        date: h.created_at,
        gold: h.gold_22k || Math.round(h.gold_24k * (22 / 24)),
        silver: h.silver
      }))
    };

    // 3. Cache it
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: trendData,
        timestamp: Date.now()
      }));
    }

    return trendData;
  },

  /**
   * autoSyncIfStale
   * Daily sync task with infinite-loop protection and 24h throttling.
   */
  async autoSyncIfStale() {
    // Failure Cooldown Logic
    if (typeof window !== 'undefined') {
      const lastAttempt = localStorage.getItem('pv_last_sync_attempt');
      if (lastAttempt && Date.now() - parseInt(lastAttempt) < REDUCED_TTL) {
        return { success: false, throttled: true, reason: 'Failure Cooldown' };
      }
    }

    const latest = await supabaseService.getLatestMarketRates();
    
    if (latest) {
      const lastUpdate = new Date(latest.created_at).getTime();
      const timeSinceUpdate = Date.now() - lastUpdate;
      const hour = new Date().getHours();

      // Ensure 24h gap AND after 9 AM
      if (timeSinceUpdate > 23 * 60 * 60 * 1000 && hour >= 9) {
        console.log('🔄 [Service] Attempting Daily Sync...');
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('pv_last_sync_attempt', Date.now().toString());
        }

        const result = await syncMarketRatesAction();
        
        if (result.success) {
          // Clear trends cache to force recalculation on next load
          localStorage.removeItem(CACHE_KEY);
        }
        return result;
      }
      return { success: true, cached: true };
    }

    // Initial Sync
    return await syncMarketRatesAction();
  },

  /**
   * forceSync
   * Bypasses all throttling and forces a live API fetch.
   */
  async forceSync() {
    console.log('⚡ [Service] Forcing Market Rate Sync...');
    const result = await syncMarketRatesAction(true);
    if (result.success) {
      localStorage.removeItem(CACHE_KEY);
    }
    return result;
  }
};
