'use client';

import React, { useState, useEffect } from 'react';
import { Scale, Calculator, RefreshCw, Zap, Edit3, MessageCircle, ArrowRight } from 'lucide-react';
import { getPurityFactor } from '@/lib/gold';
import { formatCurrency, formatWeight, GOLD_PURITY_MAP, SILVER_PURITY_MAP } from '@/lib/constants';
import { metalRateService } from '@/lib/supabase/metalRateService';
import { useRouter } from 'next/navigation';
import { settingsStore } from '@/lib/store';

export default function QuickAppraisal() {
  const router = useRouter();
  const [metalType, setMetalType] = useState<'gold' | 'silver'>('gold');
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState('916');
  const [rate, setRate] = useState(0);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRates();
  }, [metalType]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const live = await metalRateService.getLiveRates();
      setRate(metalType === 'gold' ? live.gold24k : live.silver);
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const purityFactor = getPurityFactor(metalType, purity);
  const settings = settingsStore.get();
  
  // Calculations
  const marketValue = (parseFloat(weight) || 0) * purityFactor * rate;
  const ltv = metalType === 'gold' ? settings.defaultLtvGold : settings.defaultLtvSilver;
  const loanAmount = marketValue * (ltv / 100);
  const monthlyInterest = loanAmount * (settings.defaultInterestRate / 100);

  const handleShare = () => {
    const message = `*Quick Quote - ${metalType === 'gold' ? 'Gold' : 'Silver'} Appraisal*
---------------------------
*Weight:* ${weight}g
*Purity:* ${purity}${metalType === 'gold' ? 'K' : ''}
*Rate:* ${formatCurrency(rate)}/g
---------------------------
*Market Value:* ${formatCurrency(marketValue)}
*Max Loan (at ${ltv}% LTV):* ${formatCurrency(loanAmount)}
*Monthly Interest:* ${formatCurrency(monthlyInterest)}
---------------------------
Generated via PledgeVault`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleConvertToLoan = () => {
    const params = new URLSearchParams({
      metal: metalType,
      weight: weight,
      purity: purity,
      rate: rate.toString()
    });
    router.push(`/loans/new?${params.toString()}`);
  };

  return (
    <div className="pv-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Calculator size={18} style={{ color: 'var(--brand-primary)' }} /> Quick Appraisal
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`pv-btn pv-btn-sm ${metalType === 'gold' ? 'pv-btn-primary' : 'pv-btn-outline'}`}
            onClick={() => { setMetalType('gold'); setPurity('916'); }}
            style={{ padding: '4px 12px', fontSize: '11px' }}
          >Gold</button>
          <button 
            className={`pv-btn pv-btn-sm ${metalType === 'silver' ? 'pv-btn-primary' : 'pv-btn-outline'}`}
            onClick={() => { setMetalType('silver'); setPurity('999'); }}
            style={{ padding: '4px 12px', fontSize: '11px' }}
          >Silver</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div className="pv-input-group">
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Weight (grams)</label>
          <div style={{ position: 'relative' }}>
            <Scale size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              type="number" 
              className="pv-input" 
              placeholder="0.00"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="pv-input-group">
            <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Purity</label>
            <select 
              className="pv-input" 
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
            >
              {metalType === 'gold'
                ? Object.entries(GOLD_PURITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
                : Object.entries(SILVER_PURITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              <option value="22">22K (Custom)</option>
              <option value="18">18K (Custom)</option>
            </select>
          </div>
          <div className="pv-input-group">
            <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
              Price/g
              <button 
                onClick={() => setIsEditingRate(!isEditingRate)}
                style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '10px' }}
              >
                {isEditingRate ? 'Done' : 'Edit'}
              </button>
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                className="pv-input" 
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                disabled={!isEditingRate}
                style={{ 
                  background: isEditingRate ? 'white' : 'var(--bg-muted)',
                  borderColor: isEditingRate ? 'var(--brand-primary)' : 'var(--border)'
                }}
              />
              {!isEditingRate && loading && (
                <RefreshCw size={12} className="spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
              )}
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: 'auto', 
          background: 'var(--bg-primary)', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}>
          {/* Market Value Row */}
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Market Value</span>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{formatCurrency(marketValue)}</span>
          </div>
          
          {/* Loan Amount Row */}
          <div style={{ padding: '16px', textAlign: 'center', background: 'var(--brand-soft)' }}>
            <div style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
              Max Loan ({ltv}% LTV)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--brand-deep)' }}>
              {formatCurrency(loanAmount)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, marginTop: '4px' }}>
              Monthly Interest: {formatCurrency(monthlyInterest)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button 
            className="pv-btn pv-btn-outline" 
            onClick={handleShare}
            disabled={!weight}
            style={{ color: '#22c55e', borderColor: '#22c55e' }}
          >
            <MessageCircle size={18} /> Share
          </button>
          <button 
            className="pv-btn pv-btn-primary" 
            onClick={handleConvertToLoan}
            disabled={!weight}
            style={{ gap: '4px' }}
          >
            Create Loan <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
