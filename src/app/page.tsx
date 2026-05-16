'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  HandCoins,
  Scale,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Phone,
  MessageCircle,
  ExternalLink,
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
  AreaChart,
  Area,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '@/components/layout/StatCard';
import QuickAppraisal from '@/components/dashboard/QuickAppraisal';
import { settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { metalRateService } from '@/lib/supabase/metalRateService';
import { authStore } from '@/lib/authStore';
import { formatCurrency, formatWeight, getDaysOverdue } from '@/lib/constants';
import { Loan } from '@/lib/types';
import { translations, Language } from '@/lib/i18n/translations';

// Color palette for charts using theme-aware variables
const CHART_COLORS = [
  'oklch(0.7 0.15 80)',    // Gold
  'oklch(0.6 0.12 160)',   // Emerald
  'oklch(0.5 0.15 250)',   // Deep Blue
  'oklch(0.8 0.1 120)',    // Lime
  'oklch(0.6 0.2 30)',     // Terracotta
];

function getMetalColor(name: string, index: number): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('24k') || lowerName.includes('22k')) return 'oklch(0.7 0.15 80)';
  if (lowerName.includes('silver') || lowerName.includes('sterling')) return 'oklch(0.8 0.05 200)';
  if (lowerName.includes('gold')) return 'oklch(0.6 0.15 80)';
  return CHART_COLORS[index % CHART_COLORS.length];
}

