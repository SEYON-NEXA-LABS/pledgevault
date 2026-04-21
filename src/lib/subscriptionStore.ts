'use client';

import { PlanTier, SubscriptionStatus } from './types';

export interface SubscriptionState {
  planId: PlanTier;
  status: SubscriptionStatus;
  endDate: string | null;
  isHydrated: boolean;
}

const STORAGE_KEY = 'pv_subscription_state';

const DEFAULT_STATE: SubscriptionState = {
  planId: 'free',
  status: 'active',
  endDate: null,
  isHydrated: false,
};

export const subscriptionStore = {
  get: (): SubscriptionState => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? { ...DEFAULT_STATE, ...JSON.parse(data), isHydrated: true } : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  },

  set: (state: Partial<SubscriptionState>) => {
    const current = subscriptionStore.get();
    const updated = { ...current, ...state, isHydrated: true };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Dispatch event for reactive components (like Header/Sidebar)
      window.dispatchEvent(new Event('pv_subscription_updated'));
    }
    return updated;
  },

  isTrial: () => {
    const state = subscriptionStore.get();
    // We check either explicitly trial status or if payment method was trial (this depends on your DB schema mapping)
    // For simplicity, we'll check if the endDate is set and status is active while plan is elite/pro trial
    return state.status === 'active' && !!state.endDate;
  },

  getDaysRemaining: () => {
    const state = subscriptionStore.get();
    if (!state.endDate) return 0;
    
    const end = new Date(state.endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  },

  isExpired: () => {
    const state = subscriptionStore.get();
    if (!state.endDate) return false;
    
    const end = new Date(state.endDate);
    const now = new Date();
    return now > end;
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
