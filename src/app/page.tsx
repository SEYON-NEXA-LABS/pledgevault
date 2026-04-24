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
  RefreshCw,
  Search,
  X,
  Phone,
  MessageCircle,
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
import DailyCalendarCard from '@/components/dashboard/DailyCalendarCard';
import { settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { metalRateService } from '@/lib/supabase/metalRateService';
import { authStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatWeight, formatDate, getDaysOverdue, GOLD_PURITY_MAP, SILVER_PURITY_MAP } from '@/lib/constants';
import { Loan, GoldPurity, SilverPurity } from '@/lib/types';
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
  const [customers, setCustomers] = useState<any[]>([]);
  const [cloudStats, setCloudStats] = useState<any>(null);
  const [marketTrends, setMarketTrends] = useState<any>(null);
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
  const isManager = authStore.isManager() || authStore.isSuperadmin();

  // Set default view mode based on role
  useEffect(() => {
    if (authStore.isSuperadmin()) return redirect('/superadmin');
  }, [auth.role]);

  useEffect(() => {
    setMounted(true);

    // Fetch consolidated dashboard data
    const fetchDashboardData = async () => {
      try {
        const isValidUUID = (id: string | null) => {
          if (!id) return false;
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        };

        if (isValidUUID(auth.firmId)) {
          // Get Optimized RPC stats (Includes recent loans, counts, and metrics)
          const stats = await supabaseService.getDashboardStats(auth.firmId as string, activeBranchId);
          setCloudStats(stats);
          
          // Use stats for initial states
          if (stats.recentLoans) setLoans(stats.recentLoans);

          // Get Market Trends (Optimized via LS Caching)
          const trends = await metalRateService.getMarketTrends();
          setMarketTrends(trends);
        }
      } catch (err) {
        console.error('FAILED: fetchDashboardData caught error:', err);
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
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = loans.filter((l) => l.status === 'overdue');

  const currentBranch = settings.branches.find(b => b.id === activeBranchId);

  // Stats calculation (Using consolidated cloud metrics)
  const totalActiveLoanCount = cloudStats?.totalActiveLoans ?? 0;
  const totalActiveLoanValue = cloudStats?.totalActiveLoanValue ?? 0;
  const totalGoldWeight = cloudStats?.totalGoldWeight ?? 0;
  const totalSilverWeight = cloudStats?.totalSilverWeight ?? 0;
  const monthlyInterest = cloudStats?.totalMonthlyInterest ?? 0;

  // Chart data
  const recentLoans = [...loans]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const monthlyData = getMonthlyData(loans);

  // Metal distribution from cloud stats
  const metalData = cloudStats?.metalDistribution || [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="text-4xl font-black tracking-tight mb-2">
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

      {/* Top Action Row: Market Pulse & High Risks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div className="xl:col-span-2 flex flex-col gap-5">
           {marketTrends && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="pv-card relative overflow-hidden p-6 border-l-4 border-l-[#D4AF37]">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        {t.common.gold} 22K (916) Pulse
                      </span>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${marketTrends.goldChange >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        {marketTrends.goldChange >= 0 ? '+' : ''}{marketTrends.goldChange}%
                      </div>
                   </div>
                   <div className="text-3xl font-black mb-4">₹{Math.round((settings.goldRate24K || 0) * (22/24)).toLocaleString('en-IN')}<small className="text-xs ml-1 opacity-40 font-bold uppercase">/gram</small></div>
                   <div className="h-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marketTrends.history}>
                          <defs>
                            <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="gold" stroke="#D4AF37" strokeWidth={2} fill="url(#colorGold)" isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="pv-card relative overflow-hidden p-6 border-l-4 border-l-[#B0B8C1]">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        {t.common.silver} Pulse
                      </span>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${marketTrends.silverChange >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        {marketTrends.silverChange >= 0 ? '+' : ''}{marketTrends.silverChange}%
                      </div>
                   </div>
                   <div className="text-3xl font-black mb-4">₹{(settings.silverRate999 || 0).toLocaleString('en-IN')}<small className="text-xs ml-1 opacity-40 font-bold uppercase">/gram</small></div>
                   <div className="h-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marketTrends.history}>
                          <defs>
                            <linearGradient id="colorSilver" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#B0B8C1" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#B0B8C1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="silver" stroke="#B0B8C1" strokeWidth={2} fill="url(#colorSilver)" isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
           )}

           <div className="stats-grid m-0">
             <StatCard title={t.dashboard.activeLoans} value={totalActiveLoanCount.toString()} subtitle={formatCurrency(totalActiveLoanValue)} icon={HandCoins} variant="vibrant" />
             <StatCard title={t.dashboard.goldCustody} value={formatWeight(totalGoldWeight)} subtitle={`Value: ${formatCurrency(totalGoldWeight * settings.goldRate24K)}`} icon={Scale} variant="vibrant" />
             <StatCard title={t.dashboard.overdue} value={(cloudStats?.overdueCount ?? 0).toString()} subtitle={t.dashboard.collectionRisk} icon={AlertTriangle} variant="danger" />
             <StatCard title={t.dashboard.yield} value={formatCurrency(monthlyInterest)} subtitle={t.dashboard.viewAll} icon={TrendingUp} variant="primary" />
           </div>
        </div>

        <div className="pv-card p-0 flex flex-col overflow-hidden border-2 border-destructive/10">
          <div className="flex items-center justify-between p-6 border-b border-border bg-destructive/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-destructive">Collection Risks</h3>
            <span className="badge overdue">{overdueLoans.length}</span>
          </div>
          <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[360px]">
            {overdueLoans.length > 0 ? (
              overdueLoans.slice(0, 4).map((loan) => (
                <div key={loan.id} className="flex items-center gap-4 p-4 bg-muted/30 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-black text-sm">{loan.loanNumber}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{loan.customerName}</div>
                    <div className="text-[10px] font-black text-destructive uppercase tracking-widest mt-1">
                      Late {getDaysOverdue(loan.dueDate)}d
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={`tel:${loan.customerPhone}`}
                      className="pv-btn pv-btn-outline pv-btn-icon text-primary border-primary/20 h-9 w-9"
                      title="Call"
                    >
                      <Phone size={14} />
                    </a>
                    <a 
                      href={`sms:${loan.customerPhone}?body=${encodeURIComponent(`Reminder: Your pledge ${loan.loanNumber} is overdue. Please visit our shop.`)}`}
                      className="pv-btn pv-btn-outline pv-btn-icon text-blue-500 border-blue-500/20 h-9 w-9"
                      title="SMS"
                    >
                      <MessageSquare size={14} />
                    </a>
                    <button
                      onClick={() => {
                        const message = `PV Reminder: Dear ${loan.customerName}, your pledge ${loan.loanNumber} is overdue by ${getDaysOverdue(loan.dueDate)} days. Balance: ${formatCurrency(loan.loanAmount + (loan.interestAccrued || 0) - (loan.amountPaid || 0))}. Please visit our shop to renew or close.`;
                        window.open(`https://wa.me/91${loan.customerPhone}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="pv-btn pv-btn-outline pv-btn-icon text-green-600 border-green-600/20 h-9 w-9"
                      title="WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground opacity-30">
                <CircleDollarSign size={40} className="mb-2" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-center">Safe Vault</h3>
              </div>
            )}
            {overdueLoans.length > 4 && (
              <Link href="/loans?status=overdue" className="text-center text-[10px] font-black text-primary uppercase tracking-[0.2em] py-2 hover:underline">
                View All Risks
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="pv-card p-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t.dashboard.loanVolume}</h3>
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t.dashboard.viewAll}</span>
          </div>
          <div className="p-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fontWeight: 800, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontWeight: 800, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                   <Tooltip
                    cursor={{ fill: 'oklch(0.966 0.005 106.5)' }}
                    contentStyle={{
                      background: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.93 0.007 106.5)',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      color: 'oklch(0.153 0.006 107.1)'
                    }}
                  />
                  <Bar dataKey="gold" fill="oklch(0.7 0.15 80)" radius={[4, 4, 0, 0]} name="Gold Loans" stackId="a" />
                  <Bar dataKey="silver" fill="oklch(0.8 0.05 200)" radius={[4, 4, 0, 0]} name="Silver Loans" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>

        {isManager && (
          <div className="pv-card p-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t.dashboard.assetComposition}</h3>
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t.common.all}</span>
            </div>
            <div className="p-6 h-[320px]">
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
                      labelLine={false}
                    >
                      {metalData.map((entry: { name: string; value: number }, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getMetalColor(entry.name, index)}
                        />
                      ))}
                    </Pie>
                     <Tooltip 
                      contentStyle={{
                        background: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.93 0.007 106.5)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        color: 'oklch(0.153 0.006 107.1)'
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-bold opacity-50 italic">
                  No inventory data available yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lower Row: Recent Pledges */}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-cards">
             {recentLoans.map((loan) => (
               <div key={loan.id} className="pv-card flex flex-col gap-3 p-4 mb-3 mx-4">
                  <div className="flex justify-between items-center">
                     <span className="font-black text-xs opacity-50">{loan.loanNumber}</span>
                     <span className={`badge ${loan.status}`}>{loan.status}</span>
                  </div>
                  <div className="flex justify-between items-end">
                     <div className="flex flex-col">
                        <span className="font-black text-sm">{loan.customerName}</span>
                        <span className="text-[10px] font-bold opacity-40">{loan.customerPhone}</span>
                     </div>
                     <span className="font-black text-primary">{formatCurrency(loan.loanAmount)}</span>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Helper: Group loans by month and metal type for chart
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
