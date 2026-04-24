// PledgeVault — TypeScript Types
// ============================================

export interface Branch {
  id: string;
  firmId: string;
  name: string;
  location: string;
  code: string; // e.g., 'CBE01'
  licenseNumber?: string;
  phone?: string;
  isActive?: boolean;
}

export type MetalType = 'gold' | 'silver';

export type LoanStatus = 'active' | 'overdue' | 'closed' | 'auctioned' | 'draft';

export type InterestMode = 'flat' | 'reducing' | 'per_gram';

export type GoldPurity = '999' | '916' | '875' | '750' | '585';
export type SilverPurity = '999' | '925' | '900' | '800';

export type ItemType =
  | 'chain'
  | 'ring'
  | 'bangle'
  | 'necklace'
  | 'earring'
  | 'coin'
  | 'bar'
  | 'anklet'
  | 'pendant'
  | 'bracelet'
  | 'other';

// ---- Branding ----
export interface BrandingConfig {
  primaryColor: string;
  loginGreeting: string;
}

// ---- Firm ----
export interface Firm {
  id: string;
  name: string;
  slug?: string;
  shortCode?: string;
  brandingConfig?: BrandingConfig;
  loanCounter: number;
  plan: string;
  createdAt: string;
}

// ---- Customer ----
export interface Customer {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  // Primary ID (Mandatory)
  primaryIdType: string;
  primaryIdNumber: string;
  primaryIdPhoto?: string;
  // Secondary ID (Optional)
  secondaryIdType?: string;
  secondaryIdNumber?: string;
  secondaryIdPhoto?: string;
  selfiePhoto?: string;
  activeLoansCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Pledge Item ----
export interface PledgeItem {
  id: string;
  metalType: MetalType;
  itemType: ItemType;
  description?: string;
  grossWeight: number; // grams
  netWeight: number; // grams (after stone/waste deduction)
  purity: GoldPurity | SilverPurity;
  ratePerGram: number; // rate used at time of pledge
  itemValue: number; // calculated: netWeight × purityFactor × ratePerGram
  photoBase64?: string;
}

// ---- Loan ----
export interface Loan {
  id: string;
  loanNumber: string; // e.g., PV-2026-0001
  customerId: string;
  customerName: string; // denormalized for quick display
  customerPhone: string;
  branchId: string;
  items: PledgeItem[];
  totalGrossWeight: number;
  totalNetWeight: number;
  totalAppraisedValue: number;
  ltvPercent: number;
  loanAmount: number;
  interestMode: InterestMode;
  interestRate: number; // monthly %
  tenureMonths: number;
  startDate: string; // ISO date
  dueDate: string; // ISO date
  status: LoanStatus;
  interestAccrued: number;
  amountPaid: number;
  closedDate?: string;
  payoutMethod?: 'cash' | 'bank' | 'upi';
  payoutReference?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Payment ----
export interface Payment {
  id: string;
  loanId: string;
  branchId?: string; // branch where payment was collected
  amount: number;
  type: 'interest' | 'principal' | 'full_closure' | 'partial';
  paymentDate: string;
  remarks?: string;
  createdAt: string;
}

// ---- Settings ----
export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  licenseNumber: string;
  gstNumber?: string;
  registrationNumber?: string;
  goldRate24K: number; // per gram
  goldRate22K: number; // per gram
  silverRate999: number; // per gram
  defaultLtvGold: number; // %
  defaultLtvSilver: number; // %
  defaultInterestRate: number; // monthly %
  defaultInterestMode: InterestMode;
  defaultTenure: number; // months
  loanNumberPrefix: string;
  loanNumberCounter: number;
  activeBranchId: string;
  branches: Branch[];
  goldRateMarket?: number;
  silverRateMarket?: number;
  ratesUpdatedAt?: string;
  allowStaffOverridesInterest?: boolean;
  allowStaffOverridesLtv?: boolean;
  language?: 'en' | 'ta';
  theme?: 'emerald' | 'zinc' | 'blue' | 'rose' | 'gold';
  brandingConfig?: BrandingConfig;
}

// ---- Dashboard Stats ----
export interface DashboardStats {
  totalActiveLoans: number;
  totalActiveLoanValue: number;
  totalGoldWeight: number;
  totalSilverWeight: number;
  overdueLoans: number;
  monthlyInterestEarned: number;
  totalCustomers: number;
  recentLoans: Loan[];
  overdueList: Loan[];
  loansByMonth: { month: string; count: number; value: number }[];
  metalDistribution: { type: string; weight: number }[];
}
// ---- Subscription ----
export type PlanTier = 'free' | 'starter' | 'pro' | 'elite';
export type SubscriptionInterval = 'monthly' | 'yearly';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
}

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cash' | 'trial';
export type SubscriptionStatus = 'active' | 'expired' | 'canceled' | 'past_due' | 'trial' | 'incomplete';

export interface Subscription {
  id: string;
  firmId: string;
  planId: PlanTier;
  interval: SubscriptionInterval;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: SubscriptionStatus;
  extensionCount: number;
  startDate: string;
  endDate: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
}

export interface PlanLimits {
  maxLoans: number;
  maxBranches: number;
  maxUsers: number;
}
