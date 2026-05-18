'use server';

import { createAdminClient } from '@/lib/supabase/admin';

const MIN_SYNC_INTERVAL = 23 * 60 * 60 * 1000; // 23 Hours (Security margin)
// Indian retail market premiums over international spot rates to match Google (inclusive of customs duty, local spread and GST)
const GOLD_INR_PREMIUM = 1.11; // ~11% premium for gold 24K and 22K
const SILVER_INR_PREMIUM = 1.22; // ~22% premium for silver

export async function syncMarketRatesAction(force = false) {
    const adminClient = createAdminClient();
    const GOLD_API_KEY = process.env.NEXT_PUBLIC_GOLD_API_KEY;

    if (!GOLD_API_KEY) {
        console.warn('⚠️ syncMarketRatesAction: GOLD_API_KEY is missing. Skipping live sync.');
        return { success: false, error: 'API Key Missing' };
    }

    try {
        // 1. STRICTOR 24H RULE: Check database first to prevent wasted API calls
        if (!force) {
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
        }

        console.log(`📡 [Server Action] Syncing market rates from GoldAPI.io (Force: ${force})...`);
        
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

        // 2. RATE CALCULATION
        // Applied premiums (Customs, GST, local charges) to match local Google rates
        const gold24kRaw = goldData.price_gram_24k || (goldData.price / 31.1035);
        const gold22kRaw = goldData.price_gram_22k || (gold24kRaw * 0.916);
        const silverRaw = silverData.price_gram || silverData.price_gram_24k || (silverData.price / 31.1035);
        
        const rates = {
            gold24k: Math.round(gold24kRaw * GOLD_INR_PREMIUM),
            gold22k: Math.round(gold22kRaw * GOLD_INR_PREMIUM),
            silver: Math.round(silverRaw * SILVER_INR_PREMIUM),
        };

        console.log('📊 [Server Action] Synced Rates (With Indian Premiums applied to match Google):', rates);

        // Insert using ADMIN CLIENT to bypass RLS
        // We store the full JSON payload in a 'metadata' column for audit purposes
        const { data, error } = await adminClient
            .from('market_rates')
            .insert([{ 
                gold_24k: rates.gold24k, 
                gold_22k: rates.gold22k,
                silver: rates.silver,
                metadata: {
                    gold_raw: goldData,
                    silver_raw: silverData,
                    synced_at: new Date().toISOString(),
                    adjustment_applied: {
                        gold: GOLD_INR_PREMIUM,
                        silver: SILVER_INR_PREMIUM
                    }
                }
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