export default function DashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [cloudStats, setCloudStats] = useState<any>(null);
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [latestRates, setLatestRates] = useState<{ gold22k: number; silver: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const [settings, setSettings] = useState(settingsStore.get());
  const auth = authStore.get();
  const t = translations[(settings.language || 'en') as Language];

  useEffect(() => {
    const handleUpdate = () => setSettings(settingsStore.get());
    window.addEventListener('pv_settings_updated', handleUpdate);
    return () => window.removeEventListener('pv_settings_updated', handleUpdate);
  }, []);

  const activeBranchId = settings.activeBranchId;
  const isAdmin = authStore.isAdmin() || authStore.isSuperadmin();

  useEffect(() => {
    if (authStore.isSuperadmin()) return redirect('/superadmin');
  }, [auth.role]);

  const lastFetchId = useRef<string>('');

  const fetchDashboardData = async () => {
    try {
      const isValidUUID = (id: string | null) => {
        if (!id) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      };

      if (isValidUUID(auth.firmId)) {
        const stats = await supabaseService.getDashboardStats(auth.firmId as string, activeBranchId);
        setCloudStats(stats);
        if (stats.recentLoans) setLoans(stats.recentLoans);

        const trends = await metalRateService.getMarketTrends();
        setMarketTrends(trends);

        const live = await metalRateService.getLiveRates();
        setLatestRates({ gold22k: live.gold22k, silver: live.silver });
      }
    } catch (err) {
      console.error('FAILED: fetchDashboardData caught error:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !auth.firmId) return;

    // Prevent duplicate fetches for the same branch/firm in the same render cycle
    const currentFetchId = `${auth.firmId}-${activeBranchId}`;
    if (lastFetchId.current === currentFetchId) return;
    lastFetchId.current = currentFetchId;

    fetchDashboardData();
  }, [mounted, activeBranchId, auth.firmId]);

  if (!mounted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading...
      </div>
    );
  }

  const isBranchView = activeBranchId !== 'firm';
  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const currentBranch = settings.branches.find(b => b.id === activeBranchId);

  const totalActiveLoanCount = cloudStats?.totalActiveLoans ?? 0;
  const totalActiveLoanValue = cloudStats?.totalActiveLoanValue ?? 0;
  const totalGoldWeight = cloudStats?.totalGoldWeight ?? 0;
  const monthlyInterest = cloudStats?.totalMonthlyInterest ?? 0;

  const recentLoans = [...loans]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const monthlyData = (cloudStats?.monthlyTrends && cloudStats.monthlyTrends.length > 0) 
    ? cloudStats.monthlyTrends 
    : getMonthlyData(loans);

  const metalData = cloudStats?.metalDistribution || [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">
            {t.dashboard.title}
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground font-bold text-sm tracking-tight opacity-70">
              {!isBranchView ? 'Global performance overview' : (currentBranch ? `Managing ${currentBranch.name}` : 'Shop overview')}
            </p>
          </div>
        </div>
        <div className="page-header-right">
          <Link href="/loans/new" className="pv-btn pv-btn-gold shadow-lg shadow-primary/10" id="new-loan-btn">
            <Plus size={18} />
            {t.common.newLoan}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div className="xl:col-span-2 flex flex-col gap-5">

            {/* TradingView Verification Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="pv-card p-0 overflow-hidden border-t-4 border-t-primary">
                <div className="p-3 border-b border-border bg-muted/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">XAU/INR Live (Gold)</span>
                  </div>
                  <Link href="https://www.tradingview.com/symbols/XAUINR/" target="_blank" className="text-[9px] font-black text-primary hover:underline flex items-center gap-1">
                    Full Chart <ExternalLink size={10} />
                  </Link>
                </div>
                <div className="h-[120px] w-full">
                  <iframe 
                    src="https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=en#%7B%22symbol%22%3A%22FX_IDC%3AXAUINR%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A120%2C%22dateRange%22%3A%221D%22%2C%22colorTheme%22%3A%22light%22%2C%22trendLineColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%201)%22%2C%22underLineColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.3)%22%2C%22underLineBottomColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200)%22%2C%22isTransparent%22%3Afalse%2C%22autosize%22%3Atrue%2C%22largeChartUrl%22%3A%22%22%7D"
                    width="100%"
                    height="120"
                    frameBorder="0"
                    style={{ border: 'none' }}
                  ></iframe>
                </div>
              </div>

              <div className="pv-card p-0 overflow-hidden border-t-4 border-t-slate-400">
                <div className="p-3 border-b border-border bg-muted/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">XAG/INR Live (Silver)</span>
                  </div>
                  <Link href="https://www.tradingview.com/symbols/XAGINR/" target="_blank" className="text-[9px] font-black text-primary hover:underline flex items-center gap-1">
                    Full Chart <ExternalLink size={10} />
                  </Link>
                </div>
                <div className="h-[120px] w-full">
                  <iframe 
                    src="https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=en#%7B%22symbol%22%3A%22FX_IDC%3AXAGINR%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A120%2C%22dateRange%22%3A%221D%22%2C%22colorTheme%22%3A%22light%22%2C%22trendLineColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%201)%22%2C%22underLineColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.3)%22%2C%22underLineBottomColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200)%22%2C%22isTransparent%22%3Afalse%2C%22autosize%22%3Atrue%2C%22largeChartUrl%22%3A%22%22%7D"
                    width="100%"
                    height="120"
                    frameBorder="0"
                    style={{ border: 'none' }}
                  ></iframe>
                </div>
              </div>
            </div>

           <div className="stats-grid m-0">
             <StatCard title={t.dashboard.activeLoans} value={totalActiveLoanCount.toString()} subtitle={formatCurrency(totalActiveLoanValue)} icon={HandCoins} variant="vibrant" />
             <StatCard title={t.dashboard.goldCustody} value={formatWeight(totalGoldWeight)} subtitle={`Value: ${formatCurrency(totalGoldWeight * settings.goldRate24K)}`} icon={Scale} variant="vibrant" />
             <StatCard title={t.dashboard.overdue} value={(cloudStats?.overdueCount ?? 0).toString()} subtitle={t.dashboard.collectionRisk} icon={AlertTriangle} variant="danger" />
             <StatCard title={t.dashboard.yield} value={formatCurrency(monthlyInterest)} subtitle={t.dashboard.viewAll} icon={TrendingUp} variant="primary" />
           </div>
        </div>

        <div className="xl:col-span-1">
          <QuickAppraisal />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Immediate Collection (Overdue Feed) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
           <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-destructive" />
              <h3 className="text-xs font-black uppercase tracking-widest">Immediate Collection</h3>
           </div>
           <div className="flex flex-col gap-3 h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {overdueLoans.length > 0 ? (
                overdueLoans.map((loan) => (
                  <div key={loan.id} className="pv-card flex flex-col gap-3 p-4 hover:border-destructive/30 transition-all bg-destructive/2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-black text-xs">{loan.loanNumber}</div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">{loan.customerName}</div>
                      </div>
                      <span className="badge overdue">-{getDaysOverdue(loan.dueDate)}d</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-lg font-black">{formatCurrency(loan.loanAmount + (loan.interestAccrued || 0) - (loan.amountPaid || 0))}</div>
                      <div className="flex gap-1">
                        <a href={`tel:${loan.customerPhone}`} className="pv-btn pv-btn-outline pv-btn-icon h-7 w-7"><Phone size={12} /></a>
                        <button
                          onClick={() => {
                            const message = `PV Reminder: Dear ${loan.customerName}, your pledge ${loan.loanNumber} is overdue by ${getDaysOverdue(loan.dueDate)} days. Please visit our shop to renew or close.`;
                            window.open(`https://wa.me/91${loan.customerPhone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="pv-btn pv-btn-outline pv-btn-icon h-7 w-7 text-green-600 border-green-600/20"
                        >
                          <MessageCircle size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-center border-2 border-dashed border-border rounded-2xl opacity-40">
                  <span className="text-[10px] font-black uppercase tracking-widest">No Overdue Loans</span>
                </div>
              )}
           </div>
        </div>

        {/* Analytical Charts */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="pv-card p-0 flex flex-col overflow-hidden h-full">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.dashboard.loanVolume}</h3>
              </div>
              <div style={{ padding: '16px', height: '320px', minWidth: 0, overflow: 'hidden', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 800 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 800 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="gold" fill="oklch(0.7 0.15 80)" radius={[4, 4, 0, 0]} name="Gold" stackId="a" />
                      <Bar dataKey="silver" fill="oklch(0.8 0.05 200)" radius={[4, 4, 0, 0]} name="Silver" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
              </div>
            </div>

            <div className="pv-card p-0 flex flex-col overflow-hidden h-full">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.dashboard.assetComposition}</h3>
              </div>
              <div style={{ padding: '16px', height: '320px', minWidth: 0, overflow: 'hidden', position: 'relative' }}>
                {metalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metalData}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        paddingAngle={4} dataKey="value"
                      >
                        {metalData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={getMetalColor(entry.name, index)} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] font-black uppercase opacity-30 italic">No Data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="pv-card p-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t.dashboard.recentPledges}</h3>
            <Link href="/loans" className="pv-btn pv-btn-ghost pv-btn-sm text-[11px] font-black">
              {t.dashboard.exploreAll} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.loans.loanId}</th>
                  <th>{t.loans.customer}</th>
                  <th>{t.loans.amount}</th>
                  <th>{t.common.status}</th>
                  <th className="text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="font-extrabold text-sm">{loan.loanNumber}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shadow-inner">
                          {(loan.customerName || '?').charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{loan.customerName}</span>
                          <span className="text-[11px] opacity-40 font-black uppercase tracking-tight">{loan.customerPhone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="font-black">{formatCurrency(loan.loanAmount)}</td>
                    <td>
                      <span className={`badge ${loan.status}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="text-right">
                       <Link href={`/loans/${loan.id}`} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                          View
                       </Link>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function getMonthlyData(loans: Loan[]) {
  const months: Record<string, { gold: number; silver: number }> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-IN', { month: 'short' });
    months[key] = { gold: 0, silver: 0 };
  }

  loans?.forEach((loan) => {
    const dateStr = (loan as any).created_at || (loan as any).createdAt;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const key = d.toLocaleDateString('en-IN', { month: 'short' });
    if (key in months) {
      const metalType = (loan as any).metalType || loan.items?.[0]?.metalType || 'gold';
      if (metalType === 'silver') {
        months[key].silver++;
      } else {
        months[key].gold++;
      }
    }
  });

  return Object.entries(months).map(([month, data]) => ({ 
    month, 
    gold: data.gold, 
    silver: data.silver 
  }));
}
