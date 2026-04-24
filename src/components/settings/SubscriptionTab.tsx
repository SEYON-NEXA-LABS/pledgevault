import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Zap, 
  Crown, 
  Building2, 
  CreditCard,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HandCoins,
  Info
} from 'lucide-react';
import { PLAN_LIMITS, SUBSCRIPTION_PLANS, formatDate } from '@/lib/constants';
import { PlanTier, SubscriptionInterval, Subscription } from '@/lib/types';
import { getPlanMovement } from '@/lib/plans';
import { razorpayStub } from '@/lib/payments/razorpay';
import { supabase } from '@/lib/supabase/client';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { settingsStore } from '@/lib/store';
import { RefreshCw, Download, Users as UsersIcon } from 'lucide-react';
import { translations, Language } from '@/lib/i18n/translations';

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
  const [lang, setLang] = useState<Language>('en');

  const [usage, setUsage] = useState({
    loans: 0,
    branches: 0,
    users: 0
  });
  const [fetchingUsage, setFetchingUsage] = useState(false);

  const auth = authStore.get();

  useEffect(() => {
    // Sync Lang
    const s = settingsStore.get();
    if (s.language) setLang(s.language as Language);

    const syncLang = () => {
      const updated = settingsStore.get();
      if (updated.language) setLang(updated.language as Language);
    };
    window.addEventListener('pv_settings_updated', syncLang);
    
    fetchHistory();
    fetchUsage();

    return () => window.removeEventListener('pv_settings_updated', syncLang);
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

  const fetchUsage = async () => {
    if (!auth.firmId) return;
    setFetchingUsage(true);
    try {
      const [loanCount, branches, team] = await Promise.all([
        supabaseService.getActiveLoanCount(auth.firmId),
        supabaseService.getBranches(auth.firmId),
        supabaseService.getFirmTeam(auth.firmId)
      ]);
      setUsage({
        loans: loanCount,
        branches: branches.length,
        users: team.length
      });
    } catch (err) {
      console.error('Error fetching usage:', err);
    } finally {
      setFetchingUsage(false);
    }
  };

  const t = translations[lang] || translations.en;
  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;

  const handleUpgrade = async (plan: any) => {
    if (plan.id === currentPlan) return;
    
    const movement = getPlanMovement(currentPlan, plan.id);
    if (movement === 'downgrade') {
      const confirmed = confirm(
        "WARNING: You are downgrading your plan. \n\n" +
        "1. Payments are non-refundable. \n" +
        "2. Higher-tier features (like unlimited branches) will be restricted immediately if you exceed your new plan limits. \n\n" +
        "Are you sure you want to proceed?"
      );
      if (!confirmed) return;
    }

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
          
          // 3. Refresh local history & usage
          fetchHistory();
          fetchUsage();
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

  const UsageProgressBar = ({ label, current, max, icon: Icon }: any) => {
    const isUnlimited = max === Infinity;
    const percentage = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
    const isWarning = !isUnlimited && percentage > 80;
    const isDanger = !isUnlimited && percentage >= 100;

    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
            <Icon size={14} style={{ color: 'var(--brand-primary)' }} />
            {label}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 800 }}>
            <span style={{ color: isDanger ? 'var(--status-overdue)' : 'var(--foreground)' }}>{current}</span>
            <span style={{ color: 'var(--text-tertiary)', margin: '0 4px', fontWeight: 500 }}>{t.settings.usage.of}</span>
            <span>{isUnlimited ? t.settings.usage.unlimited : max}</span>
          </div>
        </div>
        {!isUnlimited && (
          <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${percentage}%`, 
                background: isDanger ? 'var(--status-overdue)' : (isWarning ? 'orange' : 'var(--brand-primary)'),
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 10px rgba(var(--brand-primary-rgb), 0.2)'
              }} 
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div style={{ paddingTop: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', marginBottom: '48px', alignItems: 'start' }}>
        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div key={plan.id} className={`pv-card ${plan.id === 'pro' ? 'pv-glass' : ''}`} style={{ padding: '32px 24px', position: 'relative', border: plan.id === currentPlan ? '2px solid var(--gold)' : '', background: plan.id === 'pro' ? 'var(--brand-deep)' : '', color: plan.id === 'pro' ? 'white' : '' }}>
              {plan.id === 'pro' && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--brand-vibrant)', color: 'var(--brand-deep)', padding: '6px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)' }}>
                  <Zap size={12} /> RECOMMENDED
                </div>
              )}
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', background: plan.id === 'pro' ? 'rgba(255,255,255,0.1)' : 'var(--bg-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: plan.id === 'pro' ? 'white' : 'var(--brand-primary)', marginBottom: '16px' }}>
                  {plan.id === 'free' && <Building2 size={20} />}
                  {plan.id === 'starter' && <ShieldCheck size={20} />}
                  {plan.id === 'pro' && <Zap size={20} />}
                  {plan.id === 'elite' && <Crown size={20} />}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>{plan.name}</h3>
                <p style={{ fontSize: '12px', opacity: 0.8, lineHeight: 1.5, height: '45px', overflow: 'hidden' }}>{plan.description}</p>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, opacity: 0.6 }}>₹</span>
                <span style={{ fontSize: '32px', fontWeight: 900 }}>
                  {interval === 'monthly' 
                    ? (plan.monthlyPrice?.toLocaleString('en-IN') ?? '0') 
                    : (plan.yearlyPrice?.toLocaleString('en-IN') ?? '0')}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.6 }}>{interval === 'monthly' ? '/mo' : '/yr'}</span>
              </div>

              <button 
                className={`pv-btn pv-btn-sm ${plan.id === currentPlan ? 'pv-btn-outline' : (plan.id === 'pro' ? 'pv-btn-gold' : 'pv-btn-primary')}`}
                style={{ width: '100%', marginBottom: '20px' }}
                disabled={plan.id === currentPlan || !!loading}
                onClick={() => handleUpgrade(plan)}
              >
                {plan.id === currentPlan ? 'Current Plan' : (loading === plan.id ? '...' : 'Upgrade')}
                {plan.id !== currentPlan && !loading && <ChevronRight size={14} />}
              </button>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.slice(0, 4).map((feature: any, idx: number) => (
                  <li key={idx} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, opacity: feature.included ? 1 : 0.4 }}>
                    <Check size={14} style={{ color: plan.id === 'pro' ? 'var(--brand-vibrant)' : 'var(--brand-primary)', flexShrink: 0 }} />
                    {feature.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar: Usage & Interval */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Billing Switcher */}
          <div className="pv-card" style={{ padding: '20px' }}>
             <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <button 
                  className={`pv-btn pv-btn-sm ${interval === 'monthly' ? 'pv-btn-gold' : 'pv-btn-ghost'}`}
                  style={{ flex: 1, borderRadius: '8px' }}
                  onClick={() => setInterval('monthly')}
                >
                  Monthly
                </button>
                <button 
                  className={`pv-btn pv-btn-sm ${interval === 'yearly' ? 'pv-btn-gold' : 'pv-btn-ghost'}`}
                  style={{ flex: 1, borderRadius: '8px' }}
                  onClick={() => setInterval('yearly')}
                >
                  Yearly
                </button>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)', fontWeight: 800, fontSize: '11px' }}>
                <Zap size={14} /> SAVE 20% WITH YEARLY
             </div>
          </div>

          {/* Usage Stats Card */}
          <div className="pv-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{t.settings.usage.title}</h3>
              <button 
                className={`pv-btn pv-btn-ghost pv-btn-sm p-1 h-auto ${fetchingUsage ? 'loading' : ''}`} 
                onClick={fetchUsage}
                disabled={fetchingUsage}
              >
                <RefreshCw size={14} className={fetchingUsage ? 'spin' : ''} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <UsageProgressBar 
                label={t.settings.usage.loans} 
                current={usage.loans} 
                max={limits.maxLoans} 
                icon={HandCoins} 
              />
              <UsageProgressBar 
                label={t.settings.usage.branches} 
                current={usage.branches} 
                max={limits.maxBranches} 
                icon={Building2} 
              />
              <UsageProgressBar 
                label={t.settings.usage.users} 
                current={usage.users} 
                max={limits.maxUsers} 
                icon={UsersIcon} 
              />
            </div>

            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, lineHeight: 1.5 }}>
              <Info size={14} style={{ marginBottom: '4px', display: 'block', color: 'var(--brand-primary)' }} />
              Usage resets at the start of your billing cycle. Limits are based on your current <strong>{currentPlan.toUpperCase()}</strong> plan.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '48px' }}>
        <div className="pv-card" style={{ border: '1px solid var(--brand-primary)', background: 'rgba(var(--brand-primary-rgb), 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--brand-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Subscription Policies</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Important terms regarding plan changes</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Immediate Effect</div>
              <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                All plan changes (upgrades and downgrades) take effect <strong>instantly</strong> upon payment confirmation.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Billing Cycle</div>
              <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                A <strong>new billing cycle</strong> starts on the day of change. Your next payment will be due 30 or 365 days from today.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Refund Policy</div>
              <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Subscription payments are <strong>non-refundable</strong>. We do not offer credits for unused time on a previous plan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
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
          <span>Secure checkout powered by <strong>Razorpay Stub</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--status-overdue)', fontWeight: 800, background: 'var(--status-overdue-bg)', padding: '6px 14px', borderRadius: '10px' }}>
          <AlertCircle size={14} />
          Note: System development simulation. No real money will be charged.
        </div>
      </div>
    </div>
    </>
  );
}
