import { supabaseService } from './service';

const GOLD_API_KEY = process.env.NEXT_PUBLIC_GOLD_API_KEY || '';
const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 Hours

export const metalRateService = {
  async getLiveRates() {
    // 1. Fetch the latest global market rate from DB
    const latest = await supabaseService.getLatestMarketRates();
    
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6; // 0=Sun, 6=Sat

    if (latest) {
      const lastFetch = new Date(latest.created_at).getTime();
      const isFresh = (Date.now() - lastFetch) < STALE_THRESHOLD;
      
      // OPTIMIZATION: On weekends, we ALWAYS use the Friday price
      // On weekdays, we use the cache if it's < 24h old
      if (isWeekend || isFresh) {
        return {
          gold24k: latest.gold_24k,
          gold22k: Math.round(latest.gold_24k * (22 / 24)),
          silver: latest.silver,
          isFromDb: true,
          updatedAt: latest.created_at,
          isWeekend: isWeekend
        };
      }
    }

    // 2. Return Mock Data if no API Key (Safety fallback)
    if (!GOLD_API_KEY) {
      return {
        gold24k: 7650,
        gold22k: 7010,
        silver: 92,
        isFromDb: false
      };
    }

    // 3. Fetch from GoldAPI.io (Weekday & Stale)
    return this.forceApiUpdate();
  },

  async forceApiUpdate() {
    if (!GOLD_API_KEY) throw new Error('API Key Missing');
    
    try {
      console.log('📡 Fetching global market sync from GoldAPI.io...');
      const [goldRes, silverRes] = await Promise.all([
        fetch('https://www.goldapi.io/api/XAU/INR', {
          headers: { 'x-access-token': GOLD_API_KEY }
        }),
        fetch('https://www.goldapi.io/api/XAG/INR', {
          headers: { 'x-access-token': GOLD_API_KEY }
        })
      ]);

      const goldData = await goldRes.json();
      const silverData = await silverRes.json();

      const goldPrice24k = goldData.price_gram_24k || (goldData.price / 31.1035);
      const silverPrice = silverData.price_gram_24k || (silverData.price / 31.1035);

      const rates = {
        gold24k: Math.round(goldPrice24k),
        gold22k: Math.round(goldPrice24k * (22 / 24)),
        silver: Math.round(silverPrice),
      };

      // PERSIST TO GLOBAL TABLE for all firms to share
      const entry = await supabaseService.addMarketRateEntry(rates.gold24k, rates.silver);

      return { 
        ...rates, 
        isFromDb: false, 
        updatedAt: entry.created_at 
      };
    } catch (err) {
      console.error('Global API Update failed:', err);
      throw err;
    }
  }
};
