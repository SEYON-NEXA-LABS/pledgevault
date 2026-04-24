'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  User,
  Phone,
  MapPin,
  History,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { customerStore, loanStore, settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { Customer } from '@/lib/types';
import Pagination from '@/components/common/Pagination';
import { translations, Language } from '@/lib/i18n/translations';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Partial<Customer>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const auth = authStore.get();
  const settings = settingsStore.get();
  const lang: Language = (settings.language || 'en') as Language;
  const t = translations[lang];

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, [page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mounted) {
        setPage(0);
        fetchCustomers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      if (auth.firmId) {
        const result = await supabaseService.getCustomers(auth.firmId, page, pageSize, search);
        setCustomers(result.data);
        setTotal(result.total);
      } else {
        // Fallback for local/demo
        const allLocal = customerStore.getAll();
        const filtered = search ? allLocal.filter(c => c.name?.toLowerCase().includes(search.toLowerCase())) : allLocal;
        setCustomers(filtered.slice(page * pageSize, (page + 1) * pageSize));
        setTotal(filtered.length);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="text-4xl font-black tracking-tight mb-2">{t.customers.title}</h2>
          <p className="text-sm font-bold text-muted-foreground opacity-70">
            {t.customers.totalLoans} — {customers.length} {t.common.all}
          </p>
        </div>
        <div className="page-header-right">
          <Link href="/customers/new" className="pv-btn pv-btn-gold shadow-lg shadow-primary/10" id="add-customer-btn">
            <Plus size={18} />
            {t.customers.addCustomer}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-4 h-12 w-full max-w-md transition-all focus-within:border-primary/30 focus-within:bg-card">
          <Search size={18} className="text-muted-foreground opacity-50" />
          <input
            type="text"
            placeholder="Search by name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold w-full"
          />
        </div>
      </div>

      {/* Table & Cards */}
      <div className="pv-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.customers.name}</th>
                  <th>{t.customers.phone}</th>
                  <th>{t.customers.idProof}</th>
                  <th>{t.branches.location}</th>
                  <th>{t.common.status}</th>
                  <th className="text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <RefreshCw className="animate-spin mx-auto mb-4 text-primary opacity-30" size={32} />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-50">Fetching customers...</p>
                    </td>
                  </tr>
                ) : customers.map((customer) => {
                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-black shadow-sm">
                            {customer.name?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{customer.name}</span>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase opacity-60">
                              ID: {customer.id?.substring(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-[13px] font-bold">
                          <Phone size={14} className="text-muted-foreground opacity-50" />
                          {customer.phone}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                            {customer.primaryIdType || 'AADHAAR'}
                          </div>
                          <div className="text-[12px] font-black tracking-tight">{customer.primaryIdNumber}</div>
                          <span className="badge active w-fit mt-1">Verified</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-start gap-2 text-[13px] font-bold">
                          <MapPin size={14} className="text-muted-foreground opacity-50 mt-1 shrink-0" />
                          <span className="text-muted-foreground">{customer.city}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${Number(customer.activeLoansCount) > 0 ? 'active' : 'demo'}`} style={{ fontWeight: 800 }}>
                          {customer.activeLoansCount || 0} {t.common.active}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-4 items-center">
                          <Link href={`/customers/${customer.id}`} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                            Profile
                          </Link>
                          <Link href={`/loans/new?customerId=${customer.id}`} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline border-l border-border pl-4">
                            New Loan
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-cards">
             {customers.map((customer) => (
               <div key={customer.id} className="pv-card flex flex-col gap-4 p-5 hover:shadow-lg transition-all duration-300">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-black shadow-sm">
                          {customer.name?.charAt(0)}
                       </div>
                       <div className="flex flex-col">
                         <span className="font-black text-sm">{customer.name}</span>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{customer.phone}</span>
                       </div>
                    </div>
                    <span className={`badge ${Number(customer.activeLoansCount) > 0 ? 'active' : 'demo'}`}>{customer.activeLoansCount || 0} Active</span>
                 </div>
                 <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Location</span>
                       <span className="text-xs font-bold">{customer.city}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/customers/${customer.id}`} title="Profile" className="pv-btn pv-btn-outline pv-btn-icon">
                        <User size={14} />
                      </Link>
                      <Link href={`/loans/new?customerId=${customer.id}`} title="New Loan" className="pv-btn pv-btn-gold pv-btn-icon">
                        <Plus size={14} />
                      </Link>
                    </div>
                 </div>
               </div>
             ))}
          </div>

          {!loading && customers.length === 0 && (
            <div className="empty-state" style={{ padding: '80px', textAlign: 'center' }}>
               <User size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
               <h3 style={{ fontWeight: 800 }}>No customers found</h3>
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
