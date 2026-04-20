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
  !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
      window.dispatchEvent(new Event('pv_settings_updated'));
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

// Seeding functionality has been moved to CLI scripts (scripts/seed-cloud-data.ts)
// The seedDemoData function has been removed to maintain the "Live App" integrity.
