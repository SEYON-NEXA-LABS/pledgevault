'use client';

export type UserRole = 'superadmin' | 'manager' | 'staff';

interface AuthState {
  userId: string | null;
  role: UserRole;
  firmId: string | null;
  userName: string | null;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'pv_auth_state';

const DEFAULT_STATE: AuthState = {
  userId: null,
  role: 'staff',
  firmId: null,
  userName: null,
  isAuthenticated: false,
};

export const authStore = {
  get: (): AuthState => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? { ...DEFAULT_STATE, ...JSON.parse(data) } : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  },

  set: (state: Partial<AuthState>) => {
    const current = authStore.get();
    const updated = { ...current, ...state };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  isSuperadmin: () => authStore.get().role === 'superadmin',
  isManager: () => authStore.get().role === 'manager',
  isStaff: () => authStore.get().role === 'staff',
};
