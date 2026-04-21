import { supabase } from './client';
import { DEFAULT_SETTINGS, generateLoanNumber } from '../constants';
import { Customer, Loan, Payment, ShopSettings, Branch, DashboardStats, Subscription, BrandingConfig } from '../types';

// Simple snake_case to camelCase mapper
const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj === null || typeof obj !== 'object') return obj;
  return Object.keys(obj).reduce((acc: any, key) => {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    acc[camelKey] = toCamel(obj[key]);
    return acc;
  }, {});
};

// Simple camelCase to snake_case mapper
const toSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj === null || typeof obj !== 'object') return obj;
  return Object.keys(obj).reduce((acc: any, key) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnake(obj[key]);
    return acc;
  }, {});
};

// UUID Validator to prevent "undefined" string crashes
const isValidUUID = (id: any): boolean => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const supabaseService = {
  // ---- Customers ----
  // ---- Auth & Profiles ----
  async getUserProfile(userId: string) {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, role, firm_id, full_name, default_branch_id, firms(name, plan)')
      .eq('id', userId)
      .single();
    
    if (error) throw error;

    // Fallback: If this is the current logged in user, fetch their email from Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    let email = null;
    if (user && user.id === userId) {
      email = user.email;
    } else if (authError && authError.name === 'AuthApiError' && (authError as any).code === 'refresh_token_not_found') {
      console.warn('Session expired during profile fetch');
    }

    return {
      ...toCamel(profileData),
      email
    };
  },

  async updateUserProfile(userId: string, updates: any) {
    const dbUpdates = toSnake(updates);
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return toCamel(data);
  },

  async getFirmTeam(firmId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, full_name, role, default_branch_id, is_active, created_at,
        branches:default_branch_id (id, name)
      `)
      .eq('firm_id', firmId)
      .order('role', { ascending: false });
    
    if (error) throw error;
    return toCamel(data);
  },

  async updateMemberStatus(userId: string, isActive: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    if (error) throw error;
    return true;
  },

  async updateMemberProfile(userId: string, updates: any) {
    const dbUpdates = toSnake(updates);
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return toCamel(data);
  },

  // ---- Customers (Firm-wide) ----
  async getCustomers(firmId: string, page = 0, pageSize = 20) {
    const { data, count, error } = await supabase
      .from('v_customer_summaries')
      .select('id, name, phone, city, id_type, id_number, active_loans_count', { count: 'exact' }) 
      .eq('firm_id', firmId)
      .order('name')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) throw error;
    return { data: data as any[], total: count || 0 };
  },

  async getCustomerWithDetails(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, firm_id, name, phone, email, address, city, state, pincode, primary_id_type, primary_id_number, selfie_photo, created_at, created_by')
      .eq('id', id)
      .single();
    if (error) throw error;
    return toCamel(data) as Customer;
  },

  async createCustomer(customer: Omit<Customer, 'id'>) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required to create a customer. Session may have expired.');
    }
    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customer, created_by: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  },

  // ---- Loans ----
  // ---- Loans (Branch-specific or Firm-wide) ----
  async getLoans(firmId: string, branchId?: string, page = 0, pageSize = 20, status?: string) {
    let query = supabase
      .from('loans')
      .select('id, loan_number, customer_name, customer_phone, loan_amount, status, start_date, due_date', { count: 'exact' })
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (branchId) query = query.eq('branch_id', branchId);
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) throw error;
    return { 
      data: toCamel(data) as Partial<Loan>[], 
      total: count || 0 
    };
  },
  async getLoansByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('loans')
      .select('id, loan_number, loan_amount, status, start_date, due_date, items:loan_items(id, metal_type, item_type)')
      .eq('customer_id', customerId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return toCamel(data) as any[];
  },

  async updateLoanStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('loans')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getLoanWithDetails(id: string) {
    const { data, error } = await supabase
      .from('loans')
      .select('id, firm_id, branch_id, loan_number, customer_id, customer_name, customer_phone, total_gross_weight, total_net_weight, total_appraised_value, ltv_percent, loan_amount, interest_mode, interest_rate, tenure_months, start_date, due_date, status, interest_accrued, amount_paid, created_at, items:loan_items(id, item_type, metal_type, purity, gross_weight, net_weight, rate_per_gram, item_value)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return toCamel(data) as Loan;
  },

  async createLoan(loan: Omit<Loan, 'id'>) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required to create a loan.');
    }

    // Separate items from loan data for insertion
    const { items, ...loanData } = loan as any;
    
    // 1. Increment Counter & Get Format Metadata
    const { data: newCount, error: countError } = await supabase.rpc('increment_loan_counter', { f_id: items[0]?.firm_id || loanData.firm_id });
    if (countError) throw countError;

    // 2. Generate Structured Loan Number
    // Format: 2 chars firm, 2 chars branch, 7 chars sequence
    const firmPrefix = (loanData.firm_id as string).substring(0, 2).toUpperCase();
    const branchPrefix = (loanData.branch_id as string).substring(0, 2).toUpperCase();
    const formattedNumber = `${firmPrefix}_${branchPrefix}_${String(newCount).padStart(7, '0')}`;

    // 3. Insert Loan
    const { data: newLoan, error: loanError } = await supabase
      .from('loans')
      .insert([{ 
        ...loanData, 
        loan_number: formattedNumber, // Override with structured ID
        created_by: user.id 
      }])
      .select()
      .single();
    
    if (loanError) throw loanError;

    // 2. Insert Items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        ...item,
        loan_id: newLoan.id,
        created_by: user.id
      }));
      const { error: itemsError } = await supabase
        .from('loan_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
    }

    return toCamel(newLoan) as Loan;
  },

  // ---- Payments ----
  async getPayments(loanId?: string) {
    let query = supabase.from('payments').select('id, loan_id, branch_id, amount, payment_date, payment_type, notes, created_at, created_by');
    if (loanId) query = query.eq('loan_id', loanId);
    
    const { data, error } = await query.order('payment_date', { ascending: false });
    if (error) throw error;
    return toCamel(data) as Payment[];
  },

  async createPayment(payment: Omit<Payment, 'id'>) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn('Auth Error in createPayment:', authError?.message || 'No user session');
      throw new Error('Authentication required to create a payment. Please sign in again.');
    }
    
    const { data, error } = await supabase
      .from('payments')
      .insert([{ ...payment, created_by: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  // ---- Settings ----
  async getSettings() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;
    
    const profile = await this.getUserProfile(user.id);
    const firmId = profile?.firmId;

    if (!firmId) return null;

    // 1. Fetch Firm Info (Name & branding_config for White-Labeling)
    const { data: firm } = await supabase
      .from('firms')
      .select('id, name, branding_config')
      .eq('id', firmId)
      .single();

    // 2. Fetch Shop Settings
    const { data: shopData, error: shopError } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('firm_id', firmId)
      .single();
    
    // 3. Fetch Branches
    const { data: branches } = await supabase
      .from('branches')
      .select('id, firm_id, name, code, location, is_active, license_number')
      .eq('firm_id', firmId);

    // If no shop settings exist yet, return defaults
    if (shopError || !shopData) {
      return {
        ...DEFAULT_SETTINGS,
        firmId: firmId,
        shopName: firm?.name || DEFAULT_SETTINGS.shopName,
        branches: branches ? toCamel(branches) : [],
        brandingConfig: toCamel(firm?.branding_config || {}),
      } as ShopSettings;
    }

    return {
      firmId: shopData.firm_id,
      shopName: shopData.shop_name || firm?.name || DEFAULT_SETTINGS.shopName,
      shopAddress: shopData.shop_address,
      shopPhone: shopData.shop_phone,
      licenseNumber: shopData.license_number,
      gstNumber: shopData.gst_number,
      registrationNumber: shopData.registration_number,
      goldRate24K: shopData.gold_rate_24k,
      silverRate999: shopData.silver_rate_999,
      defaultLtvGold: shopData.default_ltv_gold,
      defaultLtvSilver: shopData.default_ltv_silver,
      defaultInterestRate: shopData.default_interest_rate,
      defaultInterestMode: shopData.default_interest_mode,
      defaultTenure: shopData.default_tenure,
      loanNumberPrefix: shopData.loan_number_prefix,
      loanNumberCounter: shopData.loan_number_counter,
      activeBranchId: shopData.active_branch_id,
      branches: branches ? toCamel(branches) : [],
      brandingConfig: toCamel(firm?.branding_config || {}),
    } as ShopSettings;
  },

  async getLatestMarketRates() {
    const { data, error } = await supabase
      .from('market_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  async addMarketRateEntry(gold: number, silver: number) {
    const { data, error } = await supabase
      .from('market_rates')
      .insert([{ gold_24k: gold, silver: silver }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSettings(settings: Partial<ShopSettings>) {
    // 1. Get current firm context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthenticated or session expired');
    const profile = await this.getUserProfile(user.id);
    const firmId = profile?.firmId;

    if (!firmId) throw new Error('Unauthenticated or firm missing');

    // 2. Handle Firm Name Update separately
    if (settings.shopName) {
      const { error: firmError } = await supabase
        .from('firms')
        .update({ name: settings.shopName })
        .eq('id', firmId);
      if (firmError) throw firmError;
    }

    // 3. Map settings for shop_settings table
    const mapped: any = { firm_id: firmId };
    if (settings.shopAddress !== undefined) mapped.shop_address = settings.shopAddress;
    if (settings.shopPhone !== undefined) mapped.shop_phone = settings.shopPhone;
    if (settings.licenseNumber !== undefined) mapped.license_number = settings.licenseNumber;
    if (settings.gstNumber !== undefined) mapped.gst_number = settings.gstNumber;
    if (settings.registrationNumber !== undefined) mapped.registration_number = settings.registrationNumber;
    if (settings.goldRate24K !== undefined) mapped.gold_rate_24k = settings.goldRate24K;
    if (settings.silverRate999 !== undefined) mapped.silver_rate_999 = settings.silverRate999;
    if (settings.defaultLtvGold !== undefined) mapped.default_ltv_gold = settings.defaultLtvGold;
    if (settings.defaultLtvSilver !== undefined) mapped.default_ltv_silver = settings.defaultLtvSilver;
    if (settings.defaultInterestRate !== undefined) mapped.default_interest_rate = settings.defaultInterestRate;
    if (settings.defaultInterestMode !== undefined) mapped.default_interest_mode = settings.defaultInterestMode;
    if (settings.defaultTenure !== undefined) mapped.default_tenure = settings.defaultTenure;
    if (settings.loanNumberPrefix !== undefined) mapped.loan_number_prefix = settings.loanNumberPrefix;
    if (settings.loanNumberCounter !== undefined) mapped.loan_number_counter = settings.loanNumberCounter;
    if (settings.activeBranchId !== undefined) mapped.active_branch_id = settings.activeBranchId;
    
    // Final Sanitization: "firm", "", or null/undefined must all be NULL for the UUID column
    if (!mapped.active_branch_id || mapped.active_branch_id === 'firm' || mapped.active_branch_id === '') {
      mapped.active_branch_id = null;
    }

    const { data, error } = await supabase
      .from('shop_settings')
      .upsert([mapped])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ---- Branches ----
  async getBranches(firmId: string) {
    if (!isValidUUID(firmId)) return [];
    
    const { data, error } = await supabase
      .from('branches')
      .select('id, firm_id, name, code, location, is_active, license_number')
      .eq('firm_id', firmId)
      .order('name');
    if (error) throw error;
    return toCamel(data) as Branch[];
  },

  async createBranch(branch: Partial<Branch>) {
    const dbData = toSnake(branch);
    const { data, error } = await supabase
      .from('branches')
      .insert([dbData])
      .select()
      .single();
    if (error) throw error;
    return toCamel(data) as Branch;
  },

  async deleteBranch(branchId: string) {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId);
    if (error) throw error;
    return true;
  },

  // ---- Analytics (Egress Optimized) ----
  // ---- Analytics (Firm-wide) ----
  async getDashboardStats(firmId: string, branchId?: string) {
    // Aggressive Sanitization & Parameter Alignment (p_branch_id first)
    const params = { 
      p_branch_id: (branchId && branchId !== 'firm' && branchId !== '') ? branchId : null,
      p_firm_id: firmId || null
    };
    const { data, error } = await supabase.rpc('get_firm_stats', params);
    
    if (error) {
      console.error('CRITICAL: Dashboard RPC Failed:', {
        params,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    // Map snake_case to camelCase
    return {
      totalActiveLoans: data?.total_active_loans || 0,
      totalActiveLoanValue: data?.total_active_loan_value || 0,
      totalGoldWeight: data?.total_gold_weight || 0,
      totalSilverWeight: data?.total_silver_weight || 0,
      overdueCount: data?.overdue_count || 0,
      totalCustomers: data?.total_customers || 0,
      totalMonthlyInterest: data?.total_monthly_interest || 0,
      recentLoans: toCamel(data?.recent_loans || []) as Loan[],
      loansByMonth: (data?.loans_by_month || []).map((m: any) => ({
        month: m.month,
        count: m.count || 0,
        value: m.value || 0
      })),
      metalDistribution: data?.metal_distribution || [],
    } as any; // Using any for local mapping
  },

  // ---- Subscriptions & Billing ----
  async createSubscription(subscription: Partial<Subscription>) {
    const dbData = toSnake(subscription);
    // 1. Insert subscription record
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([dbData])
      .select()
      .single();
    if (error) throw error;

    // 2. Update firm's current plan
    const { error: firmError } = await supabase
      .from('firms')
      .update({ plan: subscription.planId })
      .eq('id', subscription.firmId);
    
    if (firmError) throw firmError;
    return toCamel(data) as Subscription;
  },

  async getFirmSubscriptions(firmId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, firm_id, plan_id, status, start_date, end_date, created_at')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return toCamel(data) as Subscription[];
  },

  async getActiveSubscription(firmId: string) {
    if (!isValidUUID(firmId)) return null;
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, firm_id, plan_id, status, start_date, end_date, extension_count')
      .eq('firm_id', firmId)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // Handle "no rows" code
    return toCamel(data) as Subscription;
  },

  async getFirmsDetailed() {
    const { data, error } = await supabase
      .from('firms')
      .select(`
        id, name, slug, short_code, branding_config, created_at,
        branches(count),
        profiles(count),
        subscriptions(id, plan_id, status, start_date, end_date, amount, interval, extension_count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return toCamel(data);
  },

  async getFirmBranding(slug: string) {
    const { data, error } = await supabase
      .from('firms')
      .select('name, branding_config')
      .eq('slug', slug)
      .single();
    
    if (error) return null;
    return {
      name: data.name,
      branding: toCamel(data.branding_config) as BrandingConfig
    };
  },

  async updateFirmBranding(firmId: string, branding: Partial<BrandingConfig>) {
    const dbBranding = toSnake(branding);
    
    // Fetch current to merge
    const { data: current } = await supabase.from('firms').select('branding_config').eq('id', firmId).single();
    const merged = { ...(current?.branding_config || {}), ...dbBranding };

    const { error } = await supabase
      .from('firms')
      .update({ branding_config: merged })
      .eq('id', firmId);
    if (error) throw error;
  },

  async updateFirmMetadata(firmId: string, metadata: { name?: string, slug?: string, shortCode?: string }) {
    const { name, slug, shortCode } = metadata;
    const { error } = await supabase
      .from('firms')
      .update({ 
        name, 
        slug, 
        short_code: shortCode 
      })
      .eq('id', firmId);
    if (error) throw error;
  },

  canExtendSubscription(sub: any) {
    const MAX_EXTENSIONS = 2;
    if (!sub) return { allowed: false, reason: 'No subscription found' };
    
    // Convert from DB if needed
    const extensionCount = sub.extensionCount || sub.extension_count || 0;
    const planId = sub.planId || sub.plan_id;

    if (planId !== 'elite' && planId !== 'pro') {
       return { allowed: false, reason: 'Manual extensions only for Trial plans' };
    }
    if (extensionCount >= MAX_EXTENSIONS) {
      return { allowed: false, reason: `Maximum of ${MAX_EXTENSIONS} extensions reached for this firm.` };
    }
    return { allowed: true };
  },

  async extendSubscription(firmId: string, days: number) {
    const sub = await this.getActiveSubscription(firmId);
    if (!sub) throw new Error('No active subscription found to extend');

    const check = this.canExtendSubscription(sub);
    if (!check.allowed) throw new Error(check.reason);

    const newEnd = new Date(sub.endDate);
    newEnd.setDate(newEnd.getDate() + days);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ 
        end_date: newEnd.toISOString(),
        extension_count: (sub.extensionCount || 0) + 1
      })
      .eq('id', sub.id)
      .select()
      .single();
    
    if (error) throw error;
    return toCamel(data) as Subscription;
  },

  async getActiveLoanCount(firmId: string) {
    if (!isValidUUID(firmId)) return 0;
    
    const { count, error } = await supabase
      .from('loans')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('status', 'active');
    
    if (error) throw error;
    return count || 0;
  },

  // ---- System Integrity & Diagnostics ----
  async checkSystemIntegrity() {
    // 1. Fetch all tables and columns
    const { data: columns, error: colError } = await supabase
      .from('pg_catalog.pg_stat_user_tables' as any)
      .select('relname')
      .neq('relname', 'pg_stat_user_tables'); // Basic table list

    // Better: use RPC or direct SQL if possible, but since we are constrained to client:
    // We will query the information_schema via a trick or just use the known table structures.
    // Actually, for a real integrity check, we should use a custom RPC or direct query.
    // Since we created get_superadmin_stats as a SECURITY DEFINER, we should create a diagnose_schema RPC.
    
    // For now, let's fetch metadata using available public views if permissions allow
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('check_db_integrity'); // We'll need to define this RPC

    if (schemaError) {
      console.warn('RPC check_db_integrity not found. Falling back to basic connectivity check.');
      return { success: false, error: 'Integrity RPC missing. Please run the provided SQL migration.' };
    }

    return schemaInfo;
  },

  // ---- Global Dashboard (Superadmin) ----
  async getGlobalActivityFeed(limit = 10) {
    const { data, error } = await supabase.rpc('get_global_activity_feed', { p_limit: limit });
    if (error) throw error;
    return data;
  }
};
