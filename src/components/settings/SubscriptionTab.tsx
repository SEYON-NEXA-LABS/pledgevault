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
    <div className="subscription-container">
      <div className="billing-toggle-wrapper">
        <div className="billing-toggle">
          <button 
            className={`toggle-btn ${interval === 'monthly' ? 'active' : ''}`}
            onClick={() => setInterval('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${interval === 'yearly' ? 'active' : ''}`}
            onClick={() => setInterval('yearly')}
          >
            Yearly
          </button>
          {interval === 'yearly' && (
            <div className="saving-badge">2 Months Free</div>
          )}
        </div>
        <p className="billing-helper">
          {interval === 'yearly' ? 'Billing ₹9,990+ per year' : 'Flexible monthly billing'}
        </p>
      </div>

      <div className="plans-grid">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.id === currentPlan ? 'current' : ''} ${plan.id === 'pro' ? 'featured' : ''}`}>
            {plan.id === 'pro' && <div className="featured-badge"><Zap size={14} /> Recommended</div>}
            
            <div className="plan-header">
              <div className="plan-icon-box">
                {plan.id === 'free' && <Building2 size={24} />}
                {plan.id === 'starter' && <ShieldCheck size={24} />}
                {plan.id === 'pro' && <Zap size={24} />}
                {plan.id === 'elite' && <Crown size={24} />}
              </div>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
            </div>

            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">
                {interval === 'monthly' 
                  ? plan.monthlyPrice.toLocaleString('en-IN') 
                  : plan.yearlyPrice.toLocaleString('en-IN')}
              </span>
              <span className="period">{interval === 'monthly' ? '/mo' : '/yr'}</span>
            </div>

            <button 
              className={`btn-upgrade ${loading === plan.id ? 'loading' : ''} ${plan.id === currentPlan ? 'active' : ''}`}
              disabled={plan.id === currentPlan || !!loading}
              onClick={() => handleUpgrade(plan)}
            >
              {plan.id === currentPlan ? 'Current Plan' : (loading === plan.id ? 'Processing...' : 'Upgrade Now')}
              {plan.id !== currentPlan && !loading && <ChevronRight size={18} />}
            </button>

            <ul className="plan-features">
              {plan.features.map((feature: any, idx: number) => (
                <li key={idx} className={feature.included ? 'included' : 'excluded'}>
                  <Check size={16} className="check-icon" />
                  {feature.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="history-section">
        <div className="section-header">
          <h3>Billing History</h3>
          <button className="btn-refresh" onClick={fetchHistory} title="Refresh History">
            <RefreshCw size={16} className={fetchingHistory ? 'spin' : ''} />
          </button>
        </div>
        
        <div className="history-table-wrapper">
          <table className="history-table">
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
                  <td colSpan={6} className="empty-history">
                    {fetchingHistory ? 'Fetching history...' : 'No payment history yet.'}
                  </td>
                </tr>
              ) : history.map((sub) => (
                <tr key={sub.id}>
                  <td>{formatDate(sub.createdAt)}</td>
                  <td><span className="plan-name">{sub.planId.toUpperCase()}</span></td>
                  <td>{sub.interval === 'yearly' ? 'Yearly' : 'Monthly'}</td>
                  <td>₹{sub.amount.toLocaleString('en-IN')}</td>
                  <td><span className="pay-method">{sub.paymentMethod.toUpperCase()}</span></td>
                  <td><span className={`status-pill ${sub.status}`}>{sub.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="billing-footer">
        <div className="footer-info">
          <CreditCard size={18} />
          <span>Secure checkout powered by **Razorpay Stub**</span>
        </div>
        <div className="footer-warning">
          <AlertCircle size={14} />
          Note: This is a system development simulation. No real money will be charged.
        </div>
      </div>

      <style jsx>{`
        .subscription-container {
          padding-top: 10px;
        }

        .billing-toggle-wrapper {
          text-align: center;
          margin-bottom: 40px;
        }

        .billing-toggle {
          display: inline-flex;
          align-items: center;
          background: var(--bg-hover);
          padding: 6px;
          border-radius: 40px;
          border: 1px solid var(--border-light);
          position: relative;
        }

        .toggle-btn {
          padding: 10px 28px;
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          font-weight: 700;
          font-size: 14px;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .toggle-btn.active {
          background: var(--primary-teal-dark);
          color: #fff;
          box-shadow: 0 4px 12px rgba(14, 124, 134, 0.25);
        }

        .saving-badge {
          position: absolute;
          right: -110px;
          background: var(--accent-peach);
          color: var(--primary-teal-dark);
          font-size: 10px;
          font-weight: 900;
          padding: 4px 12px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .billing-helper {
          font-size: 13px;
          color: var(--text-tertiary);
          margin-top: 16px;
          font-weight: 500;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .plan-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 32px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .plan-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary-brand);
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }

        .plan-card.featured {
          background: linear-gradient(135deg, #0E7C86 0%, #1FB7C6 100%);
          border: none;
          color: #fff;
        }

        .plan-card.current {
          border: 2px solid var(--primary-brand);
        }

        .featured-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent-peach);
          color: var(--primary-teal-dark);
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .plan-icon-box {
          width: 56px;
          height: 56px;
          background: var(--bg-hover);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: var(--primary-brand);
        }

        .featured .plan-icon-box {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .plan-header h3 {
          margin: 0 0 8px 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .plan-header p {
          font-size: 14px;
          color: var(--text-tertiary);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .featured .plan-header p {
          color: rgba(255,255,255,0.8);
        }

        .plan-price {
          margin-bottom: 32px;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .currency {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-tertiary);
        }

        .featured .currency { color: rgba(255,255,255,0.6); }

        .amount {
          font-size: 44px;
          font-weight: 900;
          letter-spacing: -1.5px;
          color: var(--text-primary);
        }

        .featured .amount { color: #fff; }

        .period {
          font-size: 15px;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .featured .period { color: rgba(255,255,255,0.6); }

        .btn-upgrade {
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 32px;
          transition: all 0.3s;
          border: 1px solid var(--border-light);
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .btn-upgrade:not(.active):not(.loading) {
          background: var(--primary-teal-dark);
          color: #fff;
          border: none;
        }

        .plan-card.featured .btn-upgrade:not(.active) {
          background: #fff;
          color: var(--primary-teal-dark);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .btn-upgrade.active {
          background: var(--bg-primary);
          color: var(--text-tertiary);
          cursor: default;
          border: 1px solid var(--border-light);
        }

        .btn-upgrade:hover:not(.active):not(:disabled) {
          transform: scale(1.02);
          opacity: 0.95;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .plan-features li {
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
        }

        .check-icon {
          color: var(--primary-brand);
          flex-shrink: 0;
        }

        .featured .check-icon { color: var(--accent-peach); }

        .excluded {
          color: var(--text-tertiary);
          opacity: 0.4;
        }

        .billing-footer {
          margin-top: 60px;
          padding: 32px;
          background: var(--bg-hover);
          border-radius: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid var(--border-light);
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .footer-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #ef4444;
          font-weight: 700;
          background: #fee2e2;
          padding: 6px 14px;
          border-radius: 10px;
        }

        .history-section {
          margin-top: 64px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-header h3 { font-size: 20px; font-weight: 800; }

        .history-table-wrapper {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 24px;
          overflow: hidden;
        }

        .history-table th {
          text-align: left;
          padding: 18px 24px;
          background: var(--bg-hover);
          color: var(--text-tertiary);
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .history-table td {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-light);
          font-size: 14px;
        }

        .plan-name {
          font-weight: 800;
          color: var(--primary-brand);
        }

        .status-pill.active { background: var(--status-active-bg); color: var(--status-active-text); }
      `}</style>
    </div>
  );
}
