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
  CheckCircle2,
  Lock,
  UserCheck,
  UserPlus,
  RefreshCcw,
  Search,
  X,
  Maximize2,
  Image as ImageIcon
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
import RealTimeRateSync from '@/components/common/RealTimeRateSync';

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

interface WeightInputProps {
  value: string;
  onChange: (val: string) => void;
  onStep: (delta: number) => void;
  metalType: MetalType;
  placeholder?: string;
  isWarning?: boolean;
}

const WeightInput = ({ value, onChange, onStep, metalType, placeholder, isWarning }: WeightInputProps) => {
  const [showQuickPicks, setShowQuickPicks] = useState(false);
  const goldPresets = ['1.00', '2.00', '4.00', '8.00'];
  const silverPresets = ['10.00', '50.00', '100.00', '500.00'];
  const presets = metalType === 'gold' ? goldPresets : silverPresets;

  return (
    <div className="weight-input-container" style={{ 
      borderColor: isWarning ? '#f59e0b' : '',
      background: isWarning ? '#fffbeb' : ''
    }}>
      <button className="weight-stepper" onClick={() => onStep(-0.01)}>−</button>
      <input
        type="text"
        className="weight-input-naked"
        placeholder={placeholder || "0.00"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowQuickPicks(true)}
        onBlur={() => setTimeout(() => setShowQuickPicks(false), 200)}
      />
      <button className="weight-stepper" onClick={() => onStep(0.01)}>+</button>
      
      {showQuickPicks && (
        <div className="quick-pick-container">
          {presets.map(p => (
            <div key={p} className="quick-pick-tag" onClick={() => onChange(p)}>
              {parseFloat(p)}g
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loanCount, setLoanCount] = useState(0);
  const [enforcement, setEnforcement] = useState<{ allowed: boolean; reason?: string }>({ allowed: true });
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [goldRate, setGoldRate] = useState(7200);
  const [silverRate, setSilverRate] = useState(90);
  
  // Payout Stage state
  const [isPayoutStage, setIsPayoutStage] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'cash' | 'bank' | 'upi'>('cash');
  const [payoutReference, setPayoutReference] = useState('');
  
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
    
    // Close photo menu on click outside
    const handleClickOutside = () => setActiveMenuIndex(null);
    window.addEventListener('click', handleClickOutside);
    
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
    setGoldRate(s.goldRate24K || 7200);
    setSilverRate(s.silverRate999 || 90);

    // Initialize branch selection
    if (authStore.isStaff() && s.activeBranchId && s.activeBranchId !== 'firm') {
      setSelectedBranchId(s.activeBranchId);
    } else {
      setSelectedBranchId('');
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
    const rate = item.metalType === 'gold' ? goldRate : silverRate;
    
    // Safety Guard: If Net > Gross, it's a data entry error. Zero out value.
    const isInvalid = (parseFloat(item.netWeight) || 0) > (parseFloat(item.grossWeight) || 0);
    
    const value = (item.netWeight && !isInvalid)
      ? calculateItemValue(parseFloat(item.netWeight) || 0, item.metalType, item.purity, rate)
      : 0;
    return { ...item, value: value || 0, rate };
  });

  const totalWeight = calculatedItems.reduce(
    (s, i) => s + (parseFloat(i.netWeight) || 0),
    0
  );
  
  const totalGrossWeight = calculatedItems.reduce(
    (s, i) => s + (parseFloat(i.grossWeight) || 0),
    0
  );
  
  // Breakdown calculations
  const goldItems = calculatedItems.filter(i => i.metalType === 'gold');
  const silverItems = calculatedItems.filter(i => i.metalType === 'silver');
  
  const goldWeight = goldItems.reduce((s, i) => s + (parseFloat(i.netWeight) || 0), 0);
  const silverWeight = silverItems.reduce((s, i) => s + (parseFloat(i.netWeight) || 0), 0);
  const goldValue = goldItems.reduce((s, i) => s + i.value, 0);
  const silverValue = silverItems.reduce((s, i) => s + i.value, 0);
  
  const hasGold = goldItems.some(i => parseFloat(i.netWeight) > 0);
  const hasSilver = silverItems.some(i => parseFloat(i.netWeight) > 0);
  const isMixed = hasGold && hasSilver;

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

  const sanitizeWeight = (val: string, max = 5000): string => {
    // Keep only numbers and one decimal point
    let sanitized = val.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) sanitized = parts[0] + '.' + parts.slice(1).join('');
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      sanitized = parts[0] + '.' + parts[1].slice(0, 2);
    }

    const num = parseFloat(sanitized);
    if (!isNaN(num) && num > max) return max.toString();
    return sanitized;
  };

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    const updated = [...items];
    let finalValue = value;

    if (field === 'grossWeight' || field === 'netWeight') {
      finalValue = sanitizeWeight(value);
    }

    updated[index] = { ...updated[index], [field]: finalValue };

    // Auto-set netWeight to grossWeight if not manually changed
    if (field === 'grossWeight' && !updated[index].netWeight) {
      updated[index].netWeight = finalValue;
    }

    // Reset purity when metal type changes
    if (field === 'metalType') {
      updated[index].purity = finalValue === 'gold' ? '916' : '925';
    }

    setItems(updated);
  };

  const handleStepChange = (index: number, field: 'grossWeight' | 'netWeight', delta: number) => {
    const current = parseFloat(items[index][field]) || 0;
    const newVal = Math.max(0, current + delta).toFixed(2);
    updateItem(index, field, newVal);
  };

  const addItem = () => {
    setItems([...items, emptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const processPhoto = async (index: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      const optimizedBase64 = await compressImage(rawBase64, 1200, 0.7);
      const updated = [...items];
      updated[index].photoBase64 = optimizedBase64;
      setItems(updated);
    };
    reader.readAsDataURL(file);
  };

  const triggerPhotoSource = (index: number, source: 'camera' | 'gallery') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.capture = 'environment';
    input.onchange = (e: any) => processPhoto(index, e.target.files[0]);
    input.click();
    setActiveMenuIndex(null);
  };

  const handleCapturePhoto = (index: number) => {
    setActiveMenuIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragIndex(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processPhoto(index, file);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch)
      )
    : customers;

  const handleReviewQuote = () => {
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

    // Hard Regulatory Block: LTV > 85%
    if (parseFloat(ltvPercent) > 85) {
      alert('Regulatory Block: LTV cannot exceed 85% (RBI Safety Cap). Please adjust the loan terms.');
      return;
    }
    
    // Check High Value Override
    const computedAmount = loanAmountOverride ? parseFloat(loanAmountOverride) : computedLoanAmount;
    const isManager = authStore.isManager() || authStore.isSuperadmin();
    if (!isManager && computedAmount >= HIGH_VALUE_THRESHOLD) {
      setShowManagerOverrideModal(true);
      return;
    }

    setIsPayoutStage(true);
  };

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

    // Hard Regulatory Block: LTV > 85%
    if (parseFloat(ltvPercent) > 85) {
      alert('Regulatory Block: LTV cannot exceed 85% (RBI Safety Cap). Please adjust the loan terms.');
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
      payoutMethod,
      payoutReference,
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

            {authStore.isManager() && (
              <div className="form-group" style={{ marginBottom: '24px', padding: '16px', background: 'var(--status-active-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-primary)', animation: 'fadeIn 0.3s ease' }}>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} /> Select Primary Branch
                </label>
                <p style={{ fontSize: '13px', color: 'var(--brand-deep)', marginBottom: '12px', opacity: 0.8 }}>
                  Please confirm which branch is receiving this pledge and holding the cash.
                </p>
                <select 
                  className="form-input" 
                  required 
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  style={{ 
                    border: !selectedBranchId ? '2px solid var(--brand-primary)' : '1px solid var(--border)',
                    background: 'white'
                  }}
                >
                  <option value="">-- Choose Branch --</option>
                  {settings?.branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Select Customer</label>
              {!selectedCustomer ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search by name or phone..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      id="customer-search"
                      style={{ paddingLeft: '40px' }}
                    />
                    <Search 
                      size={18} 
                      style={{ 
                        position: 'absolute', 
                        left: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--text-tertiary)' 
                      }} 
                    />
                  </div>

                  {showCustomerDropdown && customerSearch.length >= 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--brand-primary)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 100,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        marginTop: '4px',
                        animation: 'fadeIn 0.2s ease'
                      }}
                    >
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              borderBottom: '1px solid var(--border-light)',
                              transition: 'background 0.1s',
                            }}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerSearch('');
                              setShowCustomerDropdown(false);
                            }}
                          >
                            <div className="customer-avatar" style={{ width: '32px', height: '32px', background: 'var(--status-active-bg)', color: 'var(--brand-deep)' }}>
                              {c.name.charAt(0)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                                {customerSearch ? c.name.split(new RegExp(`(${customerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) => 
                                  part.toLowerCase() === customerSearch.toLowerCase() 
                                    ? <span key={i} className="search-highlight">{part}</span> 
                                    : part
                                ) : c.name}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {c.phone} • {c.city}
                              </div>
                            </div>
                            <UserCheck size={16} style={{ color: 'var(--brand-primary)', opacity: 0.5 }} />
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '12px' }}>No matches for "{customerSearch}"</p>
                          <Link href="/customers/new" className="btn btn-sm btn-outline" style={{ borderStyle: 'dashed' }}>
                            <UserPlus size={14} /> Add New Customer
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="customer-profile-card">
                  <div className="customer-avatar" style={{ width: '56px', height: '56px', fontSize: '20px', background: 'var(--brand-primary)', color: 'white', boxShadow: 'var(--shadow-brand)' }}>
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--brand-deep)' }}>{selectedCustomer.name}</h4>
                      <span style={{ 
                        padding: '2px 8px', 
                        background: 'var(--status-active-bg)', 
                        color: 'var(--brand-deep)', 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'uppercase'
                      }}>
                        Verified User
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <RefreshCcw size={12} /> {selectedCustomer.phone}
                      </span>
                      <span>{selectedCustomer.city}, {(selectedCustomer.primaryIdType || 'ID').toUpperCase()}: {selectedCustomer.primaryIdNumber}</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline" 
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerSearch('');
                    }}
                    style={{ background: 'white' }}
                  >
                    Change Customer
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Pledge Items */}
          <div className="form-card">
            <div className="form-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gem size={20} /> Pledge Items
              </div>
              <RealTimeRateSync 
                compact 
                onSync={(rates) => {
                  setGoldRate(rates.gold22k); // Syncing 22K specifically for loan valuation
                  setSilverRate(rates.silver);
                }} 
              />
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
                        <WeightInput
                          value={item.grossWeight}
                          onChange={(val) => updateItem(index, 'grossWeight', val)}
                          onStep={(delta) => handleStepChange(index, 'grossWeight', delta)}
                          metalType={item.metalType}
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <WeightInput
                          value={item.netWeight}
                          onChange={(val) => updateItem(index, 'netWeight', val)}
                          onStep={(delta) => handleStepChange(index, 'netWeight', delta)}
                          metalType={item.metalType}
                          placeholder="0.00"
                          isWarning={(parseFloat(item.netWeight) || 0) > (parseFloat(item.grossWeight) || 0)}
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
                        <div 
                          className={`photo-dropzone ${dragIndex === index ? 'active' : ''}`}
                          onDragOver={(e) => { e.preventDefault(); setDragIndex(index); }}
                          onDragLeave={() => setDragIndex(null)}
                          onDrop={(e) => handleDrop(e, index)}
                          onClick={() => !item.photoBase64 && handleCapturePhoto(index)}
                          style={{ position: 'relative' }}
                        >
                          {activeMenuIndex === index && !item.photoBase64 && (
                            <div className="photo-action-menu" onClick={e => e.stopPropagation()}>
                              <button className="action-option" onClick={() => triggerPhotoSource(index, 'camera')}>
                                <Camera size={14} /> Take Photo
                              </button>
                              <button className="action-option" onClick={() => triggerPhotoSource(index, 'gallery')}>
                                <ImageIcon size={14} /> From Gallery
                              </button>
                            </div>
                          )}

                          {item.photoBase64 ? (
                            <>
                              <img 
                                src={item.photoBase64} 
                                alt="Item preview" 
                                className="mini-thumbnail" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(item.photoBase64 || null);
                                }}
                              />
                              <button 
                                className="remove-photo-badge"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = [...items];
                                  updated[index].photoBase64 = '';
                                  setItems(updated);
                                }}
                              >
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <Camera size={18} />
                          )}
                        </div>
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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  LTV % {!canOverrideLtv && <Lock size={12} color="var(--text-tertiary)" />}
                </label>
                <input
                  type="number"
                  className={`form-input ${(parseFloat(ltvPercent) || 0) > 75 ? 'warning' : ''}`}
                  value={ltvPercent}
                  onChange={(e) => setLtvPercent(e.target.value)}
                  min="0"
                  max="100"
                  disabled={!canOverrideLtv}
                  title={!canOverrideLtv ? "Managed by shop policy" : (parseFloat(ltvPercent) > 75 ? "Exceeds standard 75% Bank LTV" : "")}
                  style={{
                    borderColor: (parseFloat(ltvPercent) || 0) > 75 ? '#f59e0b' : '',
                    backgroundColor: (parseFloat(ltvPercent) || 0) > 85 ? '#fee2e2' : ''
                  }}
                />
                <span className="form-helper" style={{ color: (parseFloat(ltvPercent) || 0) > 75 ? '#d97706' : '' }}>
                  {parseFloat(ltvPercent) > 85 ? '✖ Above RBI Limit (85%)' : (parseFloat(ltvPercent) > 75 ? '⚠ High LTV Warning' : `Auto loan: ${formatCurrency(computedLoanAmount)}`)}
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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Interest Rate (% / month) {!canOverrideInterest && <Lock size={12} color="var(--text-tertiary)" />}
                </label>
                <input
                  type="number"
                  className={`form-input ${(parseFloat(interestRate) || 0) > 1.5 ? 'warning' : ''}`}
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  step="0.1"
                  min="0"
                  disabled={!canOverrideInterest}
                  title={!canOverrideInterest ? "Managed by shop policy" : (parseFloat(interestRate) > 1.5 ? "Exceeds State Money Lending Cap (1.5%)" : "")}
                  style={{
                    borderColor: (parseFloat(interestRate) || 0) > 1.5 ? '#f59e0b' : '',
                    boxShadow: (parseFloat(interestRate) || 0) > 2 ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : ''
                  }}
                />
                {(parseFloat(interestRate) || 0) > 1.5 && (
                  <span className="form-helper" style={{ color: '#d97706', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    {parseFloat(interestRate) > 2 ? '⚠ High Interest Alert' : '⚠ Near State Cap (1.5%)'}
                  </span>
                )}
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
              onClick={handleReviewQuote}
              disabled={saving || !enforcement.allowed}
              id="save-loan-btn"
            >
              <CircleDollarSign size={18} />
              Review & Payout
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
            <span className="loan-summary-label">
              <span title="Total Machine Weight" style={{ borderBottom: '1px dotted var(--text-tertiary)', cursor: 'help' }}>Gross Weight</span>
            </span>
            <span className="loan-summary-value" style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'right'
            }}>{formatWeight(totalGrossWeight)}</span>
          </div>

          <div className="loan-summary-row" style={{ marginBottom: isMixed ? '8px' : '16px' }}>
            <span className="loan-summary-label">
              <span title="Total Metal Weight (Appraisable)" style={{ borderBottom: '1px dotted var(--brand-primary)', cursor: 'help' }}>Net Weight</span>
            </span>
            <span className="loan-summary-value gold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isMixed ? formatWeight(totalWeight) : (hasGold ? '🥇 ' : '🥈 ') + formatWeight(totalWeight)}
            </span>
          </div>

          {isMixed && (
            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>🥇 Gold Total:</span>
                <span style={{ fontWeight: 600 }}>{formatWeight(goldWeight)} ({formatCurrency(goldValue)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>🥈 Silver Total:</span>
                <span style={{ fontWeight: 600 }}>{formatWeight(silverWeight)} ({formatCurrency(silverValue)})</span>
              </div>
            </div>
          )}

          <div className="loan-summary-row">
            <span className="loan-summary-label">Appraised Value</span>
            <span className="loan-summary-value">{formatCurrency(totalValue)}</span>
          </div>
          <div className="loan-summary-row">
            <span className="loan-summary-label">LTV ({ltvPercent}%)</span>
            <span className="loan-summary-value">{formatCurrency(computedLoanAmount)}</span>
          </div>

          <div style={{ margin: '16px 0', borderTop: '1px solid var(--border-light)' }} />

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
              <span className="loan-summary-value" style={{ fontSize: '22px', color: 'var(--brand-deep)' }}>
                {formatCurrency(maturityAmount)}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              background: 'var(--status-active-bg)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              color: 'var(--brand-primary)',
              lineHeight: 1.5,
              border: '1px solid var(--brand-glow)'
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
      {/* Lightbox Preview */}
      {previewImage && (
        <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setPreviewImage(null)}>
              <X size={20} /> Close Preview
            </button>
            <img src={previewImage} alt="Fullscreen preview" className="lightbox-image" />
          </div>
        </div>
      )}
      {isPayoutStage && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(18, 31, 29, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, backdropFilter: 'blur(8px)'
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '95%', border: '1px solid var(--brand-primary)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div className="card-header" style={{ background: 'var(--brand-primary)', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CircleDollarSign size={20} /> 
                <h3 style={{ color: 'white', margin: 0 }}>Finalize Disbursement</h3>
              </div>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--status-active-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-glow)' }}>
                <div style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '4px' }}>TOTAL LOAN AMOUNT</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-deep)' }}>{formatCurrency(finalLoanAmount)}</div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>disbursement Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  {(['cash', 'bank', 'upi'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setPayoutMethod(method)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid',
                        borderColor: payoutMethod === method ? 'var(--brand-primary)' : 'var(--border)',
                        background: payoutMethod === method ? 'var(--status-active-bg)' : 'white',
                        color: payoutMethod === method ? 'var(--brand-deep)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '12px',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {method === 'cash' && <CircleDollarSign size={18} />}
                      {method === 'bank' && <Building2 size={18} />}
                      {method === 'upi' && <Gem size={18} />}
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {payoutMethod !== 'cash' && (
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {payoutMethod === 'bank' ? 'Bank Name / Reference #' : 'UPI Transaction ID'}
                  </label>
                  <input
                    className="form-input"
                    value={payoutReference}
                    onChange={e => setPayoutReference(e.target.value)}
                    placeholder={payoutMethod === 'bank' ? 'e.g. HDFC NEFT #12345' : 'e.g. UPI#987654321'}
                    autoFocus
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsPayoutStage(false)}>Back</button>
                <button 
                  className="btn btn-gold" 
                  style={{ flex: 2 }} 
                  onClick={() => handleSave(true)}
                  disabled={saving}
                >
                  <Save size={18} /> {saving ? 'Finalizing...' : 'Confirm Disbursement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
