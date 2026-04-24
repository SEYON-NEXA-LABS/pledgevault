'use client';

import React, { useState } from 'react';
import { 
  Check, 
  Zap, 
  Crown, 
  Building2, 
  CreditCard,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatDate } from '@/lib/constants';
import { PlanTier, SubscriptionInterval, Subscription } from '@/lib/types';
import { razorpayStub } from '@/lib/payments/razorpay';
import { supabase } from '@/lib/supabase/client';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { useEffect } from 'react';
import { RefreshCw, Download } from 'lucide-react';

interface SubscriptionTabProps {
  currentPlan: PlanTier;
  onUpgrade?: (newPlan: PlanTier) => void;
  firmName: string;
}

export default function SubscriptionTab({ currentPlan, onUpgrade, firmName }: SubscriptionTabProps) {
  const [interval, setInterval] = useState<SubscriptionInterval>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const auth = authStore.get();

  useEffect(() => {
    fetchHistory();
  }, [auth.firmId]);

  const fetchHistory = async () => {
    if (!auth.firmId) return;
    setFetchingHistory(true);
    try {
      const data = await supabaseService.getFirmSubscriptions(auth.firmId);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleUpgrade = async (plan: any) => {
    if (plan.id === currentPlan) return;
    
    setLoading(plan.id);
    const amount = interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    
    if (amount === 0) {
      // Handle Free plan upgrade directly
      await onUpgrade?.(plan.id);
      setLoading(null);
      return;
    }

    try {
      const result = await razorpayStub({
        planId: plan.id,
        interval: interval,
        amount: amount,
        firmName: firmName,
        onSuccess: async (response) => {
          console.log('Payment Successful:', response);
          // 1. Record the full subscription details
          await supabaseService.createSubscription({
            firmId: auth.firmId ?? '',
            planId: plan.id,
            interval: interval,
            amount: amount,
            currency: 'INR',
            paymentMethod: response.paymentMethod,
            status: 'active',
            startDate: response.startDate,
            endDate: response.endDate,
            razorpayPaymentId: response.razorpayPaymentId,
            razorpayOrderId: response.razorpayOrderId,
          });

          // 2. Trigger parent upgrade callback
          await onUpgrade?.(plan.id);
          
          // 3. Refresh local history
          fetchHistory();
        }
      });
      
      if (!result) {
        console.log('Payment Cancelled');
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ paddingTop: '10px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-primary)', padding: '6px', borderRadius: '40px', border: '1px solid var(--border)', position: 'relative' }}>
          <button 
            className={`pv-btn ${interval === 'monthly' ? 'pv-btn-gold' : 'pv-btn-outline'}`}
            style={{ borderRadius: '30px', padding: '10px 28px', border: 'none' }}
            onClick={() => setInterval('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`pv-btn ${interval === 'yearly' ? 'pv-btn-gold' : 'pv-btn-outline'}`}
            style={{ borderRadius: '30px', padding: '10px 28px', border: 'none' }}
            onClick={() => setInterval('yearly')}
          >
            Yearly
          </button>
          {interval === 'yearly' && (
            <div style={{ position: 'absolute', right: '-110px', background: 'var(--brand-vibrant)', color: 'var(--brand-deep)', fontSize: '10px', fontWeight: 900, padding: '4px 12px', borderRadius: '8px', textTransform: 'uppercase' }}>2 Months Free</div>
          )}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '16px', fontWeight: 600 }}>
          {interval === 'yearly' ? 'Billing ₹9,990+ per year' : 'Flexible monthly billing'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div key={plan.id} className={`pv-card ${plan.id === 'pro' ? 'pv-glass' : ''}`} style={{ padding: '40px 32px', position: 'relative', border: plan.id === currentPlan ? '2px solid var(--gold)' : '', background: plan.id === 'pro' ? 'var(--brand-deep)' : '', color: plan.id === 'pro' ? 'white' : '' }}>
            {plan.id === 'pro' && (
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--brand-vibrant)', color: 'var(--brand-deep)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)' }}>
                <Zap size={14} /> Recommended
              </div>
            )}
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: plan.id === 'pro' ? 'rgba(255,255,255,0.1)' : 'var(--bg-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: plan.id === 'pro' ? 'white' : 'var(--brand-primary)', marginBottom: '20px' }}>
                {plan.id === 'free' && <Building2 size={24} />}
                {plan.id === 'starter' && <ShieldCheck size={24} />}
                {plan.id === 'pro' && <Zap size={24} />}
                {plan.id === 'elite' && <Crown size={24} />}
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0' }}>{plan.name}</h3>
              <p style={{ fontSize: '14px', opacity: 0.8, lineHeight: 1.6 }}>{plan.description}</p>
            </div>

            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 600, opacity: 0.6 }}>₹</span>
              <span style={{ fontSize: '44px', fontWeight: 900 }}>
                {interval === 'monthly' 
                  ? (plan.monthlyPrice?.toLocaleString('en-IN') ?? '0') 
                  : (plan.yearlyPrice?.toLocaleString('en-IN') ?? '0')}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 600, opacity: 0.6 }}>{interval === 'monthly' ? '/mo' : '/yr'}</span>
            </div>

            <button 
              className={`pv-btn ${plan.id === currentPlan ? 'pv-btn-outline' : (plan.id === 'pro' ? 'pv-btn-gold' : 'pv-btn-primary')}`}
              style={{ width: '100%', marginBottom: '32px' }}
              disabled={plan.id === currentPlan || !!loading}
              onClick={() => handleUpgrade(plan)}
            >
              {plan.id === currentPlan ? 'Current Plan' : (loading === plan.id ? 'Processing...' : 'Upgrade Now')}
              {plan.id !== currentPlan && !loading && <ChevronRight size={18} />}
            </button>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {plan.features.map((feature: any, idx: number) => (
                <li key={idx} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, opacity: feature.included ? 1 : 0.4 }}>
                  <Check size={16} style={{ color: plan.id === 'pro' ? 'var(--brand-vibrant)' : 'var(--brand-primary)', flexShrink: 0 }} />
                  {feature.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Billing History</h3>
          <button className="pv-btn pv-btn-outline pv-btn-sm" onClick={fetchHistory} title="Refresh History">
            <RefreshCw size={16} className={fetchingHistory ? 'spin' : ''} />
          </button>
        </div>
        
        <div className="pv-card" style={{ padding: 0 }}>
          <table className="pv-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Plan</th>
                <th>Billing</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    {fetchingHistory ? 'Fetching history...' : 'No payment history yet.'}
                  </td>
                </tr>
              ) : history.map((sub) => (
                <tr key={sub.id}>
                  <td>{formatDate(sub.createdAt)}</td>
                  <td><span style={{ fontWeight: 800 }}>{(sub.planId || 'UNKNOWN').toUpperCase()}</span></td>
                  <td>{sub.interval === 'yearly' ? 'Yearly' : 'Monthly'}</td>
                  <td style={{ fontWeight: 700 }}>₹{sub.amount?.toLocaleString('en-IN') ?? '0'}</td>
                  <td>{(sub.paymentMethod || 'OTHER').toUpperCase()}</td>
                  <td><span className="pv-badge" style={{ background: 'var(--status-active-bg)', color: 'var(--status-active)', fontWeight: 800 }}>{sub.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '60px', padding: '32px', background: 'var(--bg-primary)', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <CreditCard size={18} />
          <span>Secure checkout powered by **Razorpay Stub**</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--status-overdue)', fontWeight: 800, background: 'var(--status-overdue-bg)', padding: '6px 14px', borderRadius: '10px' }}>
          <AlertCircle size={14} />
          Note: System development simulation. No real money will be charged.
        </div>
      </div>


    </div>
  );
}
