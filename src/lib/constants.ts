// ============================================
// PledgeVault — Constants & Defaults
// ============================================

import { GoldPurity, SilverPurity, ItemType, ShopSettings } from './types';

// ---- Purity Factors ----
export const GOLD_PURITY_MAP: Record<GoldPurity, { label: string; factor: number; karat: string }> = {
  '999': { label: '24K / 999', factor: 1.0, karat: '24K' },
  '916': { label: '22K / 916', factor: 0.9166, karat: '22K' },
  '875': { label: '21K / 875', factor: 0.875, karat: '21K' },
  '750': { label: '18K / 750', factor: 0.75, karat: '18K' },
  '585': { label: '14K / 585', factor: 0.585, karat: '14K' },
};

export const SILVER_PURITY_MAP: Record<SilverPurity, { label: string; factor: number }> = {
  '999': { label: 'Fine Silver / 999', factor: 1.0 },
  '925': { label: 'Sterling / 925', factor: 0.925 },
  '900': { label: 'Coin Silver / 900', factor: 0.9 },
  '800': { label: '800 Silver', factor: 0.8 },
};

// ---- Item Types ----
export const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'chain', label: 'Chain' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'ring', label: 'Ring' },
  { value: 'bangle', label: 'Bangle' },
  { value: 'earring', label: 'Earring' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'anklet', label: 'Anklet' },
  { value: 'pendant', label: 'Pendant' },
  { value: 'coin', label: 'Coin' },
  { value: 'bar', label: 'Bar / Biscuit' },
  { value: 'other', label: 'Other' },
];

// ---- Default Shop Settings ----
export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'PledgeVault Shop',
  shopAddress: '',
  shopPhone: '',
  licenseNumber: '',
  goldRate24K: 7200, // ₹ per gram (approximate current rate)
  silverRate999: 90, // ₹ per gram
  defaultLtvGold: 75,
  defaultLtvSilver: 70,
  defaultInterestRate: 1.5, // 1.5% per month
  defaultInterestMode: 'flat',
  defaultTenure: 6,
  loanNumberPrefix: 'PV',
  loanNumberCounter: 1,
  activeBranchId: '',
  branches: [],
  allowStaffOverridesInterest: true,
  allowStaffOverridesLtv: true,
  language: 'en',
  theme: 'emerald',
  goldRateMarket: 0,
  silverRateMarket: 0,
  ratesUpdatedAt: '',
};

// ---- Interest Mode Labels ----
export const INTEREST_MODE_LABELS: Record<string, string> = {
  flat: 'Flat Rate',
  reducing: 'Reducing Balance',
  per_gram: 'Per Gram / Month',
};

// ---- Loan Status Labels ----
export const LOAN_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  overdue: 'Overdue',
  closed: 'Closed',
  auctioned: 'Auctioned',
};

// ---- Currency Formatter ----
export function formatCurrency(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return '₹0';
  
  // Use compact notation for astronomical numbers or values > 1 Crore for layout stability
  const useCompact = amount >= 10000000 || amount >= 1e12;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: useCompact ? 2 : 0,
    notation: useCompact ? 'compact' : 'standard',
  }).format(amount);
}

export function formatWeight(grams: number): string {
  return `${grams.toFixed(2)}g`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function generateLoanNumber(prefix: string, counter: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${counter.toString().padStart(4, '0')}`;
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// ---- Subscription Config ----
export const GRACE_PERIOD_DAYS = 7;

export const PLAN_LIMITS: Record<string, { maxLoans: number; maxBranches: number; maxUsers: number }> = {
  free: { maxLoans: 10, maxBranches: 1, maxUsers: 1 },
  starter: { maxLoans: 100, maxBranches: 1, maxUsers: 2 },
  pro: { maxLoans: Infinity, maxBranches: 3, maxUsers: 10 },
  elite: { maxLoans: Infinity, maxBranches: Infinity, maxUsers: Infinity },
};

// ---- Subscription Plans ----
export const SUBSCRIPTION_PLANS: any[] = [
  {
    id: 'free',
    name: 'Free Trial',
    description: 'Perfect for getting started with PledgeVault.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: '1 Branch', included: true },
      { text: '1 Staff User', included: true },
      { text: 'Up to 10 Active Loans', included: true },
      { text: 'Basic Reports', included: true },
      { text: 'SMS Alerts', included: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For solo pawn shops and small businesses.',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    features: [
      { text: '1 Branch', included: true },
      { text: '2 Staff Users', included: true },
      { text: 'Up to 100 Active Loans', included: true },
      { text: 'Standard Reports', included: true },
      { text: 'SMS Alerts', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced tools for growing shops.',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    features: [
      { text: '3 Branches', included: true },
      { text: '10 Staff Users', included: true },
      { text: 'Unlimited Loans', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'SMS Notifications', included: true },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Total control for jewelry chains.',
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    features: [
      { text: 'Unlimited Branches', included: true },
      { text: 'Unlimited Users', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Custom Branding', included: true },
      { text: 'Full Audit Logs', included: true },
    ],
  },
];

