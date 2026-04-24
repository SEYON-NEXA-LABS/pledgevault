'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CircleDollarSign, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  Loader2,
  FileText,
  Clock,
  User,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Download
} from 'lucide-react';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { settingsStore } from '@/lib/store';
import { translations, Language } from '@/lib/i18n/translations';
import { formatCurrency, formatDate } from '@/lib/constants';
import Pagination from '@/components/common/Pagination';
import { exportToCSV, getExportFilename } from '@/lib/exportUtils';

export default function CollectionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Filter State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const auth = authStore.get();
  const settings = settingsStore.get();
  const lang: Language = (settings.language || 'en') as Language;
  const t = translations[lang];
  const activeBranchId = settings.activeBranchId;

  useEffect(() => {
    setMounted(true);
    fetchPayments();
  }, [page, activeBranchId, auth.firmId, typeFilter, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mounted) fetchPayments();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPayments = async () => {
    if (!auth.firmId) return;
    setLoading(true);
    try {
      const result = await supabaseService.getPaginatedPayments(
        auth.firmId,
        activeBranchId === 'firm' ? undefined : activeBranchId,
        page,
        pageSize,
        {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
          search: search || undefined
        }
      );
      setPayments(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching collection ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!auth.firmId) return;
    setExporting(true);
    try {
      const data = await supabaseService.getPaymentsForExport(
        auth.firmId,
        activeBranchId === 'firm' ? undefined : activeBranchId,
        {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
          search: search || undefined
        }
      );

      const exportData = data.map((p: any) => ({
        'Loan Number': p.loans?.loanNumber,
        'Customer': p.loans?.customerName,
        'Amount': p.amount,
        'Type': p.type.toUpperCase(),
        'Date': formatDate(p.paymentDate),
        'Remarks': p.remarks || ''
      }));

      const filename = getExportFilename(settings.shopName || 'PV', 'COLLECTIONS');
      exportToCSV(exportData, filename);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  if (!mounted) return null;

  return (
    <div className="collections-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="text-4xl font-black tracking-tight mb-2">
            <CircleDollarSign className="inline-block mr-3 text-primary" size={32} />
            {t.collections.title}
          </h2>
          <p className="text-sm font-bold text-muted-foreground opacity-70">
            {t.collections.subtitle} — {total} {t.common.all}
          </p>
        </div>
        <div className="page-header-right flex items-center gap-3">
           <button 
             onClick={handleExport} 
             disabled={exporting || total === 0}
             className="pv-btn pv-btn-outline h-12 gap-2 px-6"
           >
             {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
             <span className="text-[10px] font-black uppercase tracking-widest">Export Ledger</span>
           </button>

           <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 flex items-center gap-3">
              <ShieldCheck className="text-primary" size={18} />
              <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase opacity-40 leading-none mb-1">Audit Mode</span>
                 <span className="text-xs font-bold text-primary">Immutable Ledger</span>
              </div>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-container bg-card border border-border/50 rounded-2xl p-4 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="search-box relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
            <input 
              type="text" 
              className="pv-input pl-12 h-12 bg-muted/20 border-transparent focus:bg-card focus:border-primary/30" 
              placeholder={t.common.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
               <button 
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'all' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground opacity-50 hover:opacity-100'}`}
               >
                 {t.common.all}
               </button>
               <button 
                onClick={() => setTypeFilter('interest')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'interest' ? 'bg-card shadow-sm text-blue-600' : 'text-muted-foreground opacity-50 hover:opacity-100'}`}
               >
                 {t.collections.interestOnly}
               </button>
               <button 
                onClick={() => setTypeFilter('full_closure')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'full_closure' ? 'bg-card shadow-sm text-emerald-600' : 'text-muted-foreground opacity-50 hover:opacity-100'}`}
               >
                 {t.collections.fullClosure}
               </button>
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`pv-btn pv-btn-outline h-12 gap-2 ${showFilters ? 'bg-primary/5 border-primary' : ''}`}
            >
              <Calendar size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">
                {startDate ? `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : '...'}` : t.common.calendar}
              </span>
            </button>

            {(search || typeFilter !== 'all' || startDate || endDate) && (
              <button onClick={clearFilters} className="pv-btn pv-btn-ghost text-destructive hover:bg-destructive/10 gap-2">
                <X size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Filters Drawer */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
               <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase opacity-40 ml-1">From Date</label>
                  <input 
                    type="date" 
                    className="pv-input h-10 px-3 text-xs font-bold" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
               </div>
               <div className="mt-4 text-muted-foreground opacity-20">
                  <ChevronRight size={14} />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase opacity-40 ml-1">To Date</label>
                  <input 
                    type="date" 
                    className="pv-input h-10 px-3 text-xs font-bold" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
               </div>
            </div>
            <div className="flex items-center gap-2 mt-4 ml-auto">
               <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">Reset Dates</button>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="pv-card p-0 overflow-hidden shadow-xl border-border/50 bg-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-16">#</th>
                <th>{t.loans.loanId}</th>
                <th>{t.loans.customer}</th>
                <th>{t.collections.paymentType}</th>
                <th>{t.collections.amount}</th>
                <th>{t.common.date}</th>
                <th>{t.collections.recordedBy}</th>
                <th className="text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={40} />
                    <p className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Syncing Ledger...</p>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((payment, index) => (
                  <tr key={payment.id} className="hover:bg-primary/5 transition-colors border-b border-border/40 last:border-none">
                    <td className="text-[10px] font-black opacity-30 px-6">{(page * pageSize) + index + 1}</td>
                    <td className="px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <FileText size={14} />
                        </div>
                        <span className="font-black text-sm tracking-tight">{payment.loans?.loanNumber}</span>
                      </div>
                    </td>
                    <td className="px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{payment.loans?.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6">
                      <span className={`badge ${payment.type} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                        {payment.type === 'interest' ? t.collections.interestOnly :
                         payment.type === 'principal' ? t.collections.principalOnly :
                         payment.type === 'full_closure' ? t.collections.fullClosure :
                         t.collections.partial}
                      </span>
                    </td>
                    <td className="px-6 font-black text-primary text-base">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Clock size={12} className="opacity-40" />
                        {formatDate(payment.paymentDate)}
                      </div>
                    </td>
                    <td className="px-6">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                         <User size={12} />
                         <span>Staff</span>
                      </div>
                    </td>
                    <td className="px-6 text-right">
                       <Link href={`/loans/${payment.loanId}`} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                          {t.common.details}
                       </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-32 text-center">
                    <div className="opacity-10 mb-6">
                      <CircleDollarSign size={64} className="mx-auto" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-widest opacity-30 mb-2">Immutable Ledger Empty</h3>
                    <p className="text-sm font-bold text-muted-foreground opacity-40 max-w-xs mx-auto">
                      No collections recorded for this period. Recorded payments will appear here as a gapless audit trail.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > pageSize && (
          <div className="p-6 border-t border-border bg-muted/20">
            <Pagination 
              total={total} 
              pageSize={pageSize} 
              page={page} 
              onPageChange={setPage} 
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
