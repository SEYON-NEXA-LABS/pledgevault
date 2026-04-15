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
} from 'lucide-react';
import { customerStore, loanStore } from '@/lib/store';
import { Customer } from '@/lib/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCustomers(customerStore.getAll());
  }, []);

  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  const filteredCustomers = customers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.aadhaar && c.aadhaar.includes(q))
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
              {filteredCustomers.map((customer) => {
                const customerLoans = loanStore.getByCustomer(customer.id);
                const activeCount = customerLoans.filter(l => l.status === 'active' || l.status === 'overdue').length;

                return (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                          {customer.name.charAt(0)}
                        </div>
                        <div className="customer-info">
                          <div className="name" style={{ fontSize: '15px' }}>{customer.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            ID: {customer.id.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                        <Phone size={14} style={{ color: 'var(--text-tertiary)' }} />
                        {customer.phone}
                      </div>
                      {customer.altPhone && (
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '20px' }}>
                          {customer.altPhone}
                        </div>
                      )}
                    </td>
                    <td>
                      {customer.aadhaar && (
                        <div style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>Aadhaar:</span> {customer.aadhaar}
                        </div>
                      )}
                      {customer.pan && (
                        <div style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>PAN:</span> {customer.pan}
                        </div>
                      )}
                      {!customer.aadhaar && !customer.pan && (
                        <span className="kyc-pending">KYC Pending</span>
                      )}
                      {(customer.aadhaar || customer.pan) && (
                        <span className="kyc-verified" style={{ marginTop: '4px' }}>Verified</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', maxWidth: '200px' }}>
                        <MapPin size={14} style={{ color: 'var(--text-tertiary)', marginTop: '2px', flexShrink: 0 }} />
                        <span>{customer.address}, {customer.city}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>
                          {customerLoans.length} total
                        </div>
                        {activeCount > 0 && (
                          <span className="badge active" style={{ width: 'fit-content' }}>
                            {activeCount} active
                          </span>
                        )}
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
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Users size={28} />
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
        </div>
      </div>
    </>
  );
}
