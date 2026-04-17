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
} from 'lucide-react';
import { loanStore, settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { ChevronLeft as ChevronLeftIcon, ChevronRight } from 'lucide-react';
import { formatCurrency, formatWeight, formatDate, getDaysOverdue, LOAN_STATUS_LABELS } from '@/lib/constants';
import { Loan, LoanStatus } from '@/lib/types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Loans' },
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'closed', label: 'Closed' },
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

  const auth = authStore.get();
  const settings = settingsStore.get();
  const activeBranchId = settings.activeBranchId;

  useEffect(() => {
    setMounted(true);
    fetchLoans();
  }, [page, statusFilter, activeBranchId, dateRange.start, dateRange.end, amountRange.min, amountRange.max]);

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
          statusFilter === 'all' ? undefined : statusFilter
        );
        setLoans(result.data);
        setTotal(result.total);
      } else {
        // Fallback for demo/local mode
        const allLocal = loanStore.getAll().filter(l => {
          if (activeBranchId && l.branchId !== activeBranchId) return false;
          if (statusFilter !== 'all' && l.status !== statusFilter) return false;
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


  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  // Local Search filtering (on top of paginated results for now, 
  // though real search should be server-side)
  const displayLoans = loans.filter((l) => {
    // 1. Search Query
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch = l.loanNumber?.toLowerCase().includes(q) ||
        l.customerName?.toLowerCase().includes(q) ||
        l.customerPhone?.includes(q);
      if (!matchesSearch) return false;
    }

    // 2. Amount Range
    if (amountRange.min && (l.loanAmount || 0) < Number(amountRange.min)) return false;
    if (amountRange.max && (l.loanAmount || 0) > Number(amountRange.max)) return false;

    // 3. Date Range
    if (dateRange.start && l.startDate && new Date(l.startDate) < new Date(dateRange.start)) return false;
    if (dateRange.end && l.startDate && new Date(l.startDate) > new Date(dateRange.end)) return false;

    return true;
  });

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
          <h2>Loans</h2>
          <p className="subtitle">
            Manage all pledge loans — {loans.length} total, {loans.filter((l) => l.status === 'active').length} active
          </p>
        </div>
        <div className="page-header-right">
          <Link href="/loans/new" className="btn btn-gold" id="create-loan-btn">
            <Plus size={18} />
            New Loan
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="header-search" style={{ maxWidth: '360px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by loan #, customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="loan-search"
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`btn btn-sm ${statusFilter === f.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(0); // Reset page on filter change
              }}
            >
              {f.label}
            </button>
          ))}
          <button 
            className={`btn btn-sm ${showFilters ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="advanced-filters card animate-slide-down">
          <div className="card-body">
            <div className="filter-grid">
              <div className="filter-group">
                <label>Loan Date Range</label>
                <div className="range-inputs">
                  <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                  />
                  <span>to</span>
                  <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                  />
                </div>
              </div>
              <div className="filter-group">
                <label>Amount Range (₹)</label>
                <div className="range-inputs">
                  <input 
                    type="number" 
                    placeholder="Min"
                    value={amountRange.min} 
                    onChange={e => setAmountRange({...amountRange, min: e.target.value})} 
                  />
                  <input 
                    type="number" 
                    placeholder="Max"
                    value={amountRange.max} 
                    onChange={e => setAmountRange({...amountRange, max: e.target.value})} 
                  />
                </div>
              </div>
              <div className="filter-actions">
                <button 
                  className="btn btn-sm btn-outline"
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
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-body no-padding">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Weight</th>
                <th>Loan Amount</th>
                <th>Interest</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan={9} style={{ textAlign: 'center', padding: '100px 0' }}>
                     <RefreshCw className="spin" size={32} style={{ color: 'var(--gold)', opacity: 0.5 }} />
                     <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Fetching loans...</p>
                   </td>
                </tr>
              ) : displayLoans.map((loan) => {
                // Ensure array existence
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
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {loan.loanNumber}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {loan.startDate ? formatDate(loan.startDate) : '---'}
                      </div>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {loan.customerName?.charAt(0)}
                        </div>
                        <div className="customer-info">
                          <div className="name">{loan.customerName}</div>
                          <div className="phone">{loan.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {items.map((item: any) => (
                          <span
                            key={item.id}
                            className={`badge ${item.metalType}`}
                            style={{ fontSize: '11px' }}
                          >
                            {item.itemType}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {goldWeight > 0 && (
                        <div style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
                            {formatWeight(goldWeight)}
                          </span>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}> Au</span>
                        </div>
                      )}
                      {silverWeight > 0 && (
                        <div style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--silver-dark)', fontWeight: 600 }}>
                            {formatWeight(silverWeight)}
                          </span>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}> Ag</span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(loan.loanAmount || 0)}</td>
                    <td>
                      <span style={{ fontSize: '13px' }}>
                        {loan.interestRate || 0}%
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}> /mo</span>
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            loan.status === 'overdue'
                              ? 'var(--status-overdue)'
                              : 'var(--text-primary)',
                          fontWeight: loan.status === 'overdue' ? 600 : 400,
                        }}
                      >
                        {formatDate(loan.dueDate || '')}
                      </span>
                      {loan.status === 'overdue' && (
                        <div style={{ fontSize: '11px', color: 'var(--status-overdue)' }}>
                          {getDaysOverdue(loan.dueDate || '')}d overdue
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${loan.status || 'active'}`}>
                        {(loan.status && LOAN_STATUS_LABELS[loan.status as keyof typeof LOAN_STATUS_LABELS]) || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="quick-actions">
                        <Link href={`/loans/${loan.id}`} title="View Details">
                          <button><Eye size={16} /></button>
                        </Link>
                        {(loan.status === 'active' || loan.status === 'overdue') && (
                          <button
                            title="Close Loan"
                            onClick={() => handleCloseLoan(loan.id || '')}
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayLoans.length === 0 && !loading && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <HandCoins size={28} />
                      </div>
                      <h3>No loans found</h3>
                      <p>
                        {search
                          ? 'Try a different search term'
                          : 'Create your first loan to get started'}
                      </p>
                      {!search && (
                        <Link href="/loans/new" className="btn btn-gold btn-sm">
                          <Plus size={16} /> Create Loan
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
              Showing <span>{page * pageSize + 1}</span> to <span>{Math.min((page + 1) * pageSize, total)}</span> of <span>{total}</span> loans
            </div>
            <div className="pagination-btns">
              <button 
                className="btn btn-outline btn-sm" 
                disabled={page === 0 || loading}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeftIcon size={16} /> Previous
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

        <style jsx>{`
          .pagination-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(255, 255, 255, 0.01);
          }
          .pagination-info {
            font-size: 13px;
            color: var(--text-tertiary);
          }
          .pagination-info span {
            color: var(--text-primary);
            font-weight: 600;
          }
          .pagination-btns {
            display: flex;
            gap: 8px;
          }

          .advanced-filters {
            margin-bottom: 24px;
            border: 1px solid var(--gold-soft);
          }

          .filter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 24px;
            align-items: flex-end;
          }

          .filter-group label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: var(--text-tertiary);
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          .range-inputs {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .range-inputs input {
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 8px 12px;
            color: var(--text-primary);
            font-size: 13px;
            width: 100%;
          }

          .range-inputs span {
            color: var(--text-tertiary);
            font-size: 12px;
          }

          @keyframes slideDown {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-down {
            animation: slideDown 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </>
  );
}
