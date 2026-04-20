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

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      if (auth.firmId) {
        const result = await supabaseService.getCustomers(auth.firmId, page, pageSize);
        setCustomers(result.data);
        setTotal(result.total);
      } else {
        // Fallback for local/demo
        const allLocal = customerStore.getAll();
        setCustomers(allLocal.slice(page * pageSize, (page + 1) * pageSize));
        setTotal(allLocal.length);
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

  const displayCustomers = customers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      );
    }
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Customers</h2>
          <p className="subtitle">
            Manage your customer database — {customers.length} total registered
          </p>
        </div>
        <div className="page-header-right">
          <Link href="/customers/new" className="btn btn-gold" id="add-customer-btn">
            <Plus size={18} />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="header-search" style={{ maxWidth: '400px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, phone or Aadhaar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="customer-search"
          />
        </div>
      </div>

      {/* Grid or Table */}
      <div className="card">
        <div className="card-body no-padding">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>KYC Details</th>
                <th>Location</th>
                <th>Loans</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan={6} style={{ textAlign: 'center', padding: '100px 0' }}>
                     <RefreshCw className="spin" size={32} style={{ color: 'var(--gold)', opacity: 0.5 }} />
                     <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Fetching customers...</p>
                   </td>
                </tr>
              ) : displayCustomers.map((customer) => {
                return (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                          {customer.name?.charAt(0)}
                        </div>
                        <div className="customer-info">
                          <div className="name" style={{ fontSize: '15px' }}>{customer.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            ID: {customer.id?.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                        <Phone size={14} style={{ color: 'var(--text-tertiary)' }} />
                        {customer.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>{customer.primaryIdType?.toUpperCase() || 'AADHAAR'}:</span> {customer.primaryIdNumber}
                      </div>
                      <span className="kyc-verified" style={{ marginTop: '4px' }}>Verified</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', maxWidth: '200px' }}>
                        <MapPin size={14} style={{ color: 'var(--text-tertiary)', marginTop: '2px', flexShrink: 0 }} />
                        <span>{customer.city}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={`badge ${Number(customer.activeLoansCount) > 0 ? 'active' : 'demo'}`} style={{ width: 'fit-content' }}>
                          {customer.activeLoansCount || 0} Active Loans
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="quick-actions">
                        <Link href={`/customers/${customer.id}`} title="View Profile">
                          <button><User size={16} /></button>
                        </Link>
                        <Link href={`/loans/new?customerId=${customer.id}`} title="New Loan">
                          <button><Plus size={16} /></button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayCustomers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <User size={28} />
                      </div>
                      <h3>No customers found</h3>
                      <p>
                        {search
                          ? 'Try a different search term'
                          : 'Register your first customer to get started'}
                      </p>
                      {!search && (
                        <Link href="/customers/new" className="btn btn-gold btn-sm">
                          <Plus size={16} /> Add Customer
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Footer */}
          <div className="pagination-footer">
            <div className="pagination-info">
              Showing <span>{page * pageSize + 1}</span> to <span>{Math.min((page + 1) * pageSize, total)}</span> of <span>{total}</span> customers
            </div>
            <div className="pagination-btns">
              <button 
                className="btn btn-outline btn-sm" 
                disabled={page === 0 || loading}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button 
                className="btn btn-outline btn-sm"
                disabled={(page + 1) * pageSize >= total || loading}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
