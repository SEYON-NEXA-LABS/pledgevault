'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  HandCoins,
  Scale,
  AlertTriangle,
  TrendingUp,
  Plus,
  Eye,
  ArrowRight,
  CircleDollarSign,
  MessageSquare,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '@/components/layout/StatCard';
import DailyCalendarCard from '@/components/dashboard/DailyCalendarCard';
import { loanStore, customerStore, settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatWeight, formatDate, getDaysOverdue, GOLD_PURITY_MAP, SILVER_PURITY_MAP } from '@/lib/constants';
import { Loan, GoldPurity, SilverPurity } from '@/lib/types';

// Color by metal name — gold types get gold shades, silver types get silver shades
const METAL_COLORS: Record<string, string> = {
  '24K Gold': '#E8C973',
  '22K Gold': '#D4A843',
  '18K Gold': '#B8922F',
  '14K Gold': '#9A7A25',
  'Sterling': '#B0B8C1',
  'Fine': '#D4DAE0',
  'Coin': '#8A939E',
  'Silver': '#B0B8C1',
  'Gold': '#D4A843',
};
const FALLBACK_COLORS = ['#1A3C34', '#6F767E', '#4A6670', '#3D5A50'];

function getMetalColor(name: string, index: number): string {
  // Try exact match first, then partial
  if (METAL_COLORS[name]) return METAL_COLORS[name];
  for (const [key, color] of Object.entries(METAL_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export default function DashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cloudStats, setCloudStats] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const auth = authStore.get();
  const settings = settingsStore.get();
  const activeBranchId = settings.activeBranchId;

  // Set default view mode based on role
  useEffect(() => {
    if (authStore.isSuperadmin()) return redirect('/superadmin');
  }, [auth.role]);

  useEffect(() => {
    setMounted(true);

    // Fetch loans for the current firm/branch
    const fetchDashboardData = async () => {
      try {
        if (auth.firmId) {
          const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
          const isFirmContext = activeBranchId === 'firm';
          
          const { data } = await supabaseService.getLoans(
            auth.firmId,
            !isFirmContext && isValidUuid(activeBranchId) ? activeBranchId : undefined,
            0,
            100 // Get enough for dashboard highlights
          );
          setLoans(data as Loan[]);

          // Get RPC stats
          const stats = await supabaseService.getDashboardStats();
          setCloudStats(stats);

          const sub = await supabaseService.getActiveSubscription(auth.firmId!);
          if (sub) {
            const isExpired = new Date(sub.endDate) < new Date();
          }

          const { data: custData } = await supabaseService.getCustomers(auth.firmId, 0, 1000);
          setCustomers(custData || []);
        } else {
          // Local Fallback
          setLoans(loanStore.getAll());
          setCustomers(customerStore.getAll());
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, [activeBranchId, auth.firmId]);

  if (!mounted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading...
      </div>
    );
  }

  const isBranchView = activeBranchId !== 'firm';
  const branchLoans = loans.filter(l => !isBranchView || !activeBranchId || l.branchId === activeBranchId);
  const activeLoans = branchLoans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = branchLoans.filter((l) => l.status === 'overdue');

  const currentBranch = settings.branches.find(b => b.id === activeBranchId);

  // Stats calculation
  const totalActiveLoanCount = isBranchView ? activeLoans.length : (cloudStats?.total_active_loans ?? activeLoans.length);
  const totalActiveLoanValue = isBranchView
    ? activeLoans.reduce((sum, l) => sum + l.loanAmount, 0)
    : (cloudStats?.total_active_loan_value ?? activeLoans.reduce((sum, l) => sum + l.loanAmount, 0));

  const totalGoldWeight = isBranchView
    ? activeLoans.reduce((sum, l) => sum + l.items.filter((i) => i.metalType === 'gold').reduce((s, i) => s + i.netWeight, 0), 0)
    : (cloudStats?.total_gold_weight ?? 0);

  const totalSilverWeight = isBranchView
    ? activeLoans.reduce((sum, l) => sum + l.items.filter((i) => i.metalType === 'silver').reduce((s, i) => s + i.netWeight, 0), 0)
    : (cloudStats?.total_silver_weight ?? 0);

  const monthlyInterest = activeLoans.reduce((sum, l) => sum + l.loanAmount * (l.interestRate / 100), 0);

  // Chart data
  const recentLoans = [...loans]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const monthlyData = getMonthlyData(loans);

  // Granular metal data by purity
  const metalDistributionMap: Record<string, number> = {};
  activeLoans?.forEach(loan => {
    loan.items?.forEach(item => {
      let label = '';
      if (item.metalType === 'gold') {
        label = GOLD_PURITY_MAP[item.purity as GoldPurity]?.karat + ' Gold' || 'Gold';
      } else {
        label = SILVER_PURITY_MAP[item.purity as SilverPurity]?.label.split(' / ')[0] || 'Silver';
      }

      metalDistributionMap[label] = (metalDistributionMap[label] || 0) + item.netWeight;
    });
  });

  const metalData = Object.entries(metalDistributionMap)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Dashboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p className="subtitle">
              {!isBranchView ? 'Viewing global firm performance.' : (currentBranch ? `Managing ${currentBranch.name}` : 'Here\'s your shop overview.')}
            </p>
          </div>
        </div>
        <div className="page-header-right">
          <Link href="/loans/new" className="btn btn-gold" id="new-loan-btn">
            <Plus size={18} />
            New Loan
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Active Loans"
          value={totalActiveLoanCount.toString()}
          subtitle={formatCurrency(totalActiveLoanValue) + (!isBranchView ? ' (All Branches)' : ' (Branch)')}
          icon={HandCoins}
          accent="gold"
          change={`${activeLoans.length} total`}
          changeType="positive"
        />
        <StatCard
          title="Gold in Custody"
          value={formatWeight(totalGoldWeight)}
          subtitle={`@ ${formatCurrency(settings.goldRate24K)}/g (24K)`}
          icon={Scale}
          accent="teal"
          change={formatWeight(totalSilverWeight) + ' silver'}
          changeType="positive"
        />
        <StatCard
          title="Overdue Loans"
          value={overdueLoans.length.toString()}
          subtitle="Require immediate attention"
          icon={AlertTriangle}
          accent="red"
          change={overdueLoans.length > 0 ? 'Action needed' : 'All clear'}
          changeType={overdueLoans.length > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Monthly Interest"
          value={formatCurrency(monthlyInterest)}
          subtitle={`From ${activeLoans.length} active loans`}
          icon={TrendingUp}
          accent="green"
          change={`${customers.length} customers`}
          changeType="positive"
        />
      </div>

      {/* Charts Row */}
      <div className="content-grid">
        <div className="card" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h3>Loan Volume</h3>
            <div className="card-header-actions">
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Last 6 months</span>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Bar dataKey="count" fill="#D4A843" radius={[6, 6, 0, 0]} name="Loans" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card" style={{ animationDelay: '0.25s' }}>
          <div className="card-header">
            <h3>Metal Distribution</h3>
            <div className="card-header-actions">
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>By weight</span>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {metalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}g`}
                    >
                      {metalData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getMetalColor(entry.name, index)}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p>No metal data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loans, Overdue & Daily Calendar */}
      <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h3>Recent Loans</h3>
            <Link href="/loans" className="btn btn-ghost btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body no-padding">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>
                        {loan.loanNumber}
                      </span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {(loan.customerName ?? loan.customerName ?? '?').charAt(0)}
                        </div>
                        <div className="customer-info">
                          <div className="name">{loan.customerName}</div>
                          <div className="phone">{loan.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatCurrency(loan.loanAmount)}
                    </td>
                    <td>
                      <span className={`badge ${loan.status}`}>
                        {(loan.status || 'active').charAt(0).toUpperCase() + (loan.status || 'active').slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentLoans.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      No loans yet. Create your first loan!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ animationDelay: '0.35s' }}>
          <div className="card-header">
            <h3>⚠️ Overdue Alerts</h3>
            <span className="badge overdue">{overdueLoans.length} overdue</span>
          </div>
          <div className="card-body">
            {overdueLoans.length > 0 ? (
              overdueLoans.map((loan) => (
                <div key={loan.id} className="overdue-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                  <div className="overdue-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-overdue)', flexShrink: 0 }} />
                  <div className="overdue-info" style={{ flex: 1 }}>
                    <div className="loan-id" style={{ fontWeight: 700, fontSize: '13px' }}>{loan.loanNumber}</div>
                    <div className="customer-name" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{loan.customerName}</div>
                  </div>
                  <div className="overdue-days" style={{ fontSize: '11px', color: 'var(--status-overdue)', fontWeight: 600 }}>
                    {getDaysOverdue(loan.dueDate)}d
                  </div>
                  <button
                    onClick={() => {
                      const message = `PV Reminder: Dear ${loan.customerName}, your pledge ${loan.loanNumber} is overdue by ${getDaysOverdue(loan.dueDate)} days. Balance: ${formatCurrency(loan.loanAmount + (loan.interestAccrued || 0) - (loan.amountPaid || 0))}. Please visit our shop to renew or close.`;
                      window.open(`https://wa.me/91${loan.customerPhone}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    title="Send WhatsApp Reminder"
                    className="btn btn-sm btn-outline"
                    style={{ padding: '4px 8px' }}
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <CircleDollarSign size={32} style={{ color: 'var(--status-active)', marginBottom: '8px' }} />
                <h3>All Clear!</h3>
                <p>No overdue loans at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Calendar */}
        <DailyCalendarCard />
      </div>
    </>
  );
}

// Helper: Group loans by month for chart
function getMonthlyData(loans: Loan[]) {
  const months: Record<string, number> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-IN', { month: 'short' });
    months[key] = 0;
  }

  loans?.forEach((loan) => {
    const dateStr = (loan as any).created_at || (loan as any).createdAt;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const key = d.toLocaleDateString('en-IN', { month: 'short' });
    if (key in months) {
      months[key]++;
    }
  });

  return Object.entries(months).map(([month, count]) => ({ month, count }));
}
