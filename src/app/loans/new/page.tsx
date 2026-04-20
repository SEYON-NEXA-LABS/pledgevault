'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  Calculator,
  Save,
  ArrowLeft,
  Gem,
  User,
  AlertCircle,
  Building2,
  FileText,
  CircleDollarSign,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { customerStore, loanStore, settingsStore } from '@/lib/store';
import { compressImage } from '@/lib/image';
import { GOLD_PURITY_MAP, SILVER_PURITY_MAP, ITEM_TYPES, INTEREST_MODE_LABELS, generateId, generateLoanNumber, formatCurrency, formatWeight } from '@/lib/constants';
import { calculateItemValue, calculateLoanAmount, calculateTotalWeight, calculateTotalValue } from '@/lib/gold';
import { calculateMonthlyInterestAmount, calculateMaturityAmount } from '@/lib/interest';
import { Customer, Loan, PledgeItem, MetalType, InterestMode, GoldPurity, SilverPurity, Subscription, PlanTier } from '@/lib/types';
import { canCreateLoan } from '@/lib/plans';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import Link from 'next/link';

interface ItemRow {
  id: string;
  metalType: MetalType;
  itemType: string;
  grossWeight: string;
  netWeight: string;
  purity: string;
  photoBase64?: string;
}

const emptyItem = (): ItemRow => ({
  id: generateId(),
  metalType: 'gold',
  itemType: 'chain',
  grossWeight: '',
  netWeight: '',
  purity: '916',
  photoBase64: '',
});

function NewLoanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [interestMode, setInterestMode] = useState<InterestMode>('flat');
  const [interestRate, setInterestRate] = useState('1.5');
  const [tenure, setTenure] = useState('6');
  const [ltvPercent, setLtvPercent] = useState('75');
  const [loanAmountOverride, setLoanAmountOverride] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loanCount, setLoanCount] = useState(0);
  const [enforcement, setEnforcement] = useState<{ allowed: boolean; reason?: string }>({ allowed: true });
  const [selectedBranchId, setSelectedBranchId] = useState('');
  
  // Manager Override state
  const [showManagerOverrideModal, setShowManagerOverrideModal] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const HIGH_VALUE_THRESHOLD = 500000; // 5 Lakhs

  const settings = typeof window !== 'undefined' ? settingsStore.get() : null;
  const isStaff = authStore.isStaff();
  const auth = authStore.get();
  const canOverrideInterest = isStaff ? (settings?.allowStaffOverridesInterest ?? true) : true;
  const canOverrideLtv = isStaff ? (settings?.allowStaffOverridesLtv ?? true) : true;

  useEffect(() => {
    setMounted(true);
    if (auth.firmId) {
      supabaseService.getCustomers(auth.firmId, 0, 1000).then(res => {
        setCustomers(res.data as Customer[]);
      }).catch(console.error);
    } else {
      setCustomers(customerStore.getAll());
    }
    
    const s = settingsStore.get();
    setInterestRate(s.defaultInterestRate.toString());
    setInterestMode(s.defaultInterestMode);
    setTenure(s.defaultTenure.toString());
    setLtvPercent(s.defaultLtvGold.toString());

    // Pre-select customer if ID provided in query
    const cid = searchParams.get('customerId');
    if (cid) {
      setSelectedCustomerId(cid);
    }
    
    // Fetch enforcement data
    fetchEnforcementData();
  }, [searchParams]);

  const fetchEnforcementData = async () => {
    const auth = authStore.get();
    if (!auth.firmId) return;

    try {
      // 1. Get active sub for end_date
      const sub = await supabaseService.getActiveSubscription(auth.firmId);
      setSubscription(sub);
      if (sub) {
        const isExpired = new Date(sub.endDate) < new Date();
      }

      // 2. Get current active loan count
      const count = await supabaseService.getActiveLoanCount(auth.firmId);
      setLoanCount(count);

      // 3. Check enforcement
      // Note: role and sub both affect whether a loan can be created
      const planTier: PlanTier = (auth as any).plan === 'elite' ? 'elite' : 'pro'; 
      const check = canCreateLoan(count, planTier, sub?.endDate);
      setEnforcement(check);
    } catch (err) {
      console.error('Enforcement check failed:', err);
    }
  };

  // Calculate item values
  const calculatedItems: (ItemRow & { value: number; rate: number })[] = items.map((item) => {
    const rate = item.metalType === 'gold'
      ? (settings?.goldRate24K || 7200)
      : (settings?.silverRate999 || 90);
    const value = item.netWeight
      ? calculateItemValue(parseFloat(item.netWeight) || 0, item.metalType, item.purity, rate)
      : 0;
    return { ...item, value, rate };
  });

  const totalWeight = calculatedItems.reduce(
    (s, i) => s + (parseFloat(i.netWeight) || 0),
    0
  );
  const totalValue = calculatedItems.reduce((s, i) => s + i.value, 0);
  const computedLoanAmount = calculateLoanAmount(totalValue, parseFloat(ltvPercent) || 75);
  const finalLoanAmount = loanAmountOverride
    ? parseFloat(loanAmountOverride)
    : computedLoanAmount;
  const monthlyInterest = calculateMonthlyInterestAmount(
    finalLoanAmount,
    parseFloat(interestRate) || 1.5
  );
  const maturityAmount = calculateMaturityAmount(
    finalLoanAmount,
    interestMode,
    parseFloat(interestRate) || 1.5,
    parseInt(tenure) || 6,
    totalWeight
  );

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-set netWeight to grossWeight if not manually changed
    if (field === 'grossWeight' && !updated[index].netWeight) {
      updated[index].netWeight = value;
    }

    // Reset purity when metal type changes
    if (field === 'metalType') {
      updated[index].purity = value === 'gold' ? '916' : '925';
    }

    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, emptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCapturePhoto = async (index: number) => {
    // In a real app, this would open a camera modal or file input. 
    // For this prototype, we'll use a file input to simulate capture.
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const rawBase64 = reader.result as string;
          // Jewelry needs more detail, so we use higher width/quality than IDs
          const optimizedBase64 = await compressImage(rawBase64, 1200, 0.7);
          const updated = [...items];
          updated[index].photoBase64 = optimizedBase64;
          setItems(updated);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch)
      )
    : customers;

  const handleSave = (bypassOverride = false) => {
    if (!enforcement.allowed) {
      alert(`Access Restricted: ${enforcement.reason === 'expired' ? 'Subscription Expired' : 'Plan Limit Exceeded'}`);
      return;
    }
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }
    if (!items.some((i) => parseFloat(i.netWeight) > 0)) {
      alert('Please add at least one item with weight');
      return;
    }
    
    // Check High Value Override
    const isManager = authStore.isManager() || authStore.isSuperadmin();
    if (!isManager && finalLoanAmount >= HIGH_VALUE_THRESHOLD && !bypassOverride) {
      setShowManagerOverrideModal(true);
      return;
    }

    setSaving(true);

    setSaving(true);
    const customer = customers.find((c) => c.id === selectedCustomerId)!;
    // Note: loanNumber is now auto-generated by the backend in supabaseService.createLoan

    const pledgeItems: PledgeItem[] = calculatedItems
      .filter((i) => parseFloat(i.netWeight) > 0)
      .map((i) => ({
        id: i.id,
        metalType: i.metalType,
        itemType: i.itemType as PledgeItem['itemType'],
        grossWeight: parseFloat(i.grossWeight) || 0,
        netWeight: parseFloat(i.netWeight) || 0,
        purity: i.purity as GoldPurity | SilverPurity,
        ratePerGram: i.rate,
        itemValue: i.value,
        photoBase64: i.photoBase64
      }));

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + (parseInt(tenure) || 6));

    const totalGross = pledgeItems.reduce((s, i) => s + i.grossWeight, 0);
    const totalNet = pledgeItems.reduce((s, i) => s + i.netWeight, 0);

    const s = settingsStore.get();
    const branchToUse = s.activeBranchId === 'firm' ? selectedBranchId : s.activeBranchId;

    if (!branchToUse) {
      alert('Please select a branch for this record');
      return;
    }
    
    const loanPayload: Omit<Loan, 'id'> = {
      loanNumber: '', // Backend overrides this
      firmId: auth.firmId,
      customerId: selectedCustomerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      branchId: branchToUse,
      items: pledgeItems,
      totalGrossWeight: totalGross,
      totalNetWeight: totalNet,
      totalAppraisedValue: totalValue,
      ltvPercent: parseFloat(ltvPercent) || 75,
      loanAmount: finalLoanAmount,
      interestMode,
      interestRate: parseFloat(interestRate) || 1.5,
      tenureMonths: parseInt(tenure) || 6,
      startDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'active',
      interestAccrued: 0,
      amountPaid: 0,
      remarks,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    } as any;

    supabaseService.createLoan(loanPayload).then(() => {
      // settingsStore.incrementLoanCounter(); // Handle offline fallback gracefully later if needed
      router.push('/loans');
    }).catch((err) => {
      console.error(err);
      alert('Failed to save loan to Supabase');
      setSaving(false);
    });
  };

  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <Link href="/loans" className="btn btn-ghost btn-sm" style={{ marginBottom: '4px' }}>
            <ArrowLeft size={16} /> Back to Loans
          </Link>
          <h2>Create New Loan</h2>
          <p className="subtitle">Enter pledge details and calculate loan amount</p>
        </div>

        {!enforcement.allowed && (
          <div className="enforcement-banner animate-pulse">
            <AlertCircle size={20} />
            <div>
              <div style={{ fontWeight: 700 }}>
                {enforcement.reason === 'expired' ? 'Subscription Expired' : 'Plan Limit Reached'}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                {enforcement.reason === 'expired' 
                  ? 'Your subscription and grace period have expired. Please renew to continue.' 
                  : `You have reached the limit of ${loanCount} loans for your current plan.`
                }
              </div>
            </div>
            <Link href="/settings" className="btn btn-sm btn-white" style={{ marginLeft: 'auto' }}>
              Upgrade Now
            </Link>
          </div>
        )}
      </div>

      <div className="loan-create-layout">
        {/* Left: Form */}
        <div>
          {/* Customer Selection */}
          <div className="form-card">
            <div className="form-card-title">
              <User size={20} /> Customer Details
            </div>

            {settings?.activeBranchId === 'firm' && (
              <div className="form-group" style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-gold-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-light)', animation: 'fadeIn 0.3s ease' }}>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--sidebar-bg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} /> Select Primary Branch
                </label>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                  You are currently in Global View. Please select which branch will hold this pledge record.
                </p>
                <select 
                  className="form-input" 
                  required 
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                >
                  <option value="">Choose a branch...</option>
                  {settings?.branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Select Customer</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name or phone..."
                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomerId('');
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                id="customer-search"
              />
              {showCustomerDropdown && !selectedCustomerId && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 10,
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background 0.1s',
                      }}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setCustomerSearch('');
                        setShowCustomerDropdown(false);
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'var(--bg-card-hover)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      <div className="customer-avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {c.phone}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                      No customers found.{' '}
                      <Link href="/customers/new" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                        Add new
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  padding: '12px 16px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Phone:</span>{' '}
                  <strong>{selectedCustomer.phone}</strong>
                </div>
                {selectedCustomer.primaryIdNumber && (
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>{selectedCustomer.primaryIdType.toUpperCase()}:</span>{' '}
                    <strong>{selectedCustomer.primaryIdNumber}</strong>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>City:</span>{' '}
                  <strong>{selectedCustomer.city}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Pledge Items */}
          <div className="form-card">
            <div className="form-card-title">
              <Gem size={20} /> Pledge Items
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>Metal</th>
                    <th>Type</th>
                    <th>Gross (g)</th>
                    <th>Net (g)</th>
                    <th>Purity</th>
                    <th>Value</th>
                    <th>Photo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <select
                          className="form-select"
                          value={item.metalType}
                          onChange={(e) =>
                            updateItem(index, 'metalType', e.target.value)
                          }
                          style={{ minWidth: '90px' }}
                        >
                          <option value="gold">🥇 Gold</option>
                          <option value="silver">🥈 Silver</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={item.itemType}
                          onChange={(e) =>
                            updateItem(index, 'itemType', e.target.value)
                          }
                          style={{ minWidth: '110px' }}
                        >
                          {ITEM_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={item.grossWeight}
                          onChange={(e) =>
                            updateItem(index, 'grossWeight', e.target.value)
                          }
                          step="0.01"
                          min="0"
                          style={{ width: '90px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={item.netWeight}
                          onChange={(e) =>
                            updateItem(index, 'netWeight', e.target.value)
                          }
                          step="0.01"
                          min="0"
                          style={{ width: '90px' }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={item.purity}
                          onChange={(e) =>
                            updateItem(index, 'purity', e.target.value)
                          }
                          style={{ minWidth: '130px' }}
                        >
                          {item.metalType === 'gold'
                            ? Object.entries(GOLD_PURITY_MAP).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v.label}
                                </option>
                              ))
                            : Object.entries(SILVER_PURITY_MAP).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v.label}
                                </option>
                              ))}
                        </select>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: item.metalType === 'gold' ? 'var(--gold-dark)' : 'var(--silver-dark)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.value > 0 ? formatCurrency(item.value) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-ghost"
                          onClick={() => handleCapturePhoto(index)}
                          title="Capture/Upload Item Photo"
                          style={{ padding: '6px', minWidth: 'auto', color: item.photoBase64 ? 'var(--status-active)' : 'var(--text-tertiary)' }}
                        >
                          {item.photoBase64 ? <CheckCircle2 size={16} /> : <Camera size={16} />}
                        </button>
                      </td>
                      <td>
                        <button
                          className="remove-btn"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          title="Remove item"
                          style={{
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                            color: items.length === 1 ? 'var(--border)' : 'var(--text-tertiary)',
                            cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="btn btn-outline btn-sm"
              onClick={addItem}
              style={{ marginTop: '12px' }}
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          {/* Loan Terms */}
          <div className="form-card">
            <div className="form-card-title">
              <CircleDollarSign size={20} /> Loan Terms
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">LTV %</label>
                <input
                  type="number"
                  className="form-input"
                  value={ltvPercent}
                  onChange={(e) => setLtvPercent(e.target.value)}
                  min="0"
                  max="100"
                  disabled={!canOverrideLtv}
                  title={!canOverrideLtv ? "Managed by shop policy" : ""}
                />
                <span className="form-helper">
                  Auto loan: {formatCurrency(computedLoanAmount)}
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Loan Amount (₹) Override</label>
                <input
                  type="number"
                  className="form-input"
                  value={loanAmountOverride}
                  onChange={(e) => setLoanAmountOverride(e.target.value)}
                  placeholder={computedLoanAmount.toString()}
                />
                <span className="form-helper">Leave blank to use LTV calculation</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Interest Mode</label>
                <select
                  className="form-select"
                  value={interestMode}
                  onChange={(e) => setInterestMode(e.target.value as InterestMode)}
                >
                  {Object.entries(INTEREST_MODE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Interest Rate (% / month)</label>
                <input
                  type="number"
                  className="form-input"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  step="0.1"
                  min="0"
                  disabled={!canOverrideInterest}
                  title={!canOverrideInterest ? "Managed by shop policy" : ""}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tenure (months)</label>
                <input
                  type="number"
                  className="form-input"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  min="1"
                  max="60"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-input"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any additional notes about this loan..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Link href="/loans" className="btn btn-outline">
              Cancel
            </Link>
            <button 
              className="btn btn-gold" 
              onClick={() => handleSave()}
              disabled={saving || !enforcement.allowed}
              id="save-loan-btn"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Create Loan'}
            </button>
          </div>
        </div>

        {/* Right: Loan Summary */}
        <div className="loan-summary">
          <h3>
            <Calculator size={18} /> Loan Summary
          </h3>

          <div className="loan-summary-row">
            <span className="loan-summary-label">Total Items</span>
            <span className="loan-summary-value">{items.filter((i) => parseFloat(i.netWeight) > 0).length}</span>
          </div>
          <div className="loan-summary-row">
            <span className="loan-summary-label">Total Weight</span>
            <span className="loan-summary-value gold">{formatWeight(totalWeight)}</span>
          </div>
          <div className="loan-summary-row">
            <span className="loan-summary-label">Appraised Value</span>
            <span className="loan-summary-value">{formatCurrency(totalValue)}</span>
          </div>
          <div className="loan-summary-row">
            <span className="loan-summary-label">LTV ({ltvPercent}%)</span>
            <span className="loan-summary-value">{formatCurrency(computedLoanAmount)}</span>
          </div>

          <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

          <div className="loan-summary-row">
            <span className="loan-summary-label">Loan Amount</span>
            <span className="loan-summary-value gold" style={{ fontSize: '20px' }}>
              {formatCurrency(finalLoanAmount)}
            </span>
          </div>
          <div className="loan-summary-row">
            <span className="loan-summary-label">Monthly Interest</span>
            <span className="loan-summary-value">{formatCurrency(monthlyInterest)}</span>
          </div>
          <div className="loan-summary-row">
            <span className="loan-summary-label">Interest Mode</span>
            <span className="loan-summary-value" style={{ fontSize: '13px' }}>
              {INTEREST_MODE_LABELS[interestMode]}
            </span>
          </div>

          <div className="loan-summary-total">
            <div className="loan-summary-row">
              <span className="loan-summary-label">Maturity Amount</span>
              <span className="loan-summary-value" style={{ fontSize: '22px', color: '#E8C973' }}>
                {formatCurrency(maturityAmount)}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              background: 'rgba(212, 168, 67, 0.15)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              color: '#E8C973',
              lineHeight: 1.5,
            }}
          >
            💡 Gold Rate: {formatCurrency(settings?.goldRate24K || 7200)}/g (24K) •
            Silver Rate: {formatCurrency(settings?.silverRate999 || 90)}/g (999)
          </div>
        </div>
      </div>

      {showManagerOverrideModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '400px', maxWidth: '95%', animation: 'fadeInScale 0.3s ease' }}>
            <div className="card-header" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20} /> <h3 style={{ color: 'var(--status-overdue)' }}>Manager Override Required</h3></div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                This loan amount ({formatCurrency(finalLoanAmount)}) exceeds the staff limit of {formatCurrency(HIGH_VALUE_THRESHOLD)}. A manager's 4-digit PIN is required to proceed.
              </p>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Manager PIN</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (e.g. 1234)"
                  maxLength={4}
                  autoFocus
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowManagerOverrideModal(false)}>Cancel</button>
                <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => {
                  if (managerPin === '1234') {
                    setShowManagerOverrideModal(false);
                    handleSave(true);
                  } else {
                    alert('Invalid PIN!');
                  }
                }}>Authorize</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .enforcement-banner {
          background: #dc3545;
          color: #fff;
          padding: 16px 24px;
          border-radius: 12px;
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .btn-white {
          background: #fff;
          color: #dc3545;
          border: none;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </>
  );
}

export default function NewLoanPage() {
  return (
    <Suspense fallback={<div className="page-content">Loading...</div>}>
      <NewLoanContent />
    </Suspense>
  );
}
