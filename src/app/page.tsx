'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  Scale,
  AlertTriangle,
  TrendingUp,
  Plus,
  Eye,
  ArrowRight,
  CircleDollarSign,
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
import { loanStore, customerStore, settingsStore } from '@/lib/store';
import { formatCurrency, formatWeight, formatDate, getDaysOverdue, GOLD_PURITY_MAP, SILVER_PURITY_MAP } from '@/lib/constants';
import { Loan, GoldPurity, SilverPurity } from '@/lib/types';

const PIE_COLORS = [
  '#D4A843', // 22K Gold
  '#E8C973', // 24K Gold
  '#B8922F', // 18K Gold
  '#B0B8C1', // Sterling Silver
  '#D4DAE0', // Fine Silver
  '#8A939E', // Coin Silver
  '#1A3C34', // Dark Teal
  '#6F767E', // Gray
];

export default function DashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoans(loanStore.getAll());
  }, []);

  if (!mounted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading...
      </div>
    );
  }

  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const customers = customerStore.getAll();
  const settings = settingsStore.get();

  const totalActiveLoanValue = activeLoans.reduce((sum, l) => sum + l.loanAmount, 0);
  const totalGoldWeight = activeLoans.reduce((sum, l) => {
    return sum + l.items.filter((i) => i.metalType === 'gold').reduce((s, i) => s + i.netWeight, 0);
  }, 0);
  const totalSilverWeight = activeLoans.reduce((sum, l) => {
    return sum + l.items.filter((i) => i.metalType === 'silver').reduce((s, i) => s + i.netWeight, 0);
  }, 0);
  const monthlyInterest = activeLoans.reduce((sum, l) => {
    return sum + l.loanAmount * (l.interestRate / 100);
  }, 0);

  // Chart data
  const recentLoans = [...loans]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const monthlyData = getMonthlyData(loans);
  
  // Granular metal data by purity
  const metalDistributionMap: Record<string, number> = {};
  activeLoans.forEach(loan => {
    loan.items.forEach(item => {
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
          <p className="subtitle">
            Welcome back! Here&apos;s your shop overview for today.
          </p>
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
          value={activeLoans.length.toString()}
          subtitle={formatCurrency(totalActiveLoanValue) + ' total'}
          icon={HandCoins}
          accent="gold"
          change={`${loans.filter((l) => {
            const d = new Date(l.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length} this month`}
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
                      {metalData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
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

      {/* Recent Loans & Overdue */}
      <div className="content-grid">
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
                          {loan.customerName.charAt(0)}
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
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
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
                <div key={loan.id} className="overdue-item">
                  <div className="overdue-dot" />
                  <div className="overdue-info">
                    <div className="loan-id">{loan.loanNumber}</div>
                    <div className="customer-name">{loan.customerName}</div>
                  </div>
                  <div className="overdue-days">
                    {getDaysOverdue(loan.dueDate)} days overdue
                  </div>
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

  loans.forEach((loan) => {
    const d = new Date(loan.createdAt);
    const key = d.toLocaleDateString('en-IN', { month: 'short' });
    if (key in months) {
      months[key]++;
    }
  });

  return Object.entries(months).map(([month, count]) => ({ month, count }));
}
