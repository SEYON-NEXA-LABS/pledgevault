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
  Image as ImageIcon,
  Phone,
  MessageCircle,
  RefreshCw,
  MessageSquare
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
  const [currentRates, setCurrentRates] = useState<{gold: number, silver: number} | null>(null);
  const [printRemarks, setPrintRemarks] = useState('');

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

            // Fetch live rates for equity analysis
            const rates = await supabaseService.getLatestMarketRates();
            if (rates) {
              setCurrentRates({
                gold: rates.gold_24k || 0,
                silver: rates.silver || 0
              });
            }
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
          <button onClick={() => router.back()} className="pv-btn pv-btn-outline" style={{ height: '36px', padding: '0 12px', fontSize: '13px', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '28px' }}>Loan #{loan.loanNumber}</h2>
            <span className={`badge ${loan.status}`}>{LOAN_STATUS_LABELS[loan.status]}</span>
          </div>
          <p className="subtitle" style={{ color: 'var(--text-tertiary)' }}>Started on {formatDate(loan.startDate)} • Due on {formatDate(loan.dueDate)}</p>
        </div>
        <div className="page-header-right">
          <button className="pv-btn pv-btn-outline" onClick={() => setShowPrintModal(true)}>
            <Printer size={18} /> Print Receipt
          </button>
          {(loan.status === 'active' || loan.status === 'overdue') && (
            <button className="pv-btn pv-btn-gold" onClick={() => setShowPaymentModal(true)}>
              <Plus size={18} /> Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '24px' }}>
        {/* Column 1: Customer */}
        <div className="pv-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}><User size={18} /> Customer Info</h3>
            <Link href={`/customers?search=${loan.customerPhone}`} className="pv-btn pv-btn-outline" style={{ height: '32px', fontSize: '12px' }}>View Profile</Link>
          </div>
          <div className="card-body">
            <div className="customer-cell" style={{ marginBottom: '20px' }}>
              <div className="customer-avatar" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                {loan.customerName.charAt(0)}
              </div>
              <div className="customer-info">
                <div className="name" style={{ fontSize: '16px' }}>{loan.customerName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <div className="phone" style={{ fontSize: '13px' }}>{loan.customerPhone}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a 
                      href={`tel:${loan.customerPhone}`} 
                      className="pv-btn-icon" 
                      style={{ width: '22px', height: '22px', background: 'rgba(16, 123, 136, 0.1)', color: 'var(--brand-primary)' }}
                      title="Call"
                    >
                      <Phone size={12} />
                    </a>
                    <a 
                      href={`sms:${loan.customerPhone}?body=${encodeURIComponent(`Reminder: Your pledge ${loan.loanNumber} is due. Please contact us.`)}`} 
                      className="pv-btn-icon" 
                      style={{ width: '22px', height: '22px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                      title="SMS"
                    >
                      <MessageSquare size={12} />
                    </a>
                    <a 
                      href={`https://wa.me/${loan.customerPhone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="pv-btn-icon" 
                      style={{ width: '22px', height: '22px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                      title="WhatsApp"
                    >
                      <MessageCircle size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="info-item">
                <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }}>{customer?.primaryIdType?.toUpperCase() || 'ID'}</label>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{customer?.primaryIdNumber || 'Not Provided'}</div>
              </div>
              <div className="info-item">
                <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }}>Address</label>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{customer?.address || customer?.city}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Financials */}
        <div className="pv-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}><CircleDollarSign size={18} /> Loan Statistics</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="stat-box">
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Principal</span>
                <h4 style={{ fontSize: '18px', fontWeight: 800 }}>{formatCurrency(loan.loanAmount)}</h4>
              </div>
              <div className="stat-box">
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Rate</span>
                <h4 style={{ fontSize: '18px', fontWeight: 800 }}>{loan.interestRate}%</h4>
              </div>
              <div className="stat-box">
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Accrued</span>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-overdue)' }}>{formatCurrency(liveInterest)}</h4>
              </div>
              <div className="stat-box">
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Paid</span>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-active)' }}>{formatCurrency(loan.amountPaid || 0)}</h4>
              </div>
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px' }}>Balance to Close</span>
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--sidebar-bg)' }}>{formatCurrency(loan.loanAmount + liveInterest - (loan.amountPaid || 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Equity Analysis */}
        <div className="pv-card">
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}><Scale size={18} /> Equity Analysis</h3>
            {currentRates && (
              <span className="badge active" style={{ fontSize: '9px' }}>Live Market</span>
            )}
          </div>
          <div className="card-body">
            {currentRates ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="stat-box">
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Created Value</span>
                    <h4 style={{ fontSize: '18px', fontWeight: 800 }}>{formatCurrency(loan.totalAppraisedValue)}</h4>
                  </div>
                  <div className="stat-box" style={{ borderLeftColor: 'var(--status-active)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Current Value</span>
                    <h4 style={{ fontSize: '18px', fontWeight: 800 }}>
                      {formatCurrency(
                        loan.items.reduce((acc, item) => {
                          const rate = item.metalType === 'gold' ? currentRates.gold : currentRates.silver;
                          const adjustedRate = item.metalType === 'gold' ? (rate * (Number(item.purity) / 1000)) : rate;
                          return acc + (item.netWeight * adjustedRate);
                        }, 0)
                      )}
                    </h4>
                  </div>
                </div>
                
                {(() => {
                   const currentVal = loan.items.reduce((acc, item) => {
                     const rate = item.metalType === 'gold' ? currentRates.gold : currentRates.silver;
                     const adjustedRate = item.metalType === 'gold' ? (rate * (Number(item.purity) / 1000)) : rate;
                     return acc + (item.netWeight * adjustedRate);
                   }, 0);
                   const delta = currentVal - loan.totalAppraisedValue;
                   const ltvToday = (loan.loanAmount / currentVal) * 100;
                   
                   return (
                     <div style={{ marginTop: '16px', padding: '12px', borderRadius: '12px', background: delta >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${delta >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>Market Delta</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: delta >= 0 ? '#10b981' : '#ef4444' }}>
                            {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>LTV (Today)</span>
                          <span style={{ fontSize: '13px', fontWeight: 800 }}>
                            {ltvToday.toFixed(1)}% 
                            <span style={{ fontSize: '10px', fontWeight: 500, marginLeft: '6px', opacity: 0.5 }}>
                              ({(ltvToday - loan.ltvPercent).toFixed(1)}% shift)
                            </span>
                          </span>
                        </div>
                     </div>
                   );
                })()}
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
                <RefreshCw className="animate-spin mx-auto mb-2" size={20} />
                <p style={{ fontSize: '10px' }} className="font-bold uppercase">Updating Equity...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pv-card" style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><Scale size={18} /> Pledged Items ({loan.items.length})</h3>
        </div>
        <div className="card-body no-padding">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Type</th>
                <th>Metal</th>
                <th>Purity</th>
                <th>Weight (Net)</th>
                <th>Appraisal Rate</th>
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
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-primary">{formatWeight(item.netWeight)}</span>
                      <span className="text-[10px] text-muted-foreground opacity-40 font-bold">Gross: {formatWeight(item.grossWeight)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-xs font-black">{formatCurrency(item.ratePerGram || 0)}</span>
                      <span className="text-[9px] text-muted-foreground opacity-40 font-bold uppercase tracking-tighter">per gram</span>
                    </div>
                  </td>
                  <td className="font-black text-sm">{formatCurrency(item.itemValue)}</td>
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

      <div className="pv-card" style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><History size={18} /> Payment History</h3>
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
          <div className="pv-card" style={{ width: '450px', maxWidth: '95%', animation: 'fadeInScale 0.3s ease', padding: 0, overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Record New Payment</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRecordPayment} style={{ padding: '24px' }}>
              <div className="pv-input-group" style={{ marginBottom: '16px' }}>
                <label>Payment Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--brand-primary)' }}>₹</span>
                  <input 
                    type="number" 
                    className="pv-input" 
                    style={{ paddingLeft: '32px' }}
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="pv-input-group" style={{ marginBottom: '16px' }}>
                <label>Payment Type</label>
                <select 
                  className="pv-input" 
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                >
                  <option value="partial">Partial Payment</option>
                  <option value="interest">Interest Only</option>
                  <option value="principal">Principal Only</option>
                  <option value="full_closure">Full Loan Closure</option>
                </select>
              </div>
              <div className="pv-input-group" style={{ marginBottom: '24px' }}>
                <label>Remarks</label>
                <textarea 
                  className="pv-input" 
                  style={{ minHeight: '80px', padding: '12px 16px', height: 'auto' }}
                  placeholder="e.g., Paid via UPI"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="pv-btn pv-btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-gold" style={{ flex: 1 }}>Confirm Payment</button>
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
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', background: '#fff' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Add Custom Note to Receipt (Optional)</label>
              <textarea 
                className="pv-input"
                style={{ minHeight: '50px', fontSize: '13px', background: 'var(--bg-input)' }}
                placeholder="e.g. Special appraisal note, payment reference, etc."
                value={printRemarks}
                onChange={(e) => setPrintRemarks(e.target.value)}
              />
            </div>
            <div className="card-body" style={{ flex: 1, overflowY: 'auto', background: '#f5f5f0', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
              <div id="receipt-to-print">
                <ReceiptContent 
                  loan={loan} 
                  customer={customer} 
                  settings={settings} 
                  type={receiptType} 
                  remarks={printRemarks}
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
