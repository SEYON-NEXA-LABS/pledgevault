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
      const { data: statsData } = await supabase.rpc('get_superadmin_stats');
      setStats(statsData);

      // 2. Fetch Recent Firms (Egress-optimized)
      const { data: firmsData } = await supabase
        .from('firms')
        .select(`
          id, 
          name, 
          slug, 
          plan, 
          created_at,
          profiles(count)
        `)
        .order('created_at', { ascending: false });
      
      setFirms(firmsData || []);
      
      // 3. Fetch Activity Feed
      const activityData = await supabaseService.getGlobalActivityFeed(5);
      setActivity(activityData || []);

      setLoading(false);
    }

    fetchData();
  }, []);


  const auth = authStore.get();
  if (auth.role !== 'superadmin') {
    return (
      <div className="loading-state" style={{ color: 'var(--status-overdue)', background: 'var(--status-overdue-bg)' }}>
        <AlertCircle size={48} style={{ marginBottom: '16px' }} />
        <h2>Access Denied</h2>
        <p>This workstation is restricted to Platform Administrators only.</p>
        <Link href="/" className="btn btn-gold" style={{ marginTop: '20px' }}>Return to Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-state">Initializing Admin Suite...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-info">
          <div className="admin-badge"><ShieldCheck size={14} /> Superadmin</div>
          <h1>System Overview</h1>
        </div>
        <div className="header-actions">
          <Link href="/superadmin/integrity" className="btn btn-ghost" style={{ marginRight: '12px' }}>
            <Activity size={18} /> Integrity Check
          </Link>
          <Link href="/superadmin/subscriptions" className="btn btn-outline" style={{ marginRight: '12px' }}>
            <Zap size={18} /> Manage Subscriptions
          </Link>
          <Link href="/superadmin/onboarding" className="btn btn-gold">
            <Plus size={18} /> Onboard New Firm
          </Link>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card gold">
          <div className="stat-icon"><Building2 /></div>
          <div className="stat-body">
            <span className="stat-label">Total Firms</span>
            <div className="stat-value">{stats?.total_firms || 0}</div>
            <div className="stat-trend positive"><ArrowUpRight size={14} /> System-wide</div>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon"><HandCoins /></div>
          <div className="stat-body">
            <span className="stat-label">Platform Loan Value</span>
            <div className="stat-value">{formatCurrency(stats?.total_loan_value || 0)}</div>
            <div className="stat-trend positive"><TrendingUp size={14} /> Total Portfolio</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><Users /></div>
          <div className="stat-body">
            <span className="stat-label">Total Active Users</span>
            <div className="stat-value">{stats?.active_users || 0}</div>
            <div className="stat-trend positive">Across all channels</div>
          </div>
        </div>
        <div className="stat-card dark">
          <div className="stat-icon"><Zap /></div>
          <div className="stat-body">
            <span className="stat-label">System Health</span>
            <div className="stat-value">99.9%</div>
            <div className="stat-trend">All systems operational</div>
          </div>
        </div>
      </div>

      <div className="content-layout">
        <div className="main-section">
          <div className="section-card">
            <div className="card-header">
              <h3>Registered Firms</h3>
              <div className="search-box">
                <Search size={16} />
                <input placeholder="Search platform..." />
              </div>
            </div>
            
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Plan</th>
                    <th>Total Users</th>
                    <th>Onboarded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {firms.map(firm => (
                    <tr key={firm.id}>
                      <td>
                        <div className="firm-cell">
                          <div className="firm-initials">{firm.name[0]}</div>
                          <div>
                            <div className="firm-name">{firm.name}</div>
                            <div className="firm-id">ID: {firm.id.slice(0,8).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-badge ${firm.plan || 'free'}`}>{(firm.plan || 'free').toUpperCase()}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{firm.profiles?.[0]?.count || 1} Users</td>
                      <td className="date-cell">{formatDate(firm.created_at)}</td>
                      <td>
                        <button className="action-btn"><MoreVertical size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="card-footer">
              <button className="view-all">View All {stats?.total_firms || 0} Firms <ChevronRight size={18} /></button>
            </div>
          </div>
        </div>

        <div className="side-section">
          <div className="section-card">
            <div className="card-header">
              <h3>Platform Insights</h3>
            </div>
            <div className="insight-list">
              <div className="insight-item">
                <div className="insight-label">Gold Custody</div>
                <div className="insight-value">{formatWeight(stats?.total_gold_weight || 0)}</div>
                <div className="insight-progress"><div className="progress-bar gold" style={{ width: '100%' }}></div></div>
              </div>
              <div className="insight-item">
                <div className="insight-label">Silver Custody</div>
                <div className="insight-value">{formatWeight(stats?.total_silver_weight || 0)}</div>
                <div className="insight-progress"><div className="progress-bar silver" style={{ width: '100%' }}></div></div>
              </div>
            </div>
          </div>

          <div className="section-card activity-card">
            <div className="card-header">
              <h3>System Activity</h3>
              <Activity size={18} color="var(--gold)" />
            </div>
            <div className="activity-list">
              {activity.length > 0 ? activity.map((act, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-text">
                    <strong style={{ color: 'var(--gold-dark)' }}>{act.firm_name || 'System'}</strong>: {act.message}
                  </div>
                  <div className="activity-time">{formatDate(act.time)}</div>
                </div>
              )) : (
                <div className="empty-state" style={{ padding: '0', textAlign: 'left' }}>
                  <p style={{ fontSize: '12px' }}>No recent activity recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-page {
          padding: 40px;
          background: #f8f8f5;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        .tab-switcher {
          display: flex;
          gap: 24px;
        }

        .tab-switcher button {
          background: transparent;
          border: none;
          padding: 8px 0;
          font-size: 16px;
          font-weight: 700;
          color: #9A9FA5;
          cursor: pointer;
          position: relative;
        }

        .tab-switcher button.active {
          color: #1A3C34;
        }

        .tab-switcher button.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--gold);
        }

        .method-tag {
          font-size: 11px;
          background: #F4F4F2;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
          color: #1A3C34;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-card {
          background: #fff;
          width: 500px;
          padding: 32px;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #1A3C34;
        }

        .modal-header button {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-input {
          width: 100%;
          background: #F4F4F2;
          border: 1px solid #E8E8E3;
          padding: 12px;
          border-radius: 10px;
          margin-top: 8px;
          outline: none;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 700;
          color: #9A9FA5;
          text-transform: uppercase;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #1A3C34;
          color: var(--gold);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .admin-header h1 {
          font-size: 32px;
          color: #1A3C34;
          letter-spacing: -1px;
          margin: 0;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          gap: 20px;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid #E8E8E3;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .stat-card.gold .stat-icon { background: #1A3C34; color: var(--gold); }
        .stat-card.teal .stat-icon { background: #34E0A1; }
        .stat-card.green .stat-icon { background: #1A3C34; }
        .stat-card.dark .stat-icon { background: #111; }

        .stat-label {
          display: block;
          font-size: 13px;
          color: #6F767E;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #1A3C34;
          letter-spacing: -0.5px;
        }

        .stat-trend {
          font-size: 11px;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: #6F767E;
        }

        .stat-trend.positive { color: #34E0A1; font-weight: 600; }

        /* Content Layout */
        .content-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
        }

        .section-card {
          background: #fff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 30px rgba(0,0,0,0.02);
          border: 1px solid #E8E8E3;
          margin-bottom: 32px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          color: #1A3C34;
        }

        /* Table Styles */
        .table-container {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 12px;
          color: #9A9FA5;
          font-weight: 600;
          text-transform: uppercase;
          border-bottom: 1px solid #F4F4F2;
        }

        .admin-table td {
          padding: 16px;
          border-bottom: 1px solid #F4F4F2;
          font-size: 14px;
        }

        .firm-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .firm-initials {
          width: 36px;
          height: 36px;
          background: #F4F4F2;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1A3C34;
          font-weight: 700;
          font-size: 14px;
        }

        .firm-name {
          font-weight: 700;
          color: #1A3C34;
          margin-bottom: 2px;
        }

        .firm-id {
          font-size: 11px;
          color: #9A9FA5;
        }

        .plan-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
        }

        .plan-badge.free { background: #F4F4F2; color: #6F767E; }
        .plan-badge.starter { background: rgba(52, 224, 161, 0.1); color: #1A3C34; }
        .plan-badge.pro { background: rgba(212, 168, 67, 0.1); color: var(--gold-dark); }
        .plan-badge.elite { background: #1A3C34; color: #fff; }
        .plan-badge.enterprise { background: #1A3C34; color: #fff; } /* Fallback for legacy */

        .date-cell {
          color: #6F767E;
          font-size: 13px;
        }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #34E0A1;
          border-radius: 50%;
          margin-right: 6px;
        }

        /* Insights & Activity */
        .side-section {
          display: flex;
          flex-direction: column;
        }

        .insight-item {
          margin-bottom: 24px;
        }

        .insight-label {
          font-size: 12px;
          color: #6F767E;
          margin-bottom: 8px;
        }

        .insight-value {
          font-size: 20px;
          font-weight: 800;
          color: #1A3C34;
          margin-bottom: 12px;
        }

        .insight-progress {
          height: 6px;
          background: #F4F4F2;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
        }

        .progress-bar.gold { background: var(--gold); }
        .progress-bar.silver { background: #8E9AAF; }

        .activity-item {
          position: relative;
          padding-left: 24px;
          padding-bottom: 24px;
          border-left: 1px solid #E8E8E3;
        }

        .activity-item:last-child {
          padding-bottom: 0;
          border-left-color: transparent;
        }

        .activity-dot {
          position: absolute;
          left: -4.5px;
          top: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gold);
          border: 2px solid #fff;
        }

        .activity-text {
          font-size: 13px;
          color: #1A3C34;
          line-height: 1.5;
          margin-bottom: 4px;
        }

        .activity-time {
          font-size: 11px;
          color: #9A9FA5;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F4F4F2;
          border: 1px solid #E8E8E3;
          border-radius: 10px;
          padding: 4px 12px;
        }

        .search-box input {
          border: none;
          background: transparent;
          font-size: 13px;
          outline: none;
          padding: 6px 0;
        }

        .card-footer {
          margin-top: 24px;
          text-align: center;
          border-top: 1px solid #F4F4F2;
          padding-top: 24px;
        }

        .view-all {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #1A3C34;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }

        .loading-state {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f8f5;
          color: #1A3C34;
          font-weight: 700;
        }

        .action-btn {
          background: transparent;
          border: none;
          color: #9A9FA5;
          cursor: pointer;
        }

        .tab-switcher {
          display: flex;
          gap: 24px;
        }

        .tab-switcher button {
          background: transparent;
          border: none;
          padding: 8px 0;
          font-size: 16px;
          font-weight: 700;
          color: #9A9FA5;
          cursor: pointer;
          position: relative;
        }

        .tab-switcher button.active {
          color: #1A3C34;
        }

        .tab-switcher button.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--gold);
        }

        .method-tag {
          font-size: 11px;
          background: #F4F4F2;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
          color: #1A3C34;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-card {
          background: #fff;
          width: 500px;
          padding: 32px;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #1A3C34;
        }

        .modal-header button {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-input {
          width: 100%;
          background: #F4F4F2;
          border: 1px solid #E8E8E3;
          padding: 12px;
          border-radius: 10px;
          margin-top: 8px;
          outline: none;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 700;
          color: #9A9FA5;
          text-transform: uppercase;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
}
