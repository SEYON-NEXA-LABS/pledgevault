// ============================================
// PledgeVault — localStorage CRUD Abstraction
// Designed to be swappable with Supabase later
// ============================================

'use client';

import { Customer, Loan, Payment, ShopSettings } from './types';
import { DEFAULT_SETTINGS, generateId } from './constants';
import { supabaseService } from './supabase/service';

const isCloudActive = () => 
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const STORE_KEYS = {
  customers: 'pv_customers',
  loans: 'pv_loans',
  payments: 'pv_payments',
  settings: 'pv_settings',
} as const;

// ---- Generic CRUD ----

function getAll<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setAll<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}

function getById<T extends { id: string }>(key: string, id: string): T | null {
  const items = getAll<T>(key);
  return items.find((item) => item.id === id) || null;
}

function create<T extends { id: string }>(key: string, item: Omit<T, 'id'>): T {
  const id = generateId();
  const newItem = { ...item, id } as T;
  
  // Local Save
  const items = getAll<T>(key);
  items.push(newItem);
  setAll(key, items);

  // Cloud Sync
  if (isCloudActive()) {
    if (key === STORE_KEYS.customers) supabaseService.createCustomer(newItem as any).catch(console.error);
    if (key === STORE_KEYS.loans) supabaseService.createLoan(newItem as any).catch(console.error);
    if (key === STORE_KEYS.payments) supabaseService.createPayment(newItem as any).catch(console.error);
  }

  return newItem;
}

function update<T extends { id: string }>(
  key: string,
  id: string,
  updates: Partial<T>
): T | null {
  const items = getAll<T>(key);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setAll(key, items);

  // Cloud Sync
  if (isCloudActive()) {
    if (key === STORE_KEYS.customers) supabaseService.updateCustomer(id, updates as any).catch(console.error);
    if (key === STORE_KEYS.settings) supabaseService.updateSettings(updates as any).catch(console.error);
    // Loan updates are complex because of nested items, but simpler for status/payments
    if (key === STORE_KEYS.loans) {
      // Direct loan updates (not items)
      const { items: _, ...loanData } = updates as any;
      if (Object.keys(loanData).length > 0) {
        // We'd need a supabase update method for loans
        // For now, these are synced via separate recordPayment or markStatus calls
        // or during the next full migration.
      }
    }
  }

  return items[index];
}

function remove(key: string, id: string): boolean {
  const items = getAll<{ id: string }>(key);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  setAll(key, filtered);
  return true;
}

// ---- Customer Operations ----

export const customerStore = {
  getAll: () => getAll<Customer>(STORE_KEYS.customers),
  getById: (id: string) => getById<Customer>(STORE_KEYS.customers, id),
  create: (customer: Omit<Customer, 'id'>) => create<Customer>(STORE_KEYS.customers, customer),
  update: (id: string, updates: Partial<Customer>) =>
    update<Customer>(STORE_KEYS.customers, id, updates),
  delete: (id: string) => remove(STORE_KEYS.customers, id),
  search: (query: string) => {
    const all = getAll<Customer>(STORE_KEYS.customers);
    const q = query.toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.primaryIdNumber && c.primaryIdNumber.includes(q)) ||
        (c.secondaryIdNumber && c.secondaryIdNumber.includes(q))
    );
  },
};

// ---- Loan Operations ----

export const loanStore = {
  getAll: () => getAll<Loan>(STORE_KEYS.loans),
  getById: (id: string) => getById<Loan>(STORE_KEYS.loans, id),
  create: (loan: Omit<Loan, 'id'>) => create<Loan>(STORE_KEYS.loans, loan),
  update: (id: string, updates: Partial<Loan>) =>
    update<Loan>(STORE_KEYS.loans, id, updates),
  delete: (id: string) => remove(STORE_KEYS.loans, id),
  getByCustomer: (customerId: string) => {
    const all = getAll<Loan>(STORE_KEYS.loans);
    return all.filter((l) => l.customerId === customerId);
  },
  getActive: () => {
    const all = getAll<Loan>(STORE_KEYS.loans);
    return all.filter((l) => l.status === 'active' || l.status === 'overdue');
  },
  getOverdue: () => {
    const all = getAll<Loan>(STORE_KEYS.loans);
    return all.filter((l) => l.status === 'overdue');
  },
  search: (query: string) => {
    const all = getAll<Loan>(STORE_KEYS.loans);
    const q = query.toLowerCase();
    return all.filter(
      (l) =>
        l.loanNumber.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        l.customerPhone.includes(q)
    );
  },
};

// ---- Payment Operations ----

