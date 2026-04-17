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
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-info">
          <Link href="/superadmin" className="btn-back">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Subscription Management</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-gold" onClick={() => setShowManualModal(true)}>
            <HandCoins size={18} /> Record Payment
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp /></div>
          <div className="stat-body">
            <span className="stat-label">Estimated MRR</span>
            <div className="stat-value">{formatCurrency(calculateMRR())}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users /></div>
          <div className="stat-body">
            <span className="stat-label">Active Firms</span>
            <div className="stat-value">{data.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><AlertCircle /></div>
          <div className="stat-body">
            <span className="stat-label">Expiring Soon</span>
            <div className="stat-value">3</div>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div className="search-box">
            <Search size={18} />
            <input 
              placeholder="Filter by firm name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-refresh" onClick={fetchData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="table-container">
          <table className="admin-table">
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
                      <div className="firm-name">{firm.name}</div>
                      <div className="firm-id">{firm.id.slice(0,8).toUpperCase()}</div>
                    </td>
                    <td>
                      <span className={`plan-badge ${firm.plan}`}>{firm.plan.toUpperCase()}</span>
                    </td>
                    <td>
                      {latestSub ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{formatCurrency(latestSub.amount)}</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>{latestSub.paymentMethod.toUpperCase()}</div>
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
                      <span className="status-badge" style={{ background: `${status.color}15`, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <button className="action-link" onClick={() => handleExtend(firm.id)}>Extend 7 Days</button>
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
          <div className="modal-card">
            <div className="modal-header">
              <h2>Record Manual Payment</h2>
              <button onClick={() => setShowManualModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label>Select Firm</label>
                <select name="firmId" required className="modal-input">
                  <option value="">-- Choose Business --</option>
                  {data.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="modal-grid">
                <div className="form-group">
                  <label>Plan</label>
                  <select name="planId" required className="modal-input">
                    {SUBSCRIPTION_PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Interval</label>
                  <select name="interval" required className="modal-input">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="modal-grid">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" name="amount" required placeholder="0" className="modal-input" />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select name="method" required className="modal-input">
                    <option value="cash">Cash</option>
                    <option value="netbanking">Bank Transfer</option>
                    <option value="upi">UPI (Manual)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowManualModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold">Activate Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-page {
          padding: 40px;
          background: #f8f8f5;
          min-height: 100vh;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #888;
          font-size: 13px;
          text-decoration: none;
          margin-bottom: 8px;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
        }

        .admin-header h1 {
          font-size: 32px;
          color: #1A3C34;
          letter-spacing: -1px;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: #fff;
          padding: 24px;
          border-radius: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          border: 1px solid #E8E8E3;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #1A3C34;
          color: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          font-weight: 700;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #1A3C34;
        }

        .content-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #E8E8E3;
          overflow: hidden;
        }

        .card-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #F4F4F2;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #F4F4F2;
          padding: 8px 16px;
          border-radius: 30px;
          width: 300px;
        }

        .search-box input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          width: 100%;
        }

        .btn-refresh {
          background: transparent;
          border: none;
          color: #888;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .table-container {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          text-align: left;
          padding: 16px 24px;
          font-size: 12px;
          text-transform: uppercase;
          color: #888;
          background: #FAF9F6;
          border-bottom: 1px solid #F4F4F2;
        }

        .admin-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #F4F4F2;
          font-size: 14px;
        }

        .firm-name {
          font-weight: 700;
          color: #1A3C34;
        }

        .firm-id {
          font-size: 11px;
          color: #888;
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

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .action-link {
          color: var(--gold-dark);
          background: transparent;
          border: none;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
        }

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

        .loading-state {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1A3C34;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
