// PledgeVault — TypeScript Types
// ============================================

export interface Branch {
  id: string;
  name: string;
  location: string;
  code: string; // e.g., 'CBE01'
}

export type MetalType = 'gold' | 'silver';

export type LoanStatus = 'active' | 'overdue' | 'closed' | 'auctioned';

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

// ---- Customer ----
export interface Customer {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  address: string;
  city: string;
  // Primary ID (Mandatory)
  primaryIdType: string;
  primaryIdNumber: string;
  primaryIdPhoto?: string;
  // Secondary ID (Optional)
  secondaryIdType?: string;
  secondaryIdNumber?: string;
  secondaryIdPhoto?: string;
  selfiePhoto?: string;
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
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Payment ----
export interface Payment {
  id: string;
  loanId: string;
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
  goldRate24K: number; // per gram
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
