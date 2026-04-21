'use client';

import React, { useEffect, useState } from 'react';
import { metalRateService } from '@/lib/supabase/metalRateService';
import { RefreshCcw, Clock } from 'lucide-react';
import { ShopSettings } from '@/lib/types';
import { authStore } from '@/lib/authStore';

export default function LiveRateTicker() {
  const [rates, setRates] = useState<{ gold22k: number; silver: number; updatedAt?: string; isFromDb?: boolean; isWeekend?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

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
    // Refresh every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!rates && loading) return null;

  return (
    <div className="live-rate-ticker" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '4px 10px',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '11px',
      color: 'white',
      fontWeight: 500,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          background: rates?.isWeekend ? '#FDBA74' : rates?.isFromDb ? '#10B981' : '#FDBA74',
          boxShadow: `0 0 8px ${rates?.isWeekend ? '#FDBA74' : rates?.isFromDb ? '#10B981' : '#FDBA74'}`,
          animation: 'pulse-green 2s infinite'
        }} />
        <span style={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Today's Rate
        </span>
      </div>

      <div style={{ width: '1px', height: '12px', background: 'rgba(255, 255, 255, 0.2)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div title="Gold 22K (Per Gram)">₹{rates?.gold22k?.toLocaleString('en-IN')}</div>
        <div style={{ width: '1px', height: '12px', background: 'rgba(255, 255, 255, 0.1)' }} />
        <div title="Silver (Per Gram)" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>₹{rates?.silver?.toLocaleString('en-IN')}</div>
      </div>

      {rates?.updatedAt && (
        <>
          <div style={{ width: '1px', height: '12px', background: 'rgba(255, 255, 255, 0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }} title="Last Fetch Timestamp">
            <Clock size={10} />
            <span>{new Date(rates.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </>
      )}

      {authStore.isManager() && (
        <button 
          onClick={fetchRates}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer', 
            padding: '2px',
            opacity: 0.6,
            display: 'flex',
            alignItems: 'center',
            marginLeft: '4px'
          }}
          title="Force Market Update"
        >
          <RefreshCcw size={12} className={loading ? 'spin' : ''} />
        </button>
      )}

      <style jsx global>{`
        @keyframes pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