export const paymentStore = {
  getAll: () => getAll<Payment>(STORE_KEYS.payments),
  getByLoan: (loanId: string) => {
    const all = getAll<Payment>(STORE_KEYS.payments);
    return all.filter((p) => p.loanId === loanId);
  },
  create: (payment: Omit<Payment, 'id'>) => create<Payment>(STORE_KEYS.payments, payment),
};

// ---- Settings Operations ----

export const settingsStore = {
  get: (): ShopSettings => {
    const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const data = localStorage.getItem(STORE_KEYS.settings);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      
      // Sanity check: If we are in cloud mode, activeBranchId MUST be a UUID or empty
      if (isCloudActive() && parsed.activeBranchId && !isValidUuid(parsed.activeBranchId)) {
        parsed.activeBranchId = '';
      }
      
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  save: (settings: Partial<ShopSettings>): ShopSettings => {
    const current = settingsStore.get();
    const updated = { ...current, ...settings };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.settings, JSON.stringify(updated));
    }
    
    // Cloud Sync
    if (isCloudActive()) {
      supabaseService.updateSettings(updated).catch(console.error);
    }

    return updated;
  },
  incrementLoanCounter: (): number => {
    const settings = settingsStore.get();
    const newCounter = settings.loanNumberCounter + 1;
    settingsStore.save({ loanNumberCounter: newCounter });
    return newCounter;
  },
};

// ---- Seed Demo Data ----

