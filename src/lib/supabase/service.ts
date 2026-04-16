import { supabase } from './client';
import { Customer, Loan, Payment, ShopSettings, Branch, DashboardStats } from '../types';

export const supabaseService = {
  // ---- Customers ----
  // ---- Auth & Profiles ----
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, firms(name)')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // ---- Customers (Firm-wide) ----
  async getCustomers(firmId: string, page = 0, pageSize = 20) {
    const { data, count, error } = await supabase
      .from('customers')
      .select('id, name, phone, city, created_at', { count: 'exact' }) 
      .eq('firm_id', firmId)
      .order('name')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    return { data: data as Partial<Customer>[], total: count || 0 };
  },

  async getCustomerWithDetails(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Customer;
  },

  async createCustomer(customer: Omit<Customer, 'id'>) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
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
    return { data: data as Partial<Loan>[], total: count || 0 };
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
      .select('*, items:loan_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Loan;
  },

  async createLoan(loan: Omit<Loan, 'id'>) {
    // Separate items from loan data for insertion
    const { items, ...loanData } = loan as any;
    
    // 1. Insert Loan
    const { data: newLoan, error: loanError } = await supabase
      .from('loans')
      .insert([loanData])
      .select()
      .single();
    
    if (loanError) throw loanError;

    // 2. Insert Items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        ...item,
        loan_id: newLoan.id
      }));
      const { error: itemsError } = await supabase
        .from('loan_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
    }

    return newLoan as Loan;
  },

  // ---- Payments ----
  async getPayments(loanId?: string) {
    let query = supabase.from('payments').select('*');
    if (loanId) query = query.eq('loan_id', loanId);
    
    const { data, error } = await query.order('payment_date', { ascending: false });
    if (error) throw error;
    return data as Payment[];
  },

  async createPayment(payment: Omit<Payment, 'id'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  // ---- Settings ----
  async getSettings() {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .single();
    if (error) return null;
    
    // Map snake_case to camelCase
    return {
      shopName: data.shop_name,
      shopAddress: data.shop_address,
      shopPhone: data.shop_phone,
      licenseNumber: data.license_number,
      goldRate24K: data.gold_rate_24k,
      silverRate999: data.silver_rate_999,
      defaultLtvGold: data.default_ltv_gold,
      defaultLtvSilver: data.default_ltv_silver,
      defaultInterestRate: data.default_interest_rate,
      defaultInterestMode: data.default_interest_mode,
      defaultTenure: data.default_tenure,
      loanNumberPrefix: data.loan_number_prefix,
      loanNumberCounter: data.loan_number_counter,
      activeBranchId: data.active_branch_id,
      branches: [], // Branches are fetched via getBranches()
    } as ShopSettings;
  },

  async updateSettings(settings: Partial<ShopSettings>) {
    // Map camelCase to snake_case
    const mapped: any = {};
    if (settings.shopName !== undefined) mapped.shop_name = settings.shopName;
    if (settings.shopAddress !== undefined) mapped.shop_address = settings.shopAddress;
    if (settings.shopPhone !== undefined) mapped.shop_phone = settings.shopPhone;
    if (settings.licenseNumber !== undefined) mapped.license_number = settings.licenseNumber;
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
    // branches are not part of shop_settings table columns

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
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('firm_id', firmId)
      .order('name');
    if (error) throw error;
    return data as Branch[];
  },

  // ---- Analytics (Egress Optimized) ----
  // ---- Analytics (Firm-wide) ----
  async getDashboardStats() {
    const { data, error } = await supabase.rpc('get_firm_stats');
    if (error) throw error;
    
    // Map snake_case to camelCase
    return {
      totalActiveLoans: data?.total_active_loans || 0,
      totalActiveLoanValue: data?.total_active_loan_value || 0,
      totalGoldWeight: data?.total_gold_weight || 0,
      totalSilverWeight: data?.total_silver_weight || 0,
      overdueLoans: data?.overdue_loans || 0,
      monthlyInterestEarned: data?.monthly_interest_earned || 0,
      totalCustomers: data?.total_customers || 0,
      recentLoans: data?.recent_loans || [],
      overdueList: data?.overdue_list || [],
      loansByMonth: (data?.loans_by_month || []).map((m: any) => ({
        month: m.month,
        count: m.count || 0,
        value: m.value || 0
      })),
      metalDistribution: (data?.metal_distribution || []).map((d: any) => ({
        type: d.type,
        weight: d.weight || 0
      })),
    } as DashboardStats;
  }
};
