'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Eye,
  XCircle,
  RefreshCw,
  HandCoins,
  Phone,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { loanStore, settingsStore } from '@/lib/store';
import { translations, Language } from '@/lib/i18n/translations';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { ChevronLeft as ChevronLeftIcon, ChevronRight } from 'lucide-react';
import { formatCurrency, formatWeight, formatDate, getDaysOverdue, LOAN_STATUS_LABELS } from '@/lib/constants';
import { Loan, LoanStatus } from '@/lib/types';
import Pagination from '@/components/common/Pagination';
import { PLAN_LIMITS } from '@/lib/constants';
import { PlanTier } from '@/lib/types';
import { Shield, Zap, AlertTriangle } from 'lucide-react';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Loans' },
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'closed', label: 'Closed' },
  { value: 'draft', label: 'Drafts' },
];

export default function LoansPage() {
  const [loans, setLoans] = useState<Partial<Loan>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');

  const auth = authStore.get();
  const settings = settingsStore.get();
  const lang: Language = (settings.language || 'en') as Language;
  const t = translations[lang];
  const activeBranchId = settings.activeBranchId;

  useEffect(() => {
    setMounted(true);
    fetchLoans();
  }, [page, statusFilter, activeBranchId, dateRange.start, dateRange.end, amountRange.min, amountRange.max]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mounted) {
        setPage(0);
        fetchLoans();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      if (auth.firmId) {
        const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const result = await supabaseService.getLoans(
          auth.firmId,
          (activeBranchId && isValidUuid(activeBranchId)) ? activeBranchId : undefined,
          page,
          pageSize,
          search || undefined,
          statusFilter
        );
        
        setLoans(result.data);
        setTotal(result.total);
      } else {
        // Fallback for demo/local mode
        const allLocal = loanStore.getAll().filter(l => {
          if (activeBranchId && l.branchId !== activeBranchId) return false;
          if (statusFilter !== 'all' && l.status !== statusFilter) return false;
          if (search) {
             const q = search.toLowerCase();
             return l.loanNumber?.toLowerCase().includes(q) || l.customerName?.toLowerCase().includes(q);
          }
          return true;
        });
        setLoans(allLocal.slice(page * pageSize, (page + 1) * pageSize));
        setTotal(allLocal.length);
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCapacity = async () => {
    if (!auth.firmId) return;
    try {
      const count = await supabaseService.getActiveLoanCount(auth.firmId);
      setActiveCount(count);
      
      const profile = await supabaseService.getUserProfile(auth.userId || '');
      if (profile?.firms?.plan) {
        setCurrentPlan(profile.firms.plan as PlanTier);
      }
    } catch (err) {
      console.error('Error fetching capacity:', err);
    }
  };

  useEffect(() => {
    if (mounted) fetchCapacity();
  }, [mounted, loans]);


  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  const handleShareTrackLink = (loan: any) => {
    const trackLink = `${window.location.origin}/track/${loan.id}`;
    const shareMessage = `Dear ${loan.customerName}, your loan #${loan.loanNumber} status can be tracked live at: ${trackLink}`;

    if (navigator.share) {
      navigator.share({
        title: `PledgeVault Tracker #${loan.loanNumber}`,
        text: shareMessage,
        url: trackLink
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(trackLink);
      alert('Tracking link copied to clipboard!');
    }
  };

  const handleCloseLoan = async (loanId: string) => {
    if (confirm('Are you sure you want to close this loan? This marks the pledge as redeemed.')) {
      try {
        await supabaseService.updateLoanStatus(loanId, 'closed');
        fetchLoans();
      } catch (err) {
        console.error('Failed to close loan:', err);
        alert('Failed to close loan. Please try again.');
      }
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="text-4xl font-black tracking-tight mb-2">{t.loans.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <p className="text-sm font-bold text-muted-foreground opacity-70">
              {t.sidebar.loans} — {loans.length} {t.common.all}, {loans.filter((l) => l.status === 'active').length} {t.common.active}
            </p>
            
            {/* Plan Capacity Indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 10px', 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              color: activeCount >= (PLAN_LIMITS[currentPlan]?.maxLoans || 0) ? 'var(--status-overdue)' : 
                     activeCount >= (PLAN_LIMITS[currentPlan]?.maxLoans || 0) * 0.9 ? 'var(--gold)' : 'var(--brand-primary)'
            }}>
              {activeCount >= (PLAN_LIMITS[currentPlan]?.maxLoans || 0) ? <AlertTriangle size={12} /> : <Zap size={12} />}
              <span>{activeCount} / {PLAN_LIMITS[currentPlan]?.maxLoans === Infinity ? '∞' : (PLAN_LIMITS[currentPlan]?.maxLoans || 0)} ACTIVE</span>
            </div>
          </div>
        </div>
        <div className="page-header-right">
          <Link href="/loans/new" className="pv-btn pv-btn-gold shadow-lg shadow-primary/10" id="create-loan-btn">
            <Plus size={18} />
            {t.loans.addLoan}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-4 h-12 w-full max-w-md transition-all focus-within:border-primary/30 focus-within:bg-card">
          <Search size={18} className="text-muted-foreground opacity-50" />
          <input
            type="text"
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold w-full"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`pv-btn pv-btn-sm whitespace-nowrap px-4 ${statusFilter === f.value ? 'pv-btn-primary' : 'pv-btn-outline'}`}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(0);
              }}
            >
              {f.label}
            </button>
          ))}
          <button 
            className={`pv-btn pv-btn-sm whitespace-nowrap ${showFilters ? 'pv-btn-gold' : 'pv-btn-outline'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="pv-card anim-slide-up" style={{ marginBottom: '24px', border: '1px solid var(--brand-glow)' }}>
          <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', padding: '24px' }}>
              <div className="filter-group">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Loan Date Range</label>
                <div className="range-inputs" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input className="pv-input" type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>to</span>
                  <input className="pv-input" type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
              </div>
              <div className="filter-group">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Amount Range (₹)</label>
                <div className="range-inputs" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input className="pv-input" type="number" placeholder="Min" value={amountRange.min} onChange={e => setAmountRange({...amountRange, min: e.target.value})} />
                  <input className="pv-input" type="number" placeholder="Max" value={amountRange.max} onChange={e => setAmountRange({...amountRange, max: e.target.value})} />
                </div>
              </div>
              <div className="filter-actions" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <button 
                  className="pv-btn pv-btn-sm pv-btn-outline"
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    setAmountRange({ min: '', max: '' });
                    setSearch('');
                  }}
                >
                  Clear All
                </button>
              </div>
          </div>
        </div>
      )}
            {/* Table & Cards */}
      <div className="pv-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.loans.loanId}</th>
                  <th>{t.loans.customer}</th>
                  <th>{t.loans.items}</th>
                  <th>{t.loans.weight}</th>
                  <th>{t.loans.amount}</th>
                  <th>{t.loans.interest}</th>
                  <th>{t.loans.dueDate}</th>
                  <th>{t.common.status}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-24 text-center">
                      <RefreshCw className="animate-spin mx-auto mb-4 text-primary opacity-30" size={32} />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-50">Fetching loans...</p>
                    </td>
                  </tr>
                ) : loans.map((loan) => {
                  const items = (loan as any).items || [];
                  const goldWeight = items
                    .filter((i: any) => i.metalType === 'gold')
                    .reduce((s: any, i: any) => s + i.netWeight, 0);
                  const silverWeight = items
                    .filter((i: any) => i.metalType === 'silver')
                    .reduce((s: any, i: any) => s + i.netWeight, 0);

                  return (
                    <tr key={loan.id}>
                      <td>
                        <div className="font-black text-sm">{loan.loanNumber}</div>
                        <div className="text-[11px] font-bold text-muted-foreground opacity-50 uppercase tracking-tight">
                          {loan.startDate ? formatDate(loan.startDate) : '---'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                            {loan.customerName?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{loan.customerName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-muted-foreground uppercase opacity-60">{loan.customerPhone}</span>
                              <div className="flex gap-1.5">
                                <a 
                                  href={`tel:${loan.customerPhone}`} 
                                  className="p-1 rounded-md bg-primary/5 text-primary hover:bg-primary/20 transition-colors"
                                  title="Call"
                                >
                                  <Phone size={10} />
                                </a>
                                <a 
                                  href={`sms:${loan.customerPhone}?body=${encodeURIComponent(`Reminder: Your pledge ${loan.loanNumber} is due. Please contact us.`)}`} 
                                  className="p-1 rounded-md bg-blue-500/5 text-blue-600 hover:bg-blue-500/20 transition-colors"
                                  title="SMS"
                                >
                                  <MessageSquare size={10} />
                                </a>
                                <a 
                                  href={`https://wa.me/${loan.customerPhone?.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-green-500/5 text-green-600 hover:bg-green-500/20 transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageCircle size={10} />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1.5 flex-wrap max-w-[140px]">
                          {items.length > 0 ? items.map((item: any) => (
                            <span 
                              key={item.id} 
                              className={`badge ${item.metalType === 'gold' ? 'active' : 'demo'} px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-current opacity-80`}
                              style={{ borderColor: item.metalType === 'gold' ? 'oklch(0.7 0.15 80 / 30%)' : 'oklch(0.8 0.05 200 / 30%)' }}
                            >
                              {item.itemType}
                            </span>
                          )) : (
                            <span className="text-[10px] font-bold text-muted-foreground opacity-30 italic">Uncategorized</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          {goldWeight > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                              <span className="text-sm font-black text-foreground">{formatWeight(goldWeight)}</span>
                              <span className="text-[9px] font-black text-gold uppercase tracking-widest">AU</span>
                            </div>
                          )}
                          {silverWeight > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span className="text-sm font-black text-foreground">{formatWeight(silverWeight)}</span>
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">AG</span>
                            </div>
                          )}
                          {goldWeight === 0 && silverWeight === 0 && (
                            <span className="text-sm font-bold text-muted-foreground opacity-20">---</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-primary tracking-tight">
                            {formatCurrency(loan.loanAmount || 0)}
                          </span>
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">INR Payout</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-foreground">{loan.interestRate || 0}%</span>
                          <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">MTH</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className={`text-sm ${loan.status === 'overdue' ? 'text-destructive font-black' : 'font-bold'}`}>
                            {formatDate(loan.dueDate || '')}
                          </span>
                          {loan.status === 'overdue' ? (
                            <span className="text-[9px] text-destructive font-black uppercase tracking-wider">
                              {getDaysOverdue(loan.dueDate || '')}d Delay
                            </span>
                          ) : (
                            <span className="text-[9px] text-muted-foreground font-black uppercase opacity-40">Expiry</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${loan.status || 'active'}`} style={{ fontWeight: 800 }}>
                          {(loan.status && LOAN_STATUS_LABELS[loan.status as keyof typeof LOAN_STATUS_LABELS]) || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/loans/${loan.id}`} className="pv-btn pv-btn-sm pv-btn-outline font-black text-[10px] uppercase tracking-widest h-8 px-3">
                            {t.common.details}
                          </Link>
                          <button 
                            onClick={() => handleShareTrackLink(loan)}
                            className="pv-btn pv-btn-sm pv-btn-outline font-black text-[10px] uppercase tracking-widest h-8 w-8 p-0"
                            title="Share Tracking Link"
                          >
                            <ShieldCheck size={14} className="text-brand-primary" />
                          </button>
                          {loan.status === 'draft' && (
                            <Link href={`/loans/new?draftId=${loan.id}`} className="pv-btn pv-btn-sm pv-btn-gold font-black text-[10px] uppercase tracking-widest h-8 px-3">
                               {t.loans.resume}
                            </Link>
                          )}
                          {(loan.status === 'active' || loan.status === 'overdue') && (
                            <button
                              className="pv-btn pv-btn-sm pv-btn-outline text-destructive border-destructive/20 font-black text-[10px] uppercase tracking-widest h-8 px-3"
                              onClick={() => handleCloseLoan(loan.id || '')}
                            >
                              {t.loans.close}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-cards">
             {loans.map((loan) => (
               <div key={loan.id} className="pv-card flex flex-col gap-4 p-5 hover:shadow-lg transition-all duration-300">
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Loan Number</span>
                       <span className="font-black text-sm">{loan.loanNumber}</span>
                    </div>
                    <span className={`badge ${loan.status || 'active'}`}>{loan.status}</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Customer & Assets</span>
                    <div className="flex justify-between items-start">
                       <span className="text-sm font-bold">{loan.customerName}</span>
                       <div className="flex gap-1">
                          {((loan as any).items || []).slice(0, 2).map((item: any) => (
                            <span key={item.id} className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {item.itemType}
                            </span>
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-4 mt-2">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Principal</span>
                       <span className="text-sm font-black text-primary">{formatCurrency(loan.loanAmount || 0)}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Weight</span>
                       <span className="text-sm font-black text-foreground">
                         {formatWeight(((loan as any).items || []).reduce((s: number, i: any) => s + i.netWeight, 0))}
                       </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Due Date</span>
                       <span className={`text-sm font-bold ${loan.status === 'overdue' ? 'text-destructive' : ''}`}>
                          {formatDate(loan.dueDate || '')}
                       </span>
                    </div>
                 </div>
                 <div className="flex gap-2 border-t border-border/50 pt-4">
                    <Link href={`/loans/${loan.id}`} className="pv-btn pv-btn-outline flex-1 h-10 rounded-xl font-black text-xs uppercase tracking-widest">
                       Details
                    </Link>
                    <button 
                      onClick={() => handleShareTrackLink(loan)}
                      className="pv-btn pv-btn-outline w-10 h-10 rounded-xl flex items-center justify-center"
                    >
                       <ShieldCheck size={18} className="text-brand-primary" />
                    </button>
                    {(loan.status === 'active' || loan.status === 'overdue') && (
                       <button 
                        className="pv-btn pv-btn-outline text-destructive border-destructive/20 hover:bg-destructive/5 flex-1 h-10 rounded-xl font-black text-xs uppercase tracking-widest"
                        onClick={() => handleCloseLoan(loan.id || '')}
                       >
                          Close
                       </button>
                    )}
                 </div>
               </div>
             ))}
          </div>

          {!loading && loans.length === 0 && (
            <div className="empty-state" style={{ padding: '80px', textAlign: 'center' }}>
               <HandCoins size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
               <h3 style={{ fontWeight: 800 }}>No loans found</h3>
            </div>
          )}
          
          <Pagination 
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            loading={loading}
          />
      </div>
    </>
  );
}
