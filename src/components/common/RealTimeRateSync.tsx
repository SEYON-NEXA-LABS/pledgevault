'use client';

import React, { useState } from 'react';
import { metalRateService } from '@/lib/supabase/metalRateService';
import { RefreshCcw, Zap } from 'lucide-react';

interface RealTimeRateSyncProps {
  onSync: (rates: { gold24k: number; gold22k: number; silver: number }) => void;
  compact?: boolean;
}

export default function RealTimeRateSync({ onSync, compact = false }: RealTimeRateSyncProps) {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await metalRateService.forceSync();
      
      if (result.success && result.data) {
        onSync({ 
          gold24k: result.data.gold_24k, 
          gold22k: Math.round(result.data.gold_24k * (22/24)), 
          silver: result.data.silver 
        });
      }
    } catch (err) {
      console.error('Manual rate sync failed:', err);
    } finally {
      // Small artificial delay for visual feedback
      setTimeout(() => setLoading(false), 600);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="btn btn-ghost"
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--brand-primary)',
        fontSize: compact ? '11px' : '13px',
        fontWeight: 600,
        padding: compact ? '4px 8px' : '6px 12px',
        background: 'var(--bg-card)',
        border: '1.5px solid var(--brand-primary)',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.2s',
        opacity: loading ? 0.7 : 1,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <Zap size={compact ? 12 : 14} fill={loading ? 'none' : 'currentColor'} />
      {loading ? 'Fetching...' : 'Sync Market Rate'}
      {loading && <RefreshCcw size={14} className="spin" style={{ marginLeft: '4px' }} />}
    </button>
  );
}
