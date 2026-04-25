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
  Lock,
  Crown,
  Zap,
  Loader2,
  AlertTriangle,
  History
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
  AreaChart,
  Area
} from 'recharts';
import { settingsStore } from '@/lib/store';
import { formatCurrency, formatDateShort } from '@/lib/constants';
import { Loan, PlanTier } from '@/lib/types';
import Link from 'next/link';
import StatCard from '@/components/layout/StatCard';
import { translations, Language } from '@/lib/i18n/translations';
import { exportToCSV, getExportFilename } from '@/lib/exportUtils';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';

const COLORS = ['#107B88', '#1A3C34', '#D4A843', '#28A745', '#DC3545'];

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [lang, setLang] = useState<Language>('en');

  const auth = authStore.get();
  const settings = settingsStore.get();
  const activeBranchId = settings.activeBranchId;

  useEffect(() => {
    setMounted(true);
    if (settings.language) setLang(settings.language as Language);
    fetchData();
  }, [activeBranchId, customRange]);

  const t = translations[lang] || translations.en;

  const fetchData = async () => {
    if (!auth.firmId) return;
    setLoading(true);
    try {
      const result = await supabaseService.getReportsData(
        auth.firmId,
        activeBranchId,
        customRange.start,
        customRange.end
      );
      setReportData(result);
      
      const profile = await supabaseService.getUserProfile(auth.userId || '');
      if (profile?.firms?.plan) {
        setCurrentPlan(profile.firms.plan as PlanTier);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching reports data:', err);
      setError(err.message || 'Failed to compile financial reports. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

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

  if (!mounted) return null;

  const summary = reportData?.summary || {};
  const delinquentLoans = reportData?.delinquentLoans || [];
  const dailyEarnings = reportData?.dailyEarnings || [];

  return (
    <div className="page-content animate-in fade-in duration-500">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="text-4xl font-black tracking-tight mb-2">
            <BarChart3 className="inline-block mr-3 text-primary" size={32} />
            {t.reports.title}
          </h2>
          <p className="text-sm font-bold text-muted-foreground opacity-70">
            {t.reports.subtitle}
          </p>
        </div>
        <div className="page-header-right flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          <div className="bg-muted/30 p-1 rounded-xl border border-border/50 flex shrink-0">
             {['today', '7d', '30d', 'year'].map(p => (
               <button 
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === p ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground opacity-50 hover:opacity-100'}`}
               >
                 {p}
               </button>
             ))}
          </div>
          <button className="pv-btn pv-btn-outline h-11 gap-2 shrink-0">
            <Download size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
           <Loader2 className="animate-spin text-primary" size={40} />
           <p className="text-xs font-black uppercase tracking-widest opacity-40">Compiling Financial Data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
           <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center text-4xl shadow-inner">
              ⚠️
           </div>
           <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Audit Report Failed</h3>
              <p className="text-sm font-bold text-muted-foreground opacity-60 max-w-md mx-auto leading-relaxed">
                 {error}
              </p>
           </div>
           <button 
            onClick={() => fetchData()}
            className="pv-btn pv-btn-primary h-12 px-8"
           >
             Retry Audit
           </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title={t.reports.principalDisbursed} 
              value={formatCurrency(summary.totalPrincipalDisbursed)} 
              icon={TrendingUp} 
              change="+12%" 
              changeType="positive"
              variant="primary"
            />
            <StatCard 
              title={t.reports.interestCollected} 
              value={formatCurrency(summary.totalInterestCollected)} 
              icon={CircleDollarSign} 
              change="+8%" 
              changeType="positive"
              variant="vibrant"
            />
            <StatCard 
              title={t.reports.outstandingPrincipal} 
              value={formatCurrency(summary.outstandingPrincipal)} 
              icon={Shield} 
              variant="deep"
            />
            <StatCard 
              title={t.reports.activeLoans} 
              value={(summary.activeCount || 0).toString()} 
              icon={History} 
              variant="primary"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Earnings Chart */}
            <div className="pv-card p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                  <TrendingUp className="text-primary" size={20} />
                  Cash Inflow Trend
                </h3>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyEarnings}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-tertiary)' }}
                      tickFormatter={(d) => d}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-tertiary)' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 800, fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Delinquency Section */}
            <div className="pv-card p-8 border-l-4 border-destructive">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3 text-destructive">
                  <AlertTriangle size={20} />
                  Risk Management (Delinquent)
                </h3>
                <Link href="/loans?status=overdue" className="text-[10px] font-black uppercase tracking-widest hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {delinquentLoans.length > 0 ? delinquentLoans.map((loan: any) => (
                  <div key={loan.id} className="flex items-center justify-between p-4 rounded-2xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center text-destructive font-black text-xs">
                          {(loan.loanNumber || 'LN').substring(0, 2)}
                       </div>
                       <div>
                          <span className="block text-sm font-black text-zinc-900 dark:text-zinc-100">{loan.customerName}</span>
                          <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">
                             {loan.loanNumber || 'N/A'} • Due {formatDateShort(loan.dueDate)}
                          </span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="text-right">
                          <span className="block font-black text-primary">{formatCurrency(loan.loanAmount)}</span>
                       </div>
                       <div className="flex gap-1.5 sm:hidden">
                          <a href={`tel:${loan.customerPhone}`} className="p-1.5 rounded-lg bg-primary/10 text-primary"><TrendingUp size={12} className="rotate-90" /></a>
                          <Link href={`/loans/${loan.id}`} className="p-1.5 rounded-lg bg-primary/10 text-primary"><ArrowUpRight size={12} /></Link>
                       </div>
                    </div>
                  </div>
                )) : (
                   <div className="py-12 text-center opacity-30">
                      <Shield size={40} className="mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">No Critical Delinquencies Found</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
