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
          background: var(--bg-input);
          padding: 6px;
          border-radius: 40px;
          border: 1px solid var(--border-color);
          position: relative;
        }

        .toggle-btn {
          padding: 8px 24px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: var(--gold);
          color: #111;
          box-shadow: 0 4px 12px rgba(212, 168, 67, 0.2);
        }

        .saving-badge {
          position: absolute;
          right: -100px;
          background: #34E0A1;
          color: #111;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .billing-helper {
          font-size: 13px;
          color: var(--text-tertiary);
          margin-top: 12px;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .plan-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .plan-card:hover {
          transform: translateY(-8px);
          border-color: var(--gold);
        }

        .plan-card.featured {
          background: #1A3C34;
          border-color: var(--gold);
          color: #fff;
        }

        .plan-card.current {
          border-color: var(--gold);
          box-shadow: 0 0 0 2px var(--gold);
        }

        .featured-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--gold);
          color: #111;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .plan-icon-box {
          width: 50px;
          height: 50px;
          background: var(--bg-input);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: var(--gold);
        }

        .featured .plan-icon-box {
          background: rgba(212, 168, 67, 0.1);
        }

        .plan-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 700;
        }

        .plan-header p {
          font-size: 13px;
          color: var(--text-tertiary);
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .featured .plan-header p {
          color: rgba(255,255,255,0.6);
        }

        .plan-price {
          margin-bottom: 32px;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .currency {
          font-size: 24px;
          font-weight: 500;
          color: var(--text-tertiary);
        }

        .amount {
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .period {
          font-size: 14px;
          color: var(--text-tertiary);
        }

        .btn-upgrade {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 32px;
          transition: all 0.2s;
          border: 1px solid var(--border-color);
        }

        .btn-upgrade:not(.active) {
          background: var(--gold);
          color: #111;
          border: none;
        }

        .plan-card.featured .btn-upgrade:not(.active) {
          background: var(--gold);
          box-shadow: 0 8px 24px rgba(212, 168, 67, 0.3);
        }

        .btn-upgrade.active {
          background: var(--bg-input);
          color: var(--text-tertiary);
          cursor: default;
        }

        .btn-upgrade:hover:not(.active):not(:disabled) {
          background: #E5C369;
          transform: scale(1.02);
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .plan-features li {
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .check-icon {
          color: var(--gold);
          flex-shrink: 0;
        }

        .excluded {
          color: var(--text-tertiary);
          opacity: 0.5;
        }

        .excluded .check-icon {
          color: var(--text-tertiary);
        }

        .billing-footer {
          margin-top: 60px;
          padding: 24px;
          background: var(--bg-input);
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid var(--border-color);
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .footer-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #dc3545;
          font-weight: 600;
        }

        /* History Table Styles */
        .history-section {
          margin-top: 60px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .btn-refresh {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .history-table-wrapper {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .history-table th {
          text-align: left;
          padding: 16px;
          background: var(--bg-input);
          color: var(--text-tertiary);
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }

        .history-table td {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .history-table tr:last-child td {
          border-bottom: none;
        }

        .plan-name {
          font-weight: 700;
          color: var(--gold);
        }

        .pay-method {
          font-size: 11px;
          background: var(--bg-input);
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--text-secondary);
        }

        .status-pill {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .status-pill.active { background: rgba(52, 224, 161, 0.1); color: #34E0A1; }
        .status-pill.expired { background: rgba(220, 53, 69, 0.1); color: #dc3545; }

        .empty-history {
          text-align: center;
          padding: 60px !important;
          color: var(--text-tertiary);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
