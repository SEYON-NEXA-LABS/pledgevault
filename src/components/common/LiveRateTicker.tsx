'use client';

import React, { useEffect, useState } from 'react';
import { metalRateService } from '@/lib/supabase/metalRateService';
import { RefreshCcw, Clock } from 'lucide-react';
import { authStore } from '@/lib/authStore';
import { settingsStore } from '@/lib/store';
import { translations, Language } from '@/lib/i18n/translations';

export default function LiveRateTicker() {
  const [rates, setRates] = useState<{ gold22k: number; silver: number; updatedAt?: string; isFromDb?: boolean; isWeekend?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>(settingsStore.get().language || 'en');
  const t = translations[lang];

  useEffect(() => {
    const handleSync = () => {
      setLang(settingsStore.get().language || 'en');
    };
    window.addEventListener('pv_settings_updated', handleSync);
    return () => window.removeEventListener('pv_settings_updated', handleSync);
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await metalRateService.getLiveRates();
      setRates(data);
    } catch (err) {
      console.error('Ticker fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Silently check if the daily 24h/9AM sync is needed
    metalRateService.autoSyncIfStale();

    const interval = setInterval(fetchRates, 5 * 60 * 1000); // Polling DB every 5 mins
    return () => clearInterval(interval);
  }, []);

  if (!rates && loading) return null;

  const isManager = authStore.isManager() || authStore.isSuperadmin();

  return (
    <div className="live-rate-ticker">
      {/* Label Badge */}
      <div className="ticker-label-badge" title="Market rates are synchronized once every 24 hours (after 9:00 AM)">
        <div className="ticker-status-dot" />
        <span className="ticker-label-txt">
          {t.common.liveMarket}
        </span>
      </div>

      {/* Values */}
      <div className="ticker-values">
        <div className="rate-val" title={`${t.common.gold} 22K (Per Gram)`}>
          <span className={`metal-symbol ${lang === 'ta' ? 'lang-ta' : ''}`}>{t.common.gold}</span>
          <span className="price-txt gold">₹{rates?.gold22k?.toLocaleString('en-IN') || '---'}</span>
        </div>

        <div className="ticker-divider" />

        <div className="rate-val" title={`${t.common.silver} (Per Gram)`}>
          <span className={`metal-symbol ${lang === 'ta' ? 'lang-ta' : ''}`}>{t.common.silver}</span>
          <span className="price-txt silver">₹{rates?.silver?.toLocaleString('en-IN') || '---'}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="ticker-meta">
        {rates?.updatedAt && (
           <div className="sync-info" title="Latest Database Sync">
             <Clock size={12} />
             <span>{new Date(rates.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
           </div>
        )}

        {isManager && (
          <button 
            onClick={fetchRates}
            className="refresh-btn"
            title="Refresh from Database"
          >
            <RefreshCcw size={12} className={loading ? 'spin' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}
