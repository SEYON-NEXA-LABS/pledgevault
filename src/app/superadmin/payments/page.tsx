'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  CreditCard, 
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Info,
  Clock,
  CheckCircle,
  Building
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatDate } from '@/lib/constants';

interface SubscriptionWithFirm {
  id: string;
  firmId: string;
  planId: string;
  interval: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  extensionCount: number;
  startDate: string;
  endDate: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  firms?: {
    name: string;
  };
}

const ITEMS_PER_PAGE = 10;

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL state management
  const pageParam = Number(searchParams.get('page')) || 1;
  const searchParam = searchParams.get('search') || '';

  const [subscriptions, setSubscriptions] = useState<SubscriptionWithFirm[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParam);
  const [selectedSub, setSelectedSub] = useState<SubscriptionWithFirm | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [pageParam, searchParam]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { subscriptions: data, totalCount: count } = await supabaseService.getAllSubscriptionsPaginated(
        pageParam,
        ITEMS_PER_PAGE,
        searchParam
      );
      setSubscriptions(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(1, searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateUrl(1, '');
  };

  const updateUrl = (newPage: number, searchVal: string) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set('page', newPage.toString());
    if (searchVal) params.set('search', searchVal);
    router.push(`/superadmin/payments?${params.toString()}`);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const getStatusBadgeStyles = (status: string) => {
    const norm = (status || '').toLowerCase();
    if (norm === 'active' || norm === 'trial') {
      return { background: 'var(--status-active-bg)', color: 'var(--status-active)' };
    }
    if (norm === 'expired' || norm === 'past_due') {
      return { background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)' };
    }
    return { background: 'var(--bg-primary)', color: 'var(--text-secondary)' };
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <div className="page-header-left">
          <Link 
            href="/superadmin" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: 'var(--text-tertiary)', 
              fontSize: '13px', 
              textDecoration: 'none', 
              marginBottom: '8px', 
              fontWeight: 600 
            }}
          >
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 style={{ fontSize: '32px' }}>System Transactions</h1>
        </div>
        <div className="page-header-right">
          <button 
            className="pv-btn pv-btn-outline" 
            onClick={fetchPayments} 
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="pv-card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-tertiary)' 
              }} 
            />
            <input 
              className="pv-input"
              style={{ paddingLeft: '40px', height: '42px' }}
              placeholder="Search by business name, payment ID, order ID, or method..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="pv-btn pv-btn-primary" style={{ height: '42px' }}>
            Filter
          </button>
          {searchParam && (
            <button 
              type="button" 
              className="pv-btn pv-btn-ghost" 
              onClick={handleClearSearch}
              style={{ height: '42px' }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Payments Table */}
      <div className="pv-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
            <RefreshCw className="spin" size={24} style={{ marginBottom: '12px' }} />
            <div>Fetching transaction records...</div>
          </div>
        ) : (
          <>
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Business Name</th>
                  <th>Plan Tier</th>
                  <th>Interval</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Transaction Reference</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
                      No payments found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const badgeStyle = getStatusBadgeStyles(sub.status);
                    return (
                      <tr key={sub.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedSub(sub)}>
                        <td>{formatDate(sub.createdAt)}</td>
                        <td>
                          <div style={{ fontWeight: 800 }}>{sub.firms?.name || 'Unknown Business'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{sub.firmId.slice(0, 8).toUpperCase()}</div>
                        </td>
                        <td>
                          <span className={`badge ${sub.planId || 'free'}`}>
                            {(sub.planId || 'FREE').toUpperCase()}
                          </span>
                        </td>
                        <td>{sub.interval === 'yearly' ? 'Yearly' : 'Monthly'}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(sub.amount)}</td>
                        <td>{(sub.paymentMethod || 'OTHER').toUpperCase()}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {sub.razorpayPaymentId ? (
                            <span title={`Order: ${sub.razorpayOrderId}`}>
                              {sub.razorpayPaymentId}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span 
                            className="pv-badge" 
                            style={{ 
                              background: badgeStyle.background, 
                              color: badgeStyle.color, 
                              fontWeight: 800 
                            }}
                          >
                            {(sub.status || 'ACTIVE').toUpperCase()}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="pv-btn pv-btn-outline pv-btn-sm" 
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedSub(sub)}
                          >
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 32px', 
                  borderTop: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.01)'
                }}
              >
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  Showing {subscriptions.length} of {totalCount} records
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button 
                    className="pv-btn pv-btn-outline pv-btn-sm" 
                    disabled={pageParam <= 1}
                    onClick={() => updateUrl(pageParam - 1, searchParam)}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 800 }}>
                    Page {pageParam} of {totalPages}
                  </span>
                  <button 
                    className="pv-btn pv-btn-outline pv-btn-sm" 
                    disabled={pageParam >= totalPages}
                    onClick={() => updateUrl(pageParam + 1, searchParam)}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction View Details Modal */}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div 
            className="pv-card" 
            style={{ 
              width: '600px', 
              padding: '36px', 
              background: 'var(--brand-deep)', 
              color: 'white', 
              position: 'relative',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)' 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: 'rgba(255,255,255,0.08)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--gold)' 
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Transaction Details</h2>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    Receipt Ref: {selectedSub.id.slice(0, 18)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSub(null)} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  fontSize: '28px', 
                  cursor: 'pointer', 
                  color: 'var(--text-secondary)',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '6px' }}>
                  Business Subscriber
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px' }}>
                  <Building size={16} style={{ color: 'var(--brand-vibrant)' }} />
                  {selectedSub.firms?.name || 'Unknown Business'}
                </div>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', fontFamily: 'monospace' }}>
                  UUID: {selectedSub.firmId}
                </span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '6px' }}>
                  Amount Paid
                </span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--gold)' }}>
                  {formatCurrency(selectedSub.amount)}
                </div>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Billing Mode: {selectedSub.interval === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Plan Tier Requested</span>
                <span className={`badge ${selectedSub.planId || 'free'}`} style={{ fontWeight: 800 }}>
                  {(selectedSub.planId || 'FREE').toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Activation Date</span>
                <span style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {formatDate(selectedSub.startDate)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Billing Cycle Expiration</span>
                <span style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {formatDate(selectedSub.endDate)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Payment Gateway Method</span>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>
                  {(selectedSub.paymentMethod || 'CASH').toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Transaction Status</span>
                <span 
                  className="pv-badge" 
                  style={{ 
                    background: getStatusBadgeStyles(selectedSub.status).background, 
                    color: getStatusBadgeStyles(selectedSub.status).color,
                    fontWeight: 800,
                    padding: '2px 8px',
                    fontSize: '10px'
                  }}
                >
                  {(selectedSub.status || 'ACTIVE').toUpperCase()}
                </span>
              </div>

              {selectedSub.razorpayPaymentId && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Razorpay Payment ID</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand-vibrant)' }}>
                      {selectedSub.razorpayPaymentId}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Razorpay Order ID</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>
                      {selectedSub.razorpayOrderId}
                    </span>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Manual Extensions Granted</span>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>
                  {selectedSub.extensionCount || 0} times
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="pv-btn pv-btn-gold" 
                style={{ minWidth: '100px' }}
                onClick={() => setSelectedSub(null)}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuperadminPayments() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20 text-muted-foreground">
        <RefreshCw className="spin mr-2" size={20} />
        <span className="font-bold uppercase tracking-wider text-xs">Loading Payment Ledger...</span>
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
