'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  CircleDollarSign, 
  Clock, 
  FileText, 
  History, 
  Info, 
  Plus, 
  QrCode, 
  Scale, 
  User, 
  X,
  CheckCircle2,
  AlertCircle,
  Printer,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { loanStore, paymentStore, customerStore, settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { 
  formatCurrency, 
  formatWeight, 
  formatDate, 
  getDaysOverdue, 
  LOAN_STATUS_LABELS 
} from '@/lib/constants';
import { calculateAccruedInterestFromDates } from '@/lib/interest';
import { Loan, Payment, Customer, ShopSettings } from '@/lib/types';
import Link from 'next/link';
import ReceiptContent from '@/components/printing/ReceiptContent';

export default function LoanDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [receiptType, setReceiptType] = useState<'modern' | 'thermal'>('modern');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'interest' | 'principal' | 'full_closure' | 'partial'>('partial');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [liveInterest, setLiveInterest] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      if (id) {
        try {
          const foundLoan = await supabaseService.getLoanWithDetails(id as string);
          if (foundLoan) {
            setLoan(foundLoan);
            setCustomer(await supabaseService.getCustomerWithDetails(foundLoan.customerId));
            setPayments(await supabaseService.getPayments(foundLoan.id));
            setSettings(settingsStore.get());
            
            // Calculate real-time interest
            const accrued = calculateAccruedInterestFromDates(foundLoan.startDate, foundLoan.interestMode, {
              principal: foundLoan.loanAmount,
              monthlyRate: foundLoan.interestRate,
              totalPaid: foundLoan.amountPaid || 0,
            });
            setLiveInterest(accrued);
          }
        } catch (err) {
          console.error("Error fetching loan details:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) {
    return <div className="page-content" style={{ textAlign: 'center', padding: '100px' }}>Loading loan details...</div>;
  }

  if (!loan) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <AlertCircle size={48} color="var(--status-overdue)" />
          <h2>Loan Not Found</h2>
          <p>The loan record you are looking for does not exist or has been removed.</p>
          <Link href="/loans" className="btn btn-primary">Back to Loans</Link>
        </div>
      </div>
    );
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await supabaseService.createPayment({
        loanId: loan!.id,
        branchId: settings?.activeBranchId || undefined,
        amount,
        type: paymentType as Payment['type'],
        remarks: paymentRemarks,
        paymentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      // Update loan state directly via direct query if possible, or trigger a full refetch
      // For now, the user wants fully reliable Live queries:
      
      const updatedAmountPaid = (loan!.amountPaid || 0) + amount;
      const isFullClosure = paymentType === 'full_closure' || (updatedAmountPaid >= (loan!.loanAmount + (loan!.interestAccrued || 0)));
      
      // Update its status
      if (isFullClosure) {
        await supabaseService.updateLoanStatus(loan!.id, 'closed');
        // Ideally we'd have a supabaseService.updateLoan() for amountPaid too, but for now we are relying on recalculating.
        // Let's refetch it fully.
      }

      const updatedLoan = await supabaseService.getLoanWithDetails(loan!.id);
      setLoan(updatedLoan);
      setPayments(await supabaseService.getPayments(loan!.id));
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentRemarks('');
    } catch(err) {
      console.error(err);
      alert('Failed to record payment');
    }
  };

  const goldItems = loan.items.filter(i => i.metalType === 'gold');
  const silverItems = loan.items.filter(i => i.metalType === 'silver');

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <button onClick={() => router.back()} className="btn btn-outline btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2>Loan #{loan.loanNumber}</h2>
            <span className={`badge ${loan.status}`}>{LOAN_STATUS_LABELS[loan.status]}</span>
          </div>
          <p className="subtitle">Started on {formatDate(loan.startDate)} • Due on {formatDate(loan.dueDate)}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline" onClick={() => setShowPrintModal(true)}>
            <Printer size={18} /> Print Receipt
          </button>
          {(loan.status === 'active' || loan.status === 'overdue') && (
            <button className="btn btn-gold" onClick={() => setShowPaymentModal(true)}>
              <Plus size={18} /> Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3><User size={18} /> Customer Information</h3>
            <Link href={`/customers?search=${loan.customerPhone}`} className="btn btn-sm btn-outline">View Profile</Link>
          </div>
          <div className="card-body">
            <div className="customer-cell" style={{ marginBottom: '20px' }}>
              <div className="customer-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                {loan.customerName.charAt(0)}
              </div>
              <div className="customer-info">
                <div className="name" style={{ fontSize: '18px' }}>{loan.customerName}</div>
                <div className="phone" style={{ fontSize: '14px' }}>{loan.customerPhone}</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="info-item">
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block' }}>{customer?.primaryIdType?.toUpperCase() || 'PRIMARY ID'}</label>
                <div style={{ fontWeight: 500 }}>{customer?.primaryIdNumber || 'Not Provided'}</div>
              </div>
              <div className="info-item">
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block' }}>{customer?.secondaryIdType?.toUpperCase() || 'SECONDARY ID'}</label>
                <div style={{ fontWeight: 500 }}>{customer?.secondaryIdNumber || 'Not Provided'}</div>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block' }}>Address</label>
                <div style={{ fontWeight: 500 }}>{customer?.address}, {customer?.city}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3><CircleDollarSign size={18} /> Loan Statistics</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="stat-box">
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Principal Amount</span>
                <h4 style={{ fontSize: '24px', fontWeight: 800 }}>{formatCurrency(loan.loanAmount)}</h4>
              </div>
              <div className="stat-box">
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Interest Rate</span>
                <h4 style={{ fontSize: '24px', fontWeight: 800 }}>{loan.interestRate}% <span style={{ fontSize: '14px', fontWeight: 500 }}>/ month</span></h4>
              </div>
              <div className="stat-box">
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Interest Accrued</span>
                <h4 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-overdue)' }}>{formatCurrency(liveInterest)}</h4>
              </div>
              <div className="stat-box">
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Paid</span>
                <h4 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-active)' }}>{formatCurrency(loan.amountPaid || 0)}</h4>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Balance to Close</span>
                <span style={{ fontWeight: 800, color: 'var(--sidebar-bg)' }}>{formatCurrency(loan.loanAmount + liveInterest - (loan.amountPaid || 0))}</span>
              </div>
              <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: 'var(--gold-gradient)', 
                    width: `${Math.min(100, ((loan.amountPaid || 0) / (loan.loanAmount + (loan.interestAccrued || 0))) * 100)}%` 
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3><Scale size={18} /> Pledged Items ({loan.items.length})</h3>
        </div>
        <div className="card-body no-padding">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Type</th>
                <th>Metal</th>
                <th>Purity</th>
                <th>Gross Weight</th>
                <th>Net Weight</th>
                <th>Valuation</th>
                <th>Photo</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loan.items.map((item) => (
                <tr key={item.id}>
                  <td><span style={{ fontWeight: 600 }}>{item.itemType}</span></td>
                  <td><span className={`badge ${item.metalType}`}>{item.metalType}</span></td>
                  <td>{item.purity} {item.metalType === 'gold' ? 'K' : ''}</td>
                  <td>{formatWeight(item.grossWeight)}</td>
                  <td><span style={{ color: 'var(--sidebar-bg)', fontWeight: 600 }}>{formatWeight(item.netWeight)}</span></td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(item.itemValue)}</td>
                  <td>
                    {item.photoBase64 ? (
                      <div 
                        onClick={() => setSelectedPhoto(item.photoBase64!)}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '6px', 
                          overflow: 'hidden', 
                          cursor: 'pointer',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <img src={item.photoBase64} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}><Camera size={14} /></span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{item.description || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-input)', fontWeight: 700 }}>
                <td colSpan={4}>TOTAL</td>
                <td>{formatWeight(loan.totalNetWeight)}</td>
                <td>{formatCurrency(loan.totalAppraisedValue)}</td>
                <td>LTV: {loan.ltvPercent}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3><History size={18} /> Payment History</h3>
        </div>
        <div className="card-body no-padding">
          {payments.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--status-active)' }}>+ {formatCurrency(payment.amount)}</td>
                    <td><span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>{payment.type.replace('_', ' ')}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{payment.remarks || '-'}</td>
                    <td><span style={{ color: 'var(--status-active)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> Received</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No payments recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '450px', maxWidth: '95%', animation: 'fadeInScale 0.3s ease' }}>
            <div className="card-header">
              <h3>Record New Payment</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="card-body">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Payment Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600 }}>₹</span>
                  <input 
                    type="number" 
                    className="input" 
                    style={{ width: '100%', padding: '10px 10px 10px 30px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Payment Type</label>
                <select 
                  className="input" 
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                >
                  <option value="partial">Partial Payment</option>
                  <option value="interest">Interest Only</option>
                  <option value="principal">Principal Only</option>
                  <option value="full_closure">Full Loan Closure</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Remarks</label>
                <textarea 
                  className="input" 
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', minHeight: '80px' }}
                  placeholder="e.g., Paid via UPI, received by Cash"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-gold" style={{ flex: 1 }}>Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && settings && customer && (
        <div className="modal-overlay print-modal-overlay">
          <div className="card print-modal-card" style={{ width: '800px', maxWidth: '95vh', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <h3>Receipt Print Preview</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={`btn btn-sm ${receiptType === 'modern' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setReceiptType('modern')}
                >
                  Modern (A5)
                </button>
                <button 
                  className={`btn btn-sm ${receiptType === 'thermal' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setReceiptType('thermal')}
                >
                  Thermal (80mm)
                </button>
                <button onClick={() => setShowPrintModal(false)} style={{ marginLeft: '12px' }}><X size={20} /></button>
              </div>
            </div>
            <div className="card-body" style={{ flex: 1, overflowY: 'auto', background: '#f5f5f0', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
              <div id="receipt-to-print">
                <ReceiptContent 
                  loan={loan} 
                  customer={customer} 
                  settings={settings} 
                  type={receiptType} 
                />
              </div>
            </div>
            <div className="card-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowPrintModal(false)} className="btn btn-outline">Close</button>
              <button 
                onClick={() => window.print()} 
                className="btn btn-gold"
              >
                <Printer size={18} /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)} style={{ zIndex: 2000 }}>
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
              onClick={() => setSelectedPhoto(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            <img src={selectedPhoto} alt="Item Preview" style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }} />
            <div style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#1A3C34' }}>
              Jewelry Item Verification Proof
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          zIndex: 1000;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-to-print, #receipt-to-print * {
            visibility: visible;
          }
          #receipt-to-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .modal-overlay, .card-header, .card-footer, .page-header, .content-grid, .card, .sidebar {
            display: none !important;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .stat-box {
          padding: 12px;
          border-left: 3px solid var(--gold);
          background: var(--bg-card-hover);
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }
        .info-item label {
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
}
