'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { translations, Language } from '@/lib/i18n/translations';
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
  Languages,
  Image as ImageIcon
} from 'lucide-react';
import { customerStore, loanStore, settingsStore } from '@/lib/store';
import { compressImage } from '@/lib/image';
import { GOLD_PURITY_MAP, SILVER_PURITY_MAP, ITEM_TYPES, INTEREST_MODE_LABELS, generateId, generateLoanNumber, formatCurrency, formatWeight } from '@/lib/constants';
import { calculateItemValue, calculateLoanAmount, calculateTotalWeight, calculateTotalValue, getPurityFactor } from '@/lib/gold';
import { calculateMonthlyInterestAmount, calculateMaturityAmount } from '@/lib/interest';
import { metalRateService } from '@/lib/supabase/metalRateService';
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
  hideSteppers?: boolean;
}

const WeightInput = ({ value, onChange, onStep, metalType, placeholder, isWarning, hideSteppers }: WeightInputProps) => {
  const [showQuickPicks, setShowQuickPicks] = useState(false);
  const goldPresets = ['1.00', '2.00', '4.00', '8.00'];
  const silverPresets = ['10.00', '50.00', '100.00', '500.00'];
  const presets = metalType === 'gold' ? goldPresets : silverPresets;

  return (
    <div className="weight-input-container" style={{ 
      borderColor: isWarning ? '#f59e0b' : '',
      background: isWarning ? '#fffbeb' : ''
    }}>
      {!hideSteppers && <button className="weight-stepper" onClick={() => onStep(-0.01)}>−</button>}
      <input
        type="text"
        className="weight-input-naked"
        placeholder={placeholder || "0.00"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowQuickPicks(true)}
        onBlur={() => setTimeout(() => setShowQuickPicks(false), 200)}
        autoComplete="off"
      />
      {!hideSteppers && <button className="weight-stepper" onClick={() => onStep(0.01)}>+</button>}
      
      {showQuickPicks && (
        <div className="quick-pick-container">
          {presets.map(p => (
            <div 
              key={p} 
              className="quick-pick-tag" 
              onClick={() => {
                onChange(p);
                setShowQuickPicks(false);
              }}
            >
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
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('ta');
  const t = translations[lang] || translations.en;

  useEffect(() => {
    // Initial Load
    const s = settingsStore.get();
    if (s.language) setLang(s.language);

    // Sync listener
    const sync = () => {
      const updated = settingsStore.get();
      if (updated.language) setLang(updated.language);
    };
    window.addEventListener('pv_settings_updated', sync);
    return () => window.removeEventListener('pv_settings_updated', sync);
  }, []);

  const handleLangToggle = (newLang: Language) => {
    setLang(newLang);
    settingsStore.save({ language: newLang });
  };
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
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
      supabaseService.getCustomers(auth.firmId, 0, 10).then(res => {
        setCustomers(res.data as Customer[]);
      }).catch(console.error);
    }
    
    const s = settingsStore.get();
    setInterestRate(s.defaultInterestRate.toString());
    setInterestMode(s.defaultInterestMode);
    setTenure(s.defaultTenure.toString());
    setLtvPercent(s.defaultLtvGold.toString());
    
    // Proactive Sync: Get live rates on mount so we match the header immediately
    metalRateService.getLiveRates().then((live: any) => {
      setGoldRate(live.gold24k);
      setSilverRate(live.silver);
    }).catch(() => {
      // Fallback to store if DB fetch fails
      setGoldRate(s.goldRate24K || 15350);
      setSilverRate(s.silverRate999 || 260);
    });

    // Check for draftId in URL
    const dId = searchParams.get('draftId');
    if (dId) {
      setDraftId(dId);
      supabaseService.getLoanWithDetails(dId).then(draft => {
        if (draft && draft.status === 'draft') {
          setSelectedCustomerId(draft.customerId);
          setInterestMode(draft.interestMode);
          setInterestRate(draft.interestRate.toString());
          setTenure(draft.tenureMonths.toString());
          setLtvPercent(draft.ltvPercent.toString());
          setRemarks(draft.remarks || '');
          if (draft.items && draft.items.length > 0) {
            setItems(draft.items.map(i => ({
              id: i.id,
              metalType: i.metalType,
              itemType: i.itemType,
              grossWeight: i.grossWeight.toString(),
              netWeight: i.netWeight.toString(),
              purity: i.purity,
              photoBase64: (i as any).photoBase64 || ''
            })));
          }
        }
      }).catch(console.error);
    }
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

  // Debounced Customer Search for New Loan
  useEffect(() => {
    if (!mounted || !auth.firmId || !customerSearch || customerSearch.length < 2) return;
    
    const timer = setTimeout(async () => {
      try {
        const res = await supabaseService.getCustomers(auth.firmId!, 0, 10, customerSearch);
        setCustomers(res.data as Customer[]);
        setShowCustomerDropdown(true);
      } catch (err) {
        console.error('Customer search failed:', err);
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [customerSearch, auth.firmId, mounted]);

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
      alert(`${t.plans.restricted}: ${enforcement.reason === 'expired' ? t.plans.expiredTitle : t.plans.limitReached}`);
      return;
    }
    if (!selectedCustomerId) {
      alert(t.appraisal.noRecords); // Or a better key if I had one
      return;
    }
    if (!items.some((i) => parseFloat(i.netWeight) > 0)) {
      alert(t.appraisal.itemsPledged);
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
      alert(`${t.plans.restricted}: ${enforcement.reason === 'expired' ? t.plans.expiredTitle : t.plans.limitReached}`);
      return;
    }
    if (!selectedCustomerId) {
      alert(t.appraisal.noRecords);
      return;
    }
    if (!items.some((i) => parseFloat(i.netWeight) > 0)) {
      alert(t.appraisal.itemsPledged);
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

    const savePromise = draftId 
      ? supabaseService.updateLoan(draftId, { ...loanPayload, status: 'active' })
      : supabaseService.createLoan(loanPayload);

    savePromise.then(() => {
      // settingsStore.incrementLoanCounter(); // Handle offline fallback gracefully later if needed
      router.push('/loans');
    }).catch((err) => {
      console.error(err);
      alert('Failed to save loan to Supabase');
      setSaving(false);
    });
  };

  const handleSaveDraft = async () => {
    if (!selectedCustomerId && items.every(i => !i.netWeight)) {
       alert('Please provide at least a customer or one item to save a draft.');
       return;
    }
    
    setSaving(true);
    const customer = customers.find((c) => c.id === selectedCustomerId);
    
    const pledgeItems: any[] = calculatedItems
      .filter((i) => parseFloat(i.netWeight) > 0)
      .map((i) => ({
        id: i.id,
        metalType: i.metalType,
        itemType: i.itemType,
        grossWeight: parseFloat(i.grossWeight) || 0,
        netWeight: parseFloat(i.netWeight) || 0,
        purity: i.purity,
        ratePerGram: i.rate,
        itemValue: i.value,
        photoBase64: i.photoBase64
      }));

    const s = settingsStore.get();
    const branchToUse = s.activeBranchId === 'firm' ? selectedBranchId : s.activeBranchId;

    const draftPayload: any = {
      firmId: auth.firmId,
      customerId: selectedCustomerId || null,
      customerName: customer?.name || 'Draft Customer',
      customerPhone: customer?.phone || '',
      branchId: branchToUse || null,
      items: pledgeItems,
      totalGrossWeight: pledgeItems.reduce((s, i) => s + i.grossWeight, 0),
      totalNetWeight: pledgeItems.reduce((s, i) => s + i.netWeight, 0),
      totalAppraisedValue: totalValue,
      ltvPercent: parseFloat(ltvPercent) || 75,
      loanAmount: finalLoanAmount,
      interestMode,
      interestRate: parseFloat(interestRate) || 1.5,
      tenureMonths: parseInt(tenure) || 6,
      status: 'draft',
      remarks,
    };

    try {
      if (draftId) {
        await supabaseService.updateLoan(draftId, draftPayload);
      } else {
        const newDraft = await supabaseService.createLoan(draftPayload);
        setDraftId(newDraft.id);
      }
      alert(t.loans.draftSaved);
    } catch (err) {
      console.error(err);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="page-header-left">
          <Link href="/loans" className="pv-btn pv-btn-outline" style={{ height: '36px', padding: '0 12px', fontSize: '13px', marginBottom: '8px' }}>
            <ArrowLeft size={16} /> {t.appraisal.backToLoans}
          </Link>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>{t.appraisal.createLoan}</h2>
          <p className="subtitle" style={{ color: 'var(--text-tertiary)' }}>{t.appraisal.subtitle}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="lang-switcher" style={{ 
            display: 'flex', 
            background: 'var(--bg-muted)', 
            padding: '4px', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <button 
              onClick={() => handleLangToggle('en')}
              style={{ 
                padding: '6px 12px', 
                fontSize: '11px', 
                fontWeight: 800, 
                borderRadius: '4px',
                background: lang === 'en' ? 'var(--brand-primary)' : 'transparent',
                color: lang === 'en' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >EN</button>
            <button 
              onClick={() => handleLangToggle('ta')}
              style={{ 
                padding: '6px 12px', 
                fontSize: '11px', 
                fontWeight: 800, 
                borderRadius: '4px',
                background: lang === 'ta' ? 'var(--brand-primary)' : 'transparent',
                color: lang === 'ta' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >தமிழ்</button>
          </div>
        </div>

        {!enforcement.allowed && (
          <div className="enforcement-banner animate-pulse">
            <AlertCircle size={20} />
            <div>
              <div style={{ fontWeight: 700 }}>
                {enforcement.reason === 'expired' ? t.plans.expiredTitle : t.plans.limitReached}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                {enforcement.reason === 'expired' 
                  ? t.plans.expiredDesc 
                  : t.plans.limitDesc.replace('{count}', loanCount.toString())
                }
              </div>
            </div>
            <Link href="/settings" className="pv-btn pv-btn-outline" style={{ marginLeft: 'auto', background: 'white', height: '36px' }}>
              {t.plans.upgrade}
            </Link>
          </div>
        )}
      </div>      <div className="space-y-8 mt-8">
        {/* ROW 1: Configuration Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          <div className="space-y-6">
            {/* Section 1: Pledger Details */}
            <div className="pv-card" style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 800, color: 'var(--brand-deep)' }}>
                  <User size={20} style={{ color: 'var(--brand-primary)' }} /> {t.appraisal.pledgerDetails}
                </div>
                {selectedCustomerId && (
                  <button 
                    className="pv-btn pv-btn-ghost pv-btn-sm" 
                    onClick={() => { setSelectedCustomerId(''); setCustomerSearch(''); }}
                  >
                    <RefreshCcw size={14} /> {t.appraisal.switchCustomer}
                  </button>
                )}
              </div>

              {authStore.isManager() && (
                <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--status-active-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--brand-glow)' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} /> {t.appraisal.receivingBranch}
                  </label>
                  <select 
                    className="pv-input" 
                    value={selectedBranchId}
                    onChange={e => setSelectedBranchId(e.target.value)}
                    style={{ background: 'white' }}
                  >
                    <option value="">{t.appraisal.chooseBranch}</option>
                    {settings?.branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {!selectedCustomerId ? (
                <div className="pv-input-group" style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="pv-input"
                      placeholder={t.appraisal.searchPlaceholder}
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      style={{ paddingLeft: '44px' }}
                    />
                    <Search 
                      size={18} 
                      style={{ 
                        position: 'absolute', 
                        left: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--brand-primary)',
                        opacity: 0.6
                      }} 
                    />
                  </div>

                  {showCustomerDropdown && customerSearch.length >= 1 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'white', border: '1.5px solid var(--brand-primary)',
                      borderRadius: 'var(--radius-md)', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                      zIndex: 1000, maxHeight: '350px', overflowY: 'auto', marginTop: '8px'
                    }}>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            style={{ width: '100%', padding: '14px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--border-light)' }}
                            onClick={() => { setSelectedCustomerId(c.id); setCustomerSearch(''); setShowCustomerDropdown(false); }}
                          >
                            <div className="customer-avatar" style={{ width: '36px', height: '36px', background: 'var(--status-active-bg)', color: 'var(--brand-deep)', fontSize: '14px', fontWeight: 800 }}>{c.name.charAt(0)}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>{c.name}</div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                <span>{c.phone}</span>
                                <span>{c.city} • {c.primaryIdType?.toUpperCase()}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--brand-primary)', fontWeight: 800 }}>SELECT →</div>
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{t.appraisal.noRecords}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="customer-profile-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="customer-avatar" style={{ width: '50px', height: '50px', fontSize: '20px', background: 'var(--brand-primary)', color: 'white', fontWeight: 800, flexShrink: 0 }}>{selectedCustomer?.name.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--brand-deep)' }}>{selectedCustomer?.name}</h4>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <span>📞 {selectedCustomer?.phone}</span>
                        <span>🆔 {selectedCustomer?.primaryIdType?.toUpperCase()}: {selectedCustomer?.primaryIdNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong>{t.appraisal.address}:</strong> {selectedCustomer?.address}, {selectedCustomer?.city}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Financial Terms */}
            <div className="pv-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 800, color: 'var(--brand-deep)', marginBottom: '24px' }}>
                <CircleDollarSign size={20} style={{ color: 'var(--brand-primary)' }} /> {t.appraisal.loanTerms}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="pv-input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{t.appraisal.ltvRatio} {!canOverrideLtv && <Lock size={12} />}</label>
                  <input type="number" className="pv-input" value={ltvPercent} onChange={(e) => setLtvPercent(e.target.value)} disabled={!canOverrideLtv} />
                </div>
                <div className="pv-input-group">
                  <label>{t.appraisal.manualOverride}</label>
                  <input type="number" className="pv-input" value={loanAmountOverride} onChange={(e) => setLoanAmountOverride(e.target.value)} placeholder={computedLoanAmount.toString()} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div className="pv-input-group">
                  <label>{t.appraisal.interestMode}</label>
                  <select className="pv-input" value={interestMode} onChange={(e) => setInterestMode(e.target.value as InterestMode)}>
                    {Object.entries(INTEREST_MODE_LABELS).map(([k, v]) => <option key={k} value={k}>{(t.interest as any)[v]}</option>)}
                  </select>
                </div>
                <div className="pv-input-group">
                  <label>{t.appraisal.monthlyRate}</label>
                  <input type="number" className="pv-input" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} disabled={!canOverrideInterest} />
                </div>
                <div className="pv-input-group">
                  <label>{t.appraisal.tenure}</label>
                  <input type="number" className="pv-input" value={tenure} onChange={(e) => setTenure(e.target.value)} />
                </div>
              </div>

              <div className="pv-input-group">
                <label>{t.appraisal.remarks}</label>
                <textarea className="pv-input" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder={t.appraisal.remarksPlaceholder} rows={2} style={{ height: 'auto', padding: '12px' }} />
              </div>
            </div>
          </div>

          {/* Sidebar: Real-time Quote */}
          <div className="loan-summary pv-card" style={{ height: 'fit-content', position: 'sticky', top: '20px', border: '1px solid var(--brand-primary)', animation: 'fadeIn 0.6s ease' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1.5px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>{t.appraisal.realTimeQuote}</div>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={22} /> {t.appraisal.appraisal}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="loan-summary-row">
                <span className="loan-summary-label">{t.appraisal.itemsPledged}</span>
                <span className="loan-summary-value">{items.filter((i) => parseFloat(i.netWeight) > 0).length} {t.common.items}</span>
              </div>
              <div className="loan-summary-row">
                <span className="loan-summary-label">{t.appraisal.assetValue}</span>
                <span className="loan-summary-value">{formatCurrency(totalValue)}</span>
              </div>
              <div className="loan-summary-total">
                <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>{t.appraisal.loanAmount}</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--brand-deep)' }}>{formatCurrency(finalLoanAmount)}</div>
              </div>
                <button 
                className="pv-btn pv-btn-gold" 
                style={{ width: '100%', height: '56px', fontSize: '16px', fontWeight: 900, marginTop: '20px', boxShadow: 'var(--shadow-brand)' }}
                onClick={handleReviewQuote}
                disabled={saving || !selectedCustomerId}
              >
                <CircleDollarSign size={20} /> {t.appraisal.reviewPayout}
              </button>

              <button 
                className="pv-btn pv-btn-outline" 
                style={{ width: '100%', height: '48px', fontSize: '14px', fontWeight: 700, marginTop: '12px' }}
                onClick={handleSaveDraft}
                disabled={saving}
              >
                <Save size={18} /> {t.loans.saveDraft}
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: Appraisal Terminal */}
        <div className="pv-card" style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 800, color: 'var(--brand-deep)' }}>
              <Gem size={20} style={{ color: 'var(--brand-primary)' }} /> {t.appraisal.terminalTitle}
            </div>
            <RealTimeRateSync compact onSync={(rates) => { 
              setGoldRate(rates.gold24k); 
              setSilverRate(rates.silver); 
              settingsStore.save({ 
                goldRate24K: rates.gold24k, 
                goldRate22K: rates.gold22k, 
                silverRate999: rates.silver 
              });
            }} />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.appraisal.metal}</th>
                  <th>{t.appraisal.category}</th>
                  <th>{t.appraisal.grossWeight}</th>
                  <th>{t.appraisal.netWeight}</th>
                  <th>{t.appraisal.purity}</th>
                  <th style={{ textAlign: 'right' }}>{t.appraisal.marketRate}</th>
                  <th style={{ textAlign: 'right' }}>{t.appraisal.valuation}</th>
                  <th style={{ textAlign: 'center' }}>{t.appraisal.photo}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <select className="pv-input" value={item.metalType} onChange={(e) => updateItem(index, 'metalType', e.target.value)}>
                        <option value="gold">🥇 {(t.metals as any).gold}</option>
                        <option value="silver">🥈 {(t.metals as any).silver}</option>
                      </select>
                    </td>
                    <td>
                      <select className="pv-input" value={item.itemType} onChange={(e) => updateItem(index, 'itemType', e.target.value)}>
                        {ITEM_TYPES.map((it) => <option key={it.value} value={it.value}>{(t.items as any)[it.labelKey]}</option>)}
                      </select>
                    </td>
                    <td>
                      <WeightInput 
                        value={item.grossWeight} 
                        onChange={(val) => updateItem(index, 'grossWeight', val)} 
                        onStep={(delta) => {
                          const current = parseFloat(item.grossWeight || '0');
                          updateItem(index, 'grossWeight', Math.max(0, current + delta).toFixed(2));
                        }}
                        metalType={item.metalType} 
                      />
                    </td>
                    <td>
                      <WeightInput 
                        value={item.netWeight} 
                        onChange={(val) => updateItem(index, 'netWeight', val)} 
                        onStep={(delta) => {
                          const current = parseFloat(item.netWeight || '0');
                          updateItem(index, 'netWeight', Math.max(0, current + delta).toFixed(2));
                        }}
                        metalType={item.metalType} 
                      />
                    </td>
                    <td>
                      <select className="pv-input" value={item.purity} onChange={(e) => updateItem(index, 'purity', e.target.value)}>
                        {item.metalType === 'gold'
                          ? Object.entries(GOLD_PURITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
                          : Object.entries(SILVER_PURITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {formatCurrency(item.rate * getPurityFactor(item.metalType, item.purity))}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--brand-deep)', fontSize: '15px' }}>
                      {formatCurrency(item.value)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="photo-dropzone" onClick={() => triggerPhotoSource(index, 'camera')}>
                        {item.photoBase64 ? <img src={item.photoBase64} className="mini-thumbnail" /> : <Camera size={18} style={{ opacity: 0.4 }} />}
                      </div>
                    </td>
                    <td>
                      <button className="pv-btn pv-btn-ghost" onClick={() => removeItem(index)} disabled={items.length === 1}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="pv-btn pv-btn-outline" onClick={addItem} style={{ marginTop: '20px', width: '100%', borderStyle: 'dashed' }}>
            <Plus size={16} /> {t.appraisal.addAnother}
          </button>
        </div>
      </div>

      {showManagerOverrideModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div className="pv-card" style={{ width: '400px', maxWidth: '95%', animation: 'fadeInScale 0.3s ease', padding: 0, overflow: 'hidden' }}>
            <div className="modal-header" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20} /> <h3 style={{ color: 'var(--status-overdue)', margin: 0 }}>{t.appraisal.managerOverride}</h3></div>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {t.appraisal.managerOverrideDesc}
              </p>
              <div className="pv-input-group" style={{ marginBottom: '20px' }}>
                <label>{t.appraisal.managerPin}</label>
                <input 
                  type="password" 
                  className="pv-input" 
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="pv-btn pv-btn-outline" style={{ flex: 1 }} onClick={() => setShowManagerOverrideModal(false)}>{t.common.cancel}</button>
                <button className="pv-btn pv-btn-gold" style={{ flex: 1 }} onClick={() => {
                  if (managerPin === '1234') {
                    setShowManagerOverrideModal(false);
                    handleSave(true);
                  } else {
                    alert('Invalid PIN!');
                  }
                }}>{t.appraisal.authorize}</button>
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
          0% { box-shadow: 0 0 0 0 rgba(18, 98, 76, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(18, 98, 76, 0); }
          100% { box-shadow: 0 0 0 0 rgba(18, 98, 76, 0); }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
      {isPayoutStage && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(18, 31, 29, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, backdropFilter: 'blur(8px)'
        }}>
          <div className="pv-card" style={{ width: '500px', maxWidth: '95%', padding: 0, overflow: 'hidden', border: '1px solid var(--brand-primary)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="modal-header" style={{ background: 'var(--brand-primary)', color: 'white', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CircleDollarSign size={20} /> 
                <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>{t.appraisal.finalizeDisbursement}</h3>
              </div>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--status-active-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-glow)' }}>
                <div style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '4px' }}>{t.appraisal.totalLoanAmount}</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-deep)' }}>{formatCurrency(finalLoanAmount)}</div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>{t.appraisal.disbursementMethod}</label>
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
                  <div className="pv-input-group" style={{ marginBottom: '24px' }}>
                    <label>
                      {payoutMethod === 'bank' ? t.appraisal.bankReference : t.appraisal.upiReference}
                    </label>
                    <input
                      className="pv-input"
                      value={payoutReference}
                      onChange={e => setPayoutReference(e.target.value)}
                      placeholder={payoutMethod === 'bank' ? t.appraisal.bankPlaceholder : t.appraisal.upiPlaceholder}
                      autoFocus
                    />
                  </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button className="pv-btn pv-btn-outline" style={{ flex: 1 }} onClick={() => setIsPayoutStage(false)}>{t.common.back}</button>
                <button 
                  className="pv-btn pv-btn-gold" 
                  style={{ flex: 2 }} 
                  onClick={() => handleSave(true)}
                  disabled={saving}
                >
                  <Save size={18} /> {saving ? '...' : t.appraisal.confirmDisbursement}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Photo Lightbox (Shadcn Style) */}
      {selectedPhoto && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedPhoto(null)} 
          style={{ 
            zIndex: 2000, 
            background: 'rgba(0, 0, 0, 0.8)', 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          <div 
            style={{ 
              position: 'relative', 
              maxWidth: '90vw', 
              maxHeight: '90vh', 
              background: 'var(--background)', 
              borderRadius: 'var(--radius-lg)', 
              overflow: 'hidden',
              boxShadow: 'var(--shadow-2xl)',
              border: '1px solid var(--border)',
              animation: 'fadeInScale 0.2s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPhoto(null)}
              style={{ 
                position: 'absolute', top: '16px', right: '16px', 
                background: 'var(--muted)', color: 'var(--muted-foreground)', 
                border: '1px solid var(--border)', borderRadius: '50%', 
                width: '32px', height: '32px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 
              }}
            >
              <X size={16} />
            </button>
            <img 
              src={selectedPhoto} 
              alt="Item Preview" 
              style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block', objectFit: 'contain' }} 
            />
            <div style={{ padding: '20px', textAlign: 'center', background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '2px' }}>{t.appraisal.itemVerification}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.appraisal.auditTrail}</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
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
