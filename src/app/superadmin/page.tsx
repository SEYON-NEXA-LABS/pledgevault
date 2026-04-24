'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Layers, 
  ArrowUpRight, 
  HandCoins, 
  TrendingUp, 
  Plus, 
  Search, 
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatWeight, formatDate, SUBSCRIPTION_PLANS } from '@/lib/constants';
import { PlanTier, SubscriptionInterval } from '@/lib/types';
import { authStore } from '@/lib/authStore';

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [firms, setFirms] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Global Stats
      const statsData = await supabaseService.getGlobalSystemStats();
      setStats(statsData);

      // 2. Fetch Recent Firms (Egress-optimized)
      const firmsData = await supabaseService.getFirmsDetailed();
      setFirms(firmsData || []);
      
      // 3. Fetch Activity Feed
      const activityData = await supabaseService.getGlobalActivityFeed(5);
      setActivity(activityData || []);

      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <div className="page-header-left">
          <div className="pv-badge" style={{ background: 'var(--brand-deep)', color: 'var(--brand-vibrant)', fontWeight: 800, marginBottom: '12px' }}>
            <ShieldCheck size={14} /> Superadmin Suite
          </div>
          <h1 style={{ fontSize: '32px' }}>System Overview</h1>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: '12px' }}>
          <Link href="/superadmin/integrity" className="pv-btn pv-btn-outline">
            <Activity size={18} /> Integrity
          </Link>
          <Link href="/superadmin/subscriptions" className="pv-btn pv-btn-outline">
            <Zap size={18} /> Billing
          </Link>
          <Link href="/superadmin/onboarding" className="pv-btn pv-btn-gold">
            <Plus size={18} /> Onboard Firm
          </Link>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="pv-card pv-glass" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--brand-deep)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Firms</span>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>{stats?.total_firms || 0}</div>
          </div>
        </div>
        <div className="pv-card pv-glass" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--brand-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <HandCoins size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Loan Value</span>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>{formatCurrency(stats?.total_loan_value || 0)}</div>
          </div>
        </div>
        <div className="pv-card pv-glass" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--brand-deep)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Active Users</span>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>{stats?.active_users || 0}</div>
          </div>
        </div>
        <div className="pv-card pv-glass" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--status-active-bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-active)' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>System Health</span>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>99.9%</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        <div className="pv-card" style={{ padding: 0 }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Registered Firms</h3>
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input className="pv-input" style={{ paddingLeft: '36px', height: '36px' }} placeholder="Search platform..." />
            </div>
          </div>
            
            <div style={{ padding: '0' }}>
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Plan</th>
                    <th>Users</th>
                    <th>Onboarded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {firms.map(firm => (
                    <tr key={firm.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', background: 'var(--bg-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{firm.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{firm.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{firm.id.slice(0,8).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${firm.plan || 'free'}`}>{(firm.plan || 'free').toUpperCase()}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{firm.profiles?.[0]?.count || 1}</td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{formatDate(firm.created_at)}</td>
                      <td>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}><MoreVertical size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
              <button className="pv-btn pv-btn-outline" style={{ width: '100%' }}>View All {stats?.total_firms || 0} Firms <ChevronRight size={18} /></button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="pv-card">
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Platform Insights</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700 }}>Gold Custody</span>
                  <span style={{ fontWeight: 800 }}>{formatWeight(stats?.total_gold_weight || 0)}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--gold)', width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700 }}>Silver Custody</span>
                  <span style={{ fontWeight: 800 }}>{formatWeight(stats?.total_silver_weight || 0)}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#8E9AAF', width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pv-card pv-glass">
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>System Activity</h3>
              <Activity size={18} color="var(--gold)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activity.length > 0 ? activity.map((act, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '16px', position: 'relative' }}>
                  <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--brand-primary)' }}>{act.firm_name || 'System'}</strong>: {act.message}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{formatDate(act.time)}</div>
                </div>
              )) : (
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No recent activity recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
