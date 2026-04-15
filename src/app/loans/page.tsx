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
import { loanStore } from '@/lib/store';
import { formatCurrency, formatWeight, formatDate, getDaysOverdue, LOAN_STATUS_LABELS } from '@/lib/constants';
import { Loan, LoanStatus } from '@/lib/types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Loans' },
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'closed', label: 'Closed' },
];

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoans(loanStore.getAll());
  }, []);

  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  const filteredLoans = loans
    .filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.loanNumber.toLowerCase().includes(q) ||
          l.customerName.toLowerCase().includes(q) ||
          l.customerPhone.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCloseLoan = (loanId: string) => {
    if (confirm('Are you sure you want to close this loan? This marks the pledge as redeemed.')) {
      loanStore.update(loanId, {
        status: 'closed' as LoanStatus,
        closedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLoans(loanStore.getAll());
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
        <div style={{ display: 'flex', gap: '6px' }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`btn btn-sm ${statusFilter === f.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

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
              {filteredLoans.map((loan) => {
                const goldWeight = loan.items
                  .filter((i) => i.metalType === 'gold')
                  .reduce((s, i) => s + i.netWeight, 0);
                const silverWeight = loan.items
                  .filter((i) => i.metalType === 'silver')
                  .reduce((s, i) => s + i.netWeight, 0);

                return (
                  <tr key={loan.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {loan.loanNumber}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {formatDate(loan.startDate)}
                      </div>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {loan.customerName.charAt(0)}
                        </div>
                        <div className="customer-info">
                          <div className="name">{loan.customerName}</div>
                          <div className="phone">{loan.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {loan.items.map((item) => (
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
                    <td style={{ fontWeight: 700 }}>{formatCurrency(loan.loanAmount)}</td>
                    <td>
                      <span style={{ fontSize: '13px' }}>
                        {loan.interestRate}%
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
                        {formatDate(loan.dueDate)}
                      </span>
                      {loan.status === 'overdue' && (
                        <div style={{ fontSize: '11px', color: 'var(--status-overdue)' }}>
                          {getDaysOverdue(loan.dueDate)}d overdue
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${loan.status}`}>
                        {LOAN_STATUS_LABELS[loan.status]}
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
                            onClick={() => handleCloseLoan(loan.id)}
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLoans.length === 0 && (
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
        </div>
      </div>
    </>
  );
}
