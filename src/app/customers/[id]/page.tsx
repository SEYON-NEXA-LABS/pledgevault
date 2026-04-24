'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  CreditCard, 
  Plus, 
  History, 
  CircleDollarSign,
  HandCoins,
  ShieldCheck,
  AlertCircle,
  Eye,
  Camera,
  X,
  FileText,
  Loader2,
  User,
  CheckCircle2
} from 'lucide-react';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatDate, LOAN_STATUS_LABELS } from '@/lib/constants';
import { Customer, Loan } from '@/lib/types';
import Link from 'next/link';
import { settingsStore } from '@/lib/store';
import { translations, Language } from '@/lib/i18n/translations';
import Pagination from '@/components/common/Pagination';

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [loansLoading, setLoansLoading] = useState(true);
  const [selectedIdPhoto, setSelectedIdPhoto] = useState<string | null>(null);

  const settings = settingsStore.get();
  const lang: Language = (settings.language || 'en') as Language;
  const t = translations[lang];

  useEffect(() => {
    async function fetchCustomerDetails() {
      if (id) {
        try {
          const foundCustomer = await supabaseService.getCustomerWithDetails(id as string);
          if (foundCustomer) {
            setCustomer(foundCustomer);
          }
        } catch (err) {
          console.error("Error fetching customer:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchCustomerDetails();
  }, [id]);

  useEffect(() => {
    async function fetchCustomerLoans() {
      if (customer?.id) {
        setLoansLoading(true);
        try {
          const result = await supabaseService.getLoansByCustomer(customer.id, page, pageSize);
          setLoans(result.data as unknown as Loan[]);
          setTotal(result.total);
        } catch (err) {
          console.error("Error fetching loans:", err);
        } finally {
          setLoansLoading(false);
        }
      }
    }
    fetchCustomerLoans();
  }, [customer?.id, page]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-black uppercase tracking-widest opacity-40">Syncing Profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <AlertCircle size={48} color="var(--status-overdue)" />
          <h2>Customer Not Found</h2>
          <p>The customer record you are looking for does not exist.</p>
          <Link href="/customers" className="btn btn-primary">Back to Customers</Link>
        </div>
      </div>
    );
  }

  // Summary Metrics (Powered by all-time stats if available, or current view)
  const activeLoansCount = loans.filter(l => l.status === 'active' || l.status === 'overdue').length;
  const totalLoanValue = loans.filter(l => l.status === 'active' || l.status === 'overdue').reduce((sum, l) => sum + l.loanAmount, 0);

  return (
    <div className="page-content animate-in fade-in duration-500">
      <div className="page-header">
        <div className="page-header-left">
          <button onClick={() => router.back()} className="pv-btn pv-btn-ghost gap-2 mb-4">
            <ArrowLeft size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </button>
          <div className="flex items-center gap-6">
            <div 
              className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-3xl font-black shadow-xl shadow-primary/20 cursor-pointer overflow-hidden border-4 border-white dark:border-zinc-900"
              onClick={() => customer.selfiePhoto && setSelectedIdPhoto(customer.selfiePhoto)}
            >
              {customer.selfiePhoto ? (
                <img src={customer.selfiePhoto} alt={customer.name} className="w-full h-full object-cover" />
              ) : (
                customer.name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">{customer.name}</h2>
              <p className="text-sm font-bold text-muted-foreground opacity-60">Customer since {formatDate(customer.createdAt)}</p>
            </div>
          </div>
        </div>
        <div className="page-header-right flex items-center gap-4">
          <Link href={`/loans/new?customerId=${customer.id}`} className="pv-btn pv-btn-gold h-12 px-6 gap-3">
            <Plus size={20} /> <span className="font-black uppercase tracking-widest text-xs">New Loan</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Contact & KYC Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="pv-card p-8">
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                   <User className="text-primary" size={20} />
                   Contact & KYC Details
                </h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-muted-foreground" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Primary Phone</label>
                      <span className="text-lg font-bold">{customer.phone}</span>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-muted-foreground" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Address</label>
                      <span className="text-sm font-bold leading-relaxed">{customer.address}, {customer.city}</span>
                   </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                   <ShieldCheck size={20} className="text-primary mt-1 shrink-0" />
                   <div className="flex-1">
                      <label className="text-[10px] font-black uppercase text-primary/60 block mb-1">{customer.primaryIdType || 'ID'} (Mandatory)</label>
                      <div className="flex items-center justify-between">
                         <span className="font-black text-primary">{customer.primaryIdNumber}</span>
                         {customer.primaryIdPhoto && (
                           <button onClick={() => setSelectedIdPhoto(customer.primaryIdPhoto!)} className="pv-btn pv-btn-ghost h-8 px-3 text-[10px] font-black uppercase">
                              <Camera size={14} className="mr-2" /> View Document
                           </button>
                         )}
                      </div>
                   </div>
                </div>

                {customer.secondaryIdNumber && (
                   <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <ShieldCheck size={20} className="text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1">
                         <label className="text-[10px] font-black uppercase opacity-40 block mb-1">{customer.secondaryIdType || 'SECONDARY ID'}</label>
                         <div className="flex items-center justify-between">
                            <span className="font-bold">{customer.secondaryIdNumber}</span>
                            {customer.secondaryIdPhoto && (
                              <button onClick={() => setSelectedIdPhoto(customer.secondaryIdPhoto!)} className="pv-btn pv-btn-ghost h-8 px-3 text-[10px] font-black uppercase">
                                 <Camera size={14} className="mr-2" /> View
                              </button>
                            )}
                         </div>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* History Ledger */}
          <div className="pv-card p-0 overflow-hidden shadow-2xl">
             <div className="p-8 pb-4 flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                   <History className="text-primary" size={20} />
                   Pledge History
                </h3>
             </div>

             <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-8">Loan ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-right px-8">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loansLoading ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
                          <p className="text-xs font-black uppercase tracking-widest opacity-40">Syncing Ledger...</p>
                        </td>
                      </tr>
                    ) : loans.length > 0 ? (
                      loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-primary/5 transition-colors group border-b border-border/40 last:border-none">
                          <td className="px-8 font-black text-sm">{loan.loanNumber}</td>
                          <td className="text-xs font-bold text-muted-foreground">{formatDate(loan.startDate)}</td>
                          <td className="font-black text-primary">{formatCurrency(loan.loanAmount)}</td>
                          <td>
                            <span className={`badge ${loan.status} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                              {LOAN_STATUS_LABELS[loan.status]}
                            </span>
                          </td>
                          <td className="px-8 text-right">
                            <Link href={`/loans/${loan.id}`} className="pv-btn pv-btn-ghost w-10 h-10 p-0 group-hover:bg-primary group-hover:text-primary-foreground">
                              <Eye size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <HandCoins size={40} className="mx-auto mb-4 opacity-10" />
                          <h4 className="text-sm font-black uppercase tracking-widest opacity-30">No Active Pledges</h4>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>

             {total > pageSize && (
               <div className="p-6 border-t border-border bg-muted/20">
                 <Pagination total={total} pageSize={pageSize} page={page} onPageChange={setPage} loading={loansLoading} />
               </div>
             )}
          </div>
        </div>

        {/* Side Metrics */}
        <div className="space-y-8">
           <div className="pv-card p-8 bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
              <div className="flex items-center gap-4 mb-8 opacity-60">
                 <CircleDollarSign size={24} />
                 <span className="text-[11px] font-black uppercase tracking-widest">Active Exposure</span>
              </div>
              <div className="space-y-6">
                 <div>
                    <span className="text-5xl font-black tracking-tight leading-none block mb-2">{activeLoansCount}</span>
                    <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Active Pledges</span>
                 </div>
                 <div className="pt-6 border-t border-white/20">
                    <span className="text-3xl font-black block mb-1">{formatCurrency(totalLoanValue)}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Principal Outstanding</span>
                 </div>
              </div>
           </div>

           <div className="pv-card p-8 bg-zinc-900 text-zinc-100">
              <div className="flex items-center gap-4 mb-8 opacity-40">
                 <CheckCircle2 size={24} className="text-emerald-500" />
                 <span className="text-[11px] font-black uppercase tracking-widest">Trust Metrics</span>
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <span className="text-2xl font-black block mb-1 text-emerald-500">{total - activeLoansCount}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Closed</span>
                 </div>
                 <div>
                    <span className="text-2xl font-black block mb-1 text-primary">0</span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Auctions</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ID Photo Lightbox */}
      {selectedIdPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 transition-all duration-300" onClick={() => setSelectedIdPhoto(null)}>
          <button className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
             <X size={24} />
          </button>
          <div className="max-w-5xl max-h-full overflow-hidden rounded-2xl shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
             <img src={selectedIdPhoto} alt="KYC Document" className="w-full h-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

