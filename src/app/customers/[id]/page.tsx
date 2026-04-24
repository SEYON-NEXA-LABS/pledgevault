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
  FileText
} from 'lucide-react';
import { customerStore, loanStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatDate, LOAN_STATUS_LABELS } from '@/lib/constants';
import { Customer, Loan } from '@/lib/types';
import Link from 'next/link';

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdPhoto, setSelectedIdPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomerDetails() {
      if (id) {
        try {
          const foundCustomer = await supabaseService.getCustomerWithDetails(id as string);
          if (foundCustomer) {
            setCustomer(foundCustomer);
            const customerLoans = await supabaseService.getLoansByCustomer(foundCustomer.id);
            setLoans(customerLoans as unknown as Loan[]);
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

  if (loading) {
    return <div className="page-content" style={{ textAlign: 'center', padding: '100px' }}>Loading customer profile...</div>;
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

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
  const closedLoans = loans.filter(l => l.status === 'closed');
  const totalLoanValue = activeLoans.reduce((sum, l) => sum + l.loanAmount, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <button onClick={() => router.back()} className="pv-btn pv-btn-outline" style={{ height: '36px', padding: '0 12px', fontSize: '13px', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              className="customer-avatar" 
              style={{ width: '80px', height: '80px', fontSize: '32px', cursor: customer.selfiePhoto ? 'pointer' : 'default', overflow: 'hidden', border: '3px solid var(--gold)' }}
              onClick={() => customer.selfiePhoto && setSelectedIdPhoto(customer.selfiePhoto)}
            >
              {customer.selfiePhoto ? (
                <img src={customer.selfiePhoto} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                customer.name.charAt(0)
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '28px' }}>{customer.name}</h2>
              <p className="subtitle" style={{ color: 'var(--text-tertiary)' }}>Customer since {formatDate(customer.createdAt)}</p>
            </div>
          </div>
        </div>
        <div className="page-header-right">
          <Link href={`/loans/new?customerId=${customer.id}`} className="pv-btn pv-btn-gold">
            <Plus size={18} /> New Loan
          </Link>
        </div>
      </div>

      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="pv-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>Contact & KYC Details</h3>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-row">
                <Phone size={18} />
                <div>
                  <label>Primary Phone</label>
                  <div>{customer.phone}</div>
                </div>
              </div>
              {customer.altPhone && (
                <div className="info-row">
                  <Phone size={18} />
                  <div>
                    <label>Alternative Phone</label>
                    <div>{customer.altPhone}</div>
                  </div>
                </div>
              )}
              <div className="info-row">
                <MapPin size={18} />
                <div>
                  <label>Address</label>
                  <div>{customer.address}, {customer.city}</div>
                </div>
              </div>
              <div className="info-row" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '8px', display: 'flex', gap: '12px' }}>
                <ShieldCheck size={18} color="var(--status-active)" />
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>{customer.primaryIdType?.toUpperCase() || 'PRIMARY ID'} (Mandatory)</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{customer.primaryIdNumber || <span style={{ color: 'var(--status-overdue)' }}>Pending</span>}</div>
                    {customer.primaryIdPhoto && (
                      <button 
                        className="pv-btn pv-btn-outline" 
                        onClick={() => setSelectedIdPhoto(customer.primaryIdPhoto!)}
                        style={{ height: '32px', padding: '0 8px', fontSize: '12px' }}
                      >
                        <Camera size={14} /> View
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="info-row" style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <ShieldCheck size={18} color={customer.secondaryIdNumber ? 'var(--status-active)' : 'var(--text-tertiary)'} />
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>{customer.secondaryIdType?.toUpperCase() || 'SECONDARY ID'} (Elective)</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{customer.secondaryIdNumber || <span style={{ color: 'var(--text-tertiary)' }}>Not Provided</span>}</div>
                    {customer.secondaryIdPhoto && (
                      <button 
                        className="pv-btn pv-btn-outline" 
                        onClick={() => setSelectedIdPhoto(customer.secondaryIdPhoto!)}
                        style={{ height: '32px', padding: '0 8px', fontSize: '12px' }}
                      >
                        <Camera size={14} /> View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pv-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>Loan Summary</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="stat-box">
                <span>Active Loans</span>
                <h4>{activeLoans.length}</h4>
              </div>
              <div className="stat-box">
                <span>Total Active Debt</span>
                <h4>{formatCurrency(totalLoanValue)}</h4>
              </div>
              <div className="stat-box">
                <span>Closed Loans</span>
                <h4>{closedLoans.length}</h4>
              </div>
              <div className="stat-box">
                <span>Gold/Silver Items</span>
                <h4>{loans.reduce((sum, l) => sum + l.items.length, 0)}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pv-card" style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><History size={18} /> Loan History</h3>
        </div>
        <div className="card-body no-padding">
          {loans.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan #</th>
                  <th>Start Date</th>
                  <th>Amount</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loans.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((loan) => (
                  <tr key={loan.id}>
                    <td><span style={{ fontWeight: 700 }}>{loan.loanNumber}</span></td>
                    <td>{formatDate(loan.startDate)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(loan.loanAmount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {loan.items.slice(0, 2).map(i => (
                          <span key={i.id} className={`badge ${i.metalType}`} style={{ fontSize: '10px' }}>{i.itemType}</span>
                        ))}
                        {loan.items.length > 2 && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>+{loan.items.length - 2}</span>}
                      </div>
                    </td>
                    <td><span className={`badge ${loan.status}`}>{LOAN_STATUS_LABELS[loan.status]}</span></td>
                    <td>{formatDate(loan.dueDate)}</td>
                    <td>
                      <Link href={`/loans/${loan.id}`} className="pv-btn pv-btn-outline" style={{ height: '32px', width: '32px', padding: 0 }}>
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <HandCoins size={40} color="var(--text-tertiary)" style={{ marginBottom: '12px' }} />
              <h3>No loans found for this customer</h3>
              <p>Create a new pledge loan to start tracking.</p>
            </div>
          )}
        </div>
      </div>

      {/* ID Photo Lightbox */}
      {selectedIdPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedIdPhoto(null)} style={{ zIndex: 2000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div 
            style={{ 
              position: 'relative', 
              maxWidth: '90vw', 
              maxHeight: '90vh', 
              background: '#fff', 
              borderRadius: 'var(--radius-lg)', 
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedIdPhoto(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            <img src={selectedIdPhoto} alt="Identification Document" style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }} />
            <div style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#1A3C34' }}>
              Identification Document Verification
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