export function seedDemoData(): void {
  if (typeof window === 'undefined') return;

  // Don't seed if data exists
  if (getAll<Customer>(STORE_KEYS.customers).length > 0) return;

  const now = new Date().toISOString();

  // Seed customers
  const customers: Customer[] = [
    {
      id: 'cust_001',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      primaryIdType: 'aadhaar',
      primaryIdNumber: '1234-5678-9012',
      secondaryIdType: 'pan',
      secondaryIdNumber: 'ABCPK1234F',
      address: '45, Gandhipuram Main Road',
      city: 'Coimbatore',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cust_002',
      name: 'Lakshmi Devi',
      phone: '9876543211',
      primaryIdType: 'aadhaar',
      primaryIdNumber: '2345-6789-0123',
      address: '12, RS Puram 2nd Street',
      city: 'Coimbatore',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cust_003',
      name: 'Mohammed Ali',
      phone: '9876543212',
      primaryIdType: 'voter',
      primaryIdNumber: 'VOTER1234567',
      secondaryIdType: 'pan',
      secondaryIdNumber: 'XYZMA5678G',
      address: '78, Ukkadam Big Bazaar Street',
      city: 'Coimbatore',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cust_004',
      name: 'Priya Shanmugam',
      phone: '9876543213',
      primaryIdType: 'aadhaar',
      primaryIdNumber: '3456-7890-1234',
      secondaryIdType: 'pan',
      secondaryIdNumber: 'DEFPS9012H',
      address: '23, Saibaba Colony',
      city: 'Coimbatore',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cust_005',
      name: 'Venkatesh Iyer',
      phone: '9876543214',
      primaryIdType: 'aadhaar',
      primaryIdNumber: '4567-8901-2345',
      address: '56, Peelamedu Main Road',
      city: 'Coimbatore',
      createdAt: now,
      updatedAt: now,
    },
  ];

  setAll(STORE_KEYS.customers, customers);

  // Seed loans
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const tenDaysFromNow = new Date();
  tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

  const fourMonthsFromNow = new Date();
  fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4);

  const loans: Loan[] = [
    {
      id: 'loan_001',
      loanNumber: 'PV-2026-0001',
      customerId: 'cust_001',
      customerName: 'Rajesh Kumar',
      customerPhone: '9876543210',
      branchId: 'branch_001',
      items: [
        {
          id: 'item_001',
          metalType: 'gold',
          itemType: 'chain',
          grossWeight: 25.5,
          netWeight: 24.8,
          purity: '916',
          ratePerGram: 7200,
          itemValue: 163565,
        },
        {
          id: 'item_002',
          metalType: 'gold',
          itemType: 'ring',
          grossWeight: 8.2,
          netWeight: 7.9,
          purity: '750',
          ratePerGram: 7200,
          itemValue: 42660,
        },
      ],
      totalGrossWeight: 33.7,
      totalNetWeight: 32.7,
      totalAppraisedValue: 206225,
      ltvPercent: 75,
      loanAmount: 154669,
      interestMode: 'flat',
      interestRate: 1.5,
      tenureMonths: 6,
      startDate: twoMonthsAgo.toISOString(),
      dueDate: fourMonthsFromNow.toISOString(),
      status: 'active',
      interestAccrued: 4640,
      amountPaid: 0,
      createdAt: twoMonthsAgo.toISOString(),
      updatedAt: now,
    },
    {
      id: 'loan_002',
      loanNumber: 'PV-2026-0002',
      customerId: 'cust_002',
      customerName: 'Lakshmi Devi',
      customerPhone: '9876543211',
      branchId: 'branch_001',
      items: [
        {
          id: 'item_003',
          metalType: 'gold',
          itemType: 'necklace',
          grossWeight: 45.0,
          netWeight: 43.5,
          purity: '916',
          ratePerGram: 7200,
          itemValue: 286927,
        },
      ],
      totalGrossWeight: 45.0,
      totalNetWeight: 43.5,
      totalAppraisedValue: 286927,
      ltvPercent: 75,
      loanAmount: 215195,
      interestMode: 'flat',
      interestRate: 1.5,
      tenureMonths: 6,
      startDate: oneMonthAgo.toISOString(),
      dueDate: twoMonthsFromNow.toISOString(),
      status: 'active',
      interestAccrued: 3228,
      amountPaid: 3228,
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: now,
    },
    {
      id: 'loan_003',
      loanNumber: 'PV-2026-0003',
      customerId: 'cust_003',
      customerName: 'Mohammed Ali',
      customerPhone: '9876543212',
      branchId: 'branch_001',
      items: [
        {
          id: 'item_004',
          metalType: 'silver',
          itemType: 'bangle',
          grossWeight: 250,
          netWeight: 245,
          purity: '925',
          ratePerGram: 90,
          itemValue: 20393,
        },
        {
          id: 'item_005',
          metalType: 'silver',
          itemType: 'chain',
          grossWeight: 120,
          netWeight: 118,
          purity: '925',
          ratePerGram: 90,
          itemValue: 9824,
        },
      ],
      totalGrossWeight: 370,
      totalNetWeight: 363,
      totalAppraisedValue: 30217,
      ltvPercent: 70,
      loanAmount: 21152,
      interestMode: 'flat',
      interestRate: 2.0,
      tenureMonths: 3,
      startDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: fiveDaysAgo.toISOString(),
      status: 'overdue',
      interestAccrued: 1269,
      amountPaid: 0,
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'loan_004',
      loanNumber: 'PV-2026-0004',
      customerId: 'cust_004',
      customerName: 'Priya Shanmugam',
      customerPhone: '9876543213',
      branchId: 'branch_001',
      items: [
        {
          id: 'item_006',
          metalType: 'gold',
          itemType: 'earring',
          grossWeight: 5.8,
          netWeight: 5.5,
          purity: '916',
          ratePerGram: 7200,
          itemValue: 36295,
        },
      ],
      totalGrossWeight: 5.8,
      totalNetWeight: 5.5,
      totalAppraisedValue: 36295,
      ltvPercent: 75,
      loanAmount: 27221,
      interestMode: 'flat',
      interestRate: 1.5,
      tenureMonths: 6,
      startDate: fiveDaysAgo.toISOString(),
      dueDate: tenDaysFromNow.toISOString(),
      status: 'active',
      interestAccrued: 0,
      amountPaid: 0,
      createdAt: fiveDaysAgo.toISOString(),
      updatedAt: now,
    },
    {
      id: 'loan_005',
      loanNumber: 'PV-2026-0005',
      customerId: 'cust_005',
      customerName: 'Venkatesh Iyer',
      customerPhone: '9876543214',
      branchId: 'branch_001',
      items: [
        {
          id: 'item_007',
          metalType: 'gold',
          itemType: 'coin',
          grossWeight: 10.0,
          netWeight: 10.0,
          purity: '999',
          ratePerGram: 7200,
          itemValue: 72000,
        },
      ],
      totalGrossWeight: 10.0,
      totalNetWeight: 10.0,
      totalAppraisedValue: 72000,
      ltvPercent: 75,
      loanAmount: 54000,
      interestMode: 'reducing',
      interestRate: 1.0,
      tenureMonths: 12,
      startDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'overdue',
      interestAccrued: 2700,
      amountPaid: 10000,
      closedDate: undefined,
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now,
    },
  ];

  setAll(STORE_KEYS.loans, loans);

  // Seed settings
  const defaultSettings = settingsStore.get();
  settingsStore.save({
    ...defaultSettings,
    shopName: 'Sri Ganesh Jewel Loans',
    shopAddress: '123, Oppanakara Street, Town Hall, Coimbatore - 641001',
    shopPhone: '0422-2345678',
    licenseNumber: 'TN/CBE/PB/2024/001',
    loanNumberCounter: 6,
  });
}
