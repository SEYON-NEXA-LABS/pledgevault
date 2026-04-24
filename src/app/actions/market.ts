'use server';

import { createAdminClient } from '@/lib/supabase/admin';

const MIN_SYNC_INTERVAL = 23 * 60 * 60 * 1000; // 23 Hours (Security margin)

export async function syncMarketRatesAction() {
    const adminClient = createAdminClient();
    const GOLD_API_KEY = process.env.NEXT_PUBLIC_GOLD_API_KEY;

    if (!GOLD_API_KEY) {
        console.warn('⚠️ syncMarketRatesAction: GOLD_API_KEY is missing. Skipping live sync.');
        return { success: false, error: 'API Key Missing' };
    }

    try {
        // 1. STRICTOR 24H RULE: Check database first to prevent wasted API calls
        const { data: latest } = await adminClient
            .from('market_rates')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (latest) {
            const lastUpdate = new Date(latest.created_at).getTime();
            const timeSinceLastUpdate = Date.now() - lastUpdate;
            const now = new Date();
            const hour = now.getHours();

            // Rule: Don't update if data is < 23h old 
            // OR if it's before 9 AM (Wait for today's opening rate)
            if (timeSinceLastUpdate < MIN_SYNC_INTERVAL || hour < 9) {
                console.log(`🛡️ [Server Action] Throttling: Last sync was ${Math.round(timeSinceLastUpdate / 3600000)}h ago. Skipping.`);
                return { success: true, data: latest, throttled: true };
            }
        }

        console.log('📡 [Server Action] Syncing market rates from GoldAPI.io...');
        
        const [goldRes, silverRes] = await Promise.all([
            fetch('https://www.goldapi.io/api/XAU/INR', {
                headers: { 'x-access-token': GOLD_API_KEY }
            }),
            fetch('https://www.goldapi.io/api/XAG/INR', {
                headers: { 'x-access-token': GOLD_API_KEY }
            })
        ]);

        if (!goldRes.ok || !silverRes.ok) {
            throw new Error(`GoldAPI failed: Gold ${goldRes.status}, Silver ${silverRes.status}`);
        }

        const goldData = await goldRes.json();
        const silverData = await silverRes.json();

        // Standard conversion if price_gram_24k is missing
        const goldPrice24k = goldData.price_gram_24k || (goldData.price / 31.1035);
        const silverPrice = silverData.price_gram_24k || (silverData.price / 31.1035);

        const rates = {
            gold24k: Math.round(goldPrice24k),
            silver: Math.round(silverPrice),
        };

        // Insert using ADMIN CLIENT to bypass RLS
        const { data, error } = await adminClient
            .from('market_rates')
            .insert([{ 
                gold_24k: rates.gold24k, 
                silver: rates.silver 
            }])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ [Server Action] Market rates updated successfully.');
        return { success: true, data };
    } catch (err: any) {
        console.error('❌ [Server Action] Market sync failed:', err.message);
        return { success: false, error: err.message };
    }
}
