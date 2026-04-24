'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Calendar,
  Clock,
  ShieldAlert,
  Search,
  HandCoins,
  ChevronLeft,
  RefreshCw,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatDate, SUBSCRIPTION_PLANS, GRACE_PERIOD_DAYS } from '@/lib/constants';
import { PlanTier, SubscriptionInterval } from '@/lib/types';

export default function SuperadminSubscriptions() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const firms = await supabaseService.getFirmsDetailed();
      setData(firms || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (latestSub: any) => {
    if (!latestSub) return { label: 'No Sub', color: '#6F767E' };
    
    const end = new Date(latestSub.endDate);
    const now = new Date();
    
    if (now <= end) return { label: 'Active', color: '#34E0A1' };
    
    const graceEnd = new Date(end);
    graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);
    
    if (now <= graceEnd) return { label: 'Grace Period', color: '#FFD700' };
    
    return { label: 'Blocked', color: '#dc3545' };
  };

  const calculateMRR = () => {
    let mrr = 0;
    data.forEach(firm => {
      const latest = firm.subscriptions?.[0];
      if (latest && latest.status === 'active') {
        const amount = latest.amount || 0;
        mrr += latest.interval === 'yearly' ? amount / 12 : amount;
      }
    });
    return mrr;
  };

  const filteredFirms = data.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firmId = formData.get('firmId') as string;
    const planId = formData.get('planId') as PlanTier;
    const interval = formData.get('interval') as SubscriptionInterval;
    const amount = Number(formData.get('amount'));
    const method = formData.get('method') as any;

    const startDate = new Date();
    const endDate = new Date();
    if (interval === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    try {
      await supabaseService.createSubscription({
        firmId: firmId,
        planId: planId,
        interval: interval,
        amount: amount,
        currency: 'INR',
        paymentMethod: method,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setShowManualModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to record subscription');
    }
  };

  const handleExtend = async (firmId: string) => {
    if (!confirm('Extend trial/subscription by 7 days?')) return;
    try {
      await supabaseService.extendSubscription(firmId, 7);
      fetchData();
    } catch (err) {
      alert('Extension failed: ' + (err as any).message);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading Management Console...</div>;
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <div className="page-header-left">
          <Link href="/superadmin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '13px', textDecoration: 'none', marginBottom: '8px', fontWeight: 600 }}>
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 style={{ fontSize: '32px' }}>Subscription Management</h1>
        </div>
        <div className="page-header-right">
          <button className="pv-btn pv-btn-gold" onClick={() => setShowManualModal(true)}>
            <HandCoins size={18} /> Record Payment
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div className="pv-card pv-glass" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--brand-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Estimated MRR</span>
            <div style={{ fontSize: '24px', fontWeight: 900 }}>{formatCurrency(calculateMRR())}</div>
          </div>
        </div>
        <div className="pv-card pv-glass" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--brand-deep)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Active Firms</span>
            <div style={{ fontSize: '24px', fontWeight: 900 }}>{data.length}</div>
          </div>
        </div>
        <div className="pv-card pv-glass" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--status-overdue-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-overdue)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Expiring Soon</span>
            <div style={{ fontSize: '24px', fontWeight: 900 }}>3</div>
          </div>
        </div>
      </div>

      <div className="pv-card" style={{ padding: 0 }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
               className="pv-input"
               style={{ paddingLeft: '40px', height: '40px' }}
              placeholder="Filter by firm name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, cursor: 'pointer' }} onClick={fetchData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div>
          <table className="pv-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Current Plan</th>
                <th>Last Payment</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFirms.map(firm => {
                const latestSub = firm.subscriptions?.[0]; // Assuming descending sort from DB or handle in JS
                const status = getStatus(latestSub);
                return (
                  <tr key={firm.id}>
                    <td>
                      <div style={{ fontWeight: 800 }}>{firm.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{(firm.id || '').slice(0,8).toUpperCase()}</div>
                    </td>
                    <td>
                      <span className={`badge ${firm.plan || 'free'}`}>{(firm.plan || 'free').toUpperCase()}</span>
                    </td>
                    <td>
                      {latestSub ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{latestSub.amount > 0 ? formatCurrency(latestSub.amount) : 'Free'}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{(latestSub.paymentMethod || 'N/A').toUpperCase()}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {latestSub ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#888" />
                          <span>{formatDate(latestSub.endDate)}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="pv-badge" style={{ background: `${status.color}15`, color: status.color, fontWeight: 800 }}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <button className="pv-btn pv-btn-outline pv-btn-sm" onClick={() => handleExtend(firm.id)}>Extend 7 Days</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {showManualModal && (
        <div className="modal-overlay">
          <div className="pv-card" style={{ width: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Record Manual Payment</h2>
              <button onClick={() => setShowManualModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="pv-input-group">
                <label>Select Firm</label>
                <select name="firmId" required className="pv-input">
                  <option value="">-- Choose Business --</option>
                  {data.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="pv-input-group">
                  <label>Plan</label>
                  <select name="planId" required className="pv-input">
                    {SUBSCRIPTION_PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="pv-input-group">
                  <label>Interval</label>
                  <select name="interval" required className="pv-input">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="pv-input-group">
                  <label>Amount (₹)</label>
                  <input type="number" name="amount" required placeholder="0" className="pv-input" />
                </div>
                <div className="pv-input-group">
                  <label>Payment Method</label>
                  <select name="method" required className="pv-input">
                    <option value="cash">Cash</option>
                    <option value="netbanking">Bank Transfer</option>
                    <option value="upi">UPI (Manual)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="pv-btn pv-btn-outline" onClick={() => setShowManualModal(false)}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-gold">Activate Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
