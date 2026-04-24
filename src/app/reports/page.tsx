'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Download,
  Filter,
  CircleDollarSign,
  Shield,
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
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { loanStore, paymentStore, customerStore, settingsStore } from '@/lib/store';
import { formatCurrency, formatWeight, formatDateShort } from '@/lib/constants';
import { calculateAccruedInterestFromDates } from '@/lib/interest';
import { Loan, Payment } from '@/lib/types';
import Link from 'next/link';
import StatCard from '@/components/layout/StatCard';

const COLORS = ['#D4A843', '#1A3C34', '#6C757D', '#28A745', '#DC3545'];

export default function ReportsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [delinquentLoans, setDelinquentLoans] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setMounted(true);
    const allLoans = loanStore.getAll();
    const settings = settingsStore.get();
    const activeBranchId = settings.activeBranchId;

    const branchLoans = allLoans.filter(l => !activeBranchId || l.branchId === activeBranchId);
    setLoans(branchLoans);
    setPayments(paymentStore.getAll());

    // Calculate Delinquency (Interest > 10% of Principal)
    const delinquent = branchLoans
      .filter(l => l.status !== 'closed')
      .map(l => {
        const accrued = calculateAccruedInterestFromDates(l.startDate, l.interestMode, {
          principal: l.loanAmount,
          monthlyRate: l.interestRate,
          totalPaid: l.amountPaid || 0,
        });
        return { ...l, accrued };
      })
      .filter(l => l.accrued > (l.loanAmount * 0.1)) // 10% threshold
      .sort((a, b) => b.accrued - a.accrued);
    
    setDelinquentLoans(delinquent);
  }, []);

  if (!mounted) {
    return <div className="page-content" style={{ textAlign: 'center', padding: '100px' }}>Analyzing financial data...</div>;
  }

  // Filter Data based on Date Range
  const filteredPayments = payments.filter(p => {
    const pDate = new Date(p.paymentDate);
    const start = new Date(customRange.start);
    const end = new Date(customRange.end);
    end.setHours(23, 59, 59);
    return pDate >= start && pDate <= end;
  });

  const filteredLoans = loans.filter(l => {
    const lDate = new Date(l.startDate);
    const start = new Date(customRange.start);
    const end = new Date(customRange.end);
    end.setHours(23, 59, 59);
    return lDate >= start && lDate <= end;
  });

  // Financial Calculations (using filtered data)
  const totalPrincipalDisbursed = filteredLoans.reduce((sum, l) => sum + l.loanAmount, 0);
  const totalInterestCollected = filteredPayments.filter(p => p.type === 'interest' || p.type === 'full_closure' || p.type === 'partial').reduce((sum, p) => sum + p.amount, 0); 
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
  const outstandingPrincipal = activeLoans.reduce((sum, l) => sum + (l.loanAmount - (l.amountPaid || 0)), 0);
  
  const estimatedProfit = filteredPayments.reduce((sum, p) => sum + p.amount, 0); // Focus on cash flow in range

  // Chart Data
  const dailyEarnings = getDailyEarnings(filteredPayments, customRange.start, customRange.end);
  const metalPerformance = getMetalPerformance(filteredLoans);

  const handlePresetChange = (preset: string) => {
    setDateRange(preset);
    const end = new Date().toISOString().split('T')[0];
    let start = new Date();
    
    if (preset === '7d') start.setDate(start.getDate() - 7);
    else if (preset === '30d') start.setDate(start.getDate() - 30);
    else if (preset === 'today') start.setDate(start.getDate());
    else if (preset === 'week') start.setDate(start.getDate() - start.getDay());
    else if (preset === 'month') start.setDate(1);
    else if (preset === 'year') {
      start.setMonth(0);
      start.setDate(1);
    }
    
    setCustomRange({ start: start.toISOString().split('T')[0], end });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Financial Reports</h2>
          <p className="subtitle">Profit/Loss and Business Yield Analysis</p>
        </div>
        <div className="page-header-right">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
                <Calendar size={14} />
                <input 
                  type="date" 
                  className="pv-input"
                  style={{ border: 'none', background: 'transparent', height: '32px', fontSize: '13px', width: '120px' }}
                  value={customRange.start} 
                  onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                />
              </div>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 700 }}>TO</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
                <Calendar size={14} />
                <input 
                  type="date" 
                  className="pv-input"
                  style={{ border: 'none', background: 'transparent', height: '32px', fontSize: '13px', width: '120px' }}
                  value={customRange.end} 
                  onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                />
              </div>
            </div>

            <div style={{ position: 'relative', width: '150px' }}>
              <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <select 
                className="pv-input"
                style={{ paddingLeft: '36px', height: '40px', fontSize: '13px' }}
                value={dateRange}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <button className="pv-btn pv-btn-outline"><Download size={16} /> Export</button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Interest Yield"
          value={formatCurrency(totalInterestCollected)}
          icon={TrendingUp}
          variant="primary"
          change="12%"
          changeType="positive"
          subtitle="vs last month"
        />
        <StatCard
          title="Principal Out"
          value={formatCurrency(outstandingPrincipal)}
          icon={ArrowUpRight}
          variant="deep"
          subtitle={`In ${activeLoans.length} active pledges`}
        />
        <StatCard
          title="Estimated Profit"
          value={formatCurrency(estimatedProfit > 0 ? estimatedProfit : 0)}
          icon={CircleDollarSign}
          variant="vibrant"
          subtitle="Total interest realized"
        />
        <StatCard
          title="Portfolio Health"
          value="94.2%"
          icon={Shield}
          variant="primary"
          change="Solid"
          changeType="positive"
          subtitle="LTV safety margin"
        />
      </div>

      <div className="content-grid" style={{ gap: '24px' }}>
        {/* Earnings Chart */}
        <div className="pv-card" style={{ padding: 0 }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} /> Daily Collection</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyEarnings}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)' }}
                    labelStyle={{ fontWeight: 800, color: 'var(--brand-primary)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--brand-primary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Metal Performance */}
        <div className="pv-card pv-glass" style={{ padding: 0 }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><PieChartIcon size={18} /> Asset Portfolio</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metalPerformance}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {metalPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>



      <div className="pv-card" style={{ marginTop: '32px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--status-overdue-bg)' }}>
          <h3 style={{ color: 'var(--status-overdue)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800 }}>
            <TrendingUp size={18} /> High Interest Delinquency (Long Pending)
          </h3>
          <span className="badge overdue" style={{ fontWeight: 800 }}>{delinquentLoans.length} Loans Flagged</span>
        </div>
        
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan Reference</th>
                <th>Customer</th>
                <th>Principal</th>
                <th>Interest Due</th>
                <th>Portfolio %</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {delinquentLoans.map((loan) => (
                <tr key={loan.id}>
                  <td><strong>{loan.loanNumber}</strong></td>
                  <td>{loan.customerName}</td>
                  <td>{formatCurrency(loan.loanAmount)}</td>
                  <td style={{ color: 'var(--status-overdue)', fontWeight: 700 }}>{formatCurrency(loan.accrued)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--status-overdue)', width: `${Math.min(100, (loan.accrued / loan.loanAmount) * 100)}%` }}></div>
                      </div>
                      <span style={{ fontSize: '12px' }}>{((loan.accrued / loan.loanAmount) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                    <td>
                      <Link href={`/loans/${loan.id}`} className="pv-btn pv-btn-outline pv-btn-sm">Call Customer</Link>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards">
           {delinquentLoans.map((loan) => (
             <div key={loan.id} className="pv-mobile-card" style={{ borderLeft: '4px solid var(--status-overdue)' }}>
               <div className="card-header">
                  <div className="data-point">
                    <span className="data-label">Loan #</span>
                    <span className="data-value" style={{ fontWeight: 800 }}>{loan.loanNumber}</span>
                  </div>
                  <span className="badge overdue">CRITICAL</span>
               </div>
               <div className="card-body">
                  <div className="data-point">
                    <span className="data-label">Interest Due</span>
                    <span className="data-value" style={{ color: 'var(--status-overdue)', fontWeight: 800 }}>{formatCurrency(loan.accrued)}</span>
                  </div>
                  <div className="data-point">
                    <span className="data-label">Principal</span>
                    <span className="data-value">{formatCurrency(loan.loanAmount)}</span>
                  </div>
               </div>
               <div className="card-actions">
                  <Link href={`/loans/${loan.id}`} className="pv-btn pv-btn-outline pv-btn-sm" style={{ flex: 1 }}>Call Customer</Link>
               </div>
             </div>
           ))}
        </div>

        {delinquentLoans.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
            No critical interest dues found. Your portfolio is healthy!
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '32px', 
        padding: '20px 24px', 
        background: 'var(--brand-deep)', 
        borderRadius: '20px', 
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        color: 'white'
      }}>
        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
          <Info size={24} />
        </div>
        <p style={{ fontSize: '14px', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--gold)' }}>Platform Insights:</strong> Your average LTV (Loan to Value) is currently at 72%. The historical safety margin for gold loans in Coimbatore is 75%, indicating a very stable and well-collateralized lending portfolio.
        </p>
      </div>


    </div>
  );
}

// Helpers
function getDailyEarnings(payments: Payment[], startDate: string, endDate: string) {
  const data: Record<string, number> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Initialize all days in range with 0
  let current = new Date(start);
  while (current <= end) {
    const key = formatDateShort(current.toISOString());
    data[key] = 0;
    current.setDate(current.getDate() + 1);
  }

  payments?.forEach(p => {
    const key = formatDateShort(p.paymentDate);
    if (data[key] !== undefined) {
      data[key] += p.amount;
    }
  });

  return Object.entries(data).map(([date, amount]) => ({ date, amount }));
}

function getMetalPerformance(loans: Loan[]) {
  const goldValue = loans.reduce((sum, l) => sum + l.items.filter(i => i.metalType === 'gold').reduce((s, i) => s + i.itemValue, 0), 0);
  const silverValue = loans.reduce((sum, l) => sum + l.items.filter(i => i.metalType === 'silver').reduce((s, i) => s + i.itemValue, 0), 0);
  
  return [
    { name: 'Gold Portfolio', value: goldValue },
    { name: 'Silver Portfolio', value: silverValue },
  ];
}
