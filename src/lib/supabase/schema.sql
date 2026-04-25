-- ============================================
-- PledgeVault — SaaS Multi-tenant Schema
-- ============================================

-- 1. Firms Table (The Shop/Organization)
CREATE TABLE firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- for branded login URLs
  short_code TEXT, -- for loan prefixes (e.g. GDS)
  branding_config JSONB DEFAULT '{"primary_color": "#107B88", "login_greeting": "Welcome back"}'::jsonb,
  loan_counter BIGINT DEFAULT 0,
  plan TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Global Market Rates (Shared for Platform-wide economy)
CREATE TABLE market_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gold_24k NUMERIC NOT NULL,
  silver NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles Table (User Roles & Firm association)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  default_branch_id UUID, -- Optional: assigned by manager
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Branches Table
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  license_number TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(firm_id, code) -- Code unique within a firm
);

-- 4. Customers Table 
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  -- Primary ID (Mandatory)
  primary_id_type TEXT DEFAULT 'aadhaar',
  primary_id_number TEXT,
  primary_id_photo TEXT,
  -- Secondary ID (Optional)
  secondary_id_type TEXT,
  secondary_id_number TEXT,
  secondary_id_photo TEXT,
  selfie_photo TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  pincode TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
 );

-- 5. Loans Table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  loan_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  branch_id UUID REFERENCES branches(id),
  total_gross_weight NUMERIC NOT NULL,
  total_net_weight NUMERIC NOT NULL,
  total_appraised_value NUMERIC NOT NULL,
  ltv_percent NUMERIC NOT NULL,
  loan_amount NUMERIC NOT NULL,
  interest_mode TEXT NOT NULL, 
  interest_rate NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL, 
  interest_accrued NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  closed_date TIMESTAMPTZ,
  remarks TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(firm_id, loan_number) -- Loan number unique within a firm
);

-- 6. Items Table
CREATE TABLE loan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  metal_type TEXT NOT NULL,
  item_type TEXT NOT NULL,
  description TEXT,
  gross_weight NUMERIC NOT NULL,
  net_weight NUMERIC NOT NULL,
  purity TEXT NOT NULL,
  rate_per_gram NUMERIC NOT NULL,
  item_value NUMERIC NOT NULL,
  photo_base64 TEXT, -- Item proof 
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id), -- Where the payment was received
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  remarks TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Shop Settings
CREATE TABLE shop_settings (
  firm_id UUID PRIMARY KEY REFERENCES firms(id) ON DELETE CASCADE,
  shop_address TEXT,
  shop_phone TEXT,
  license_number TEXT, -- Global fallback (deprecated, moving to branches)
  gst_number TEXT,
  registration_number TEXT,
  gold_rate_24k NUMERIC DEFAULT 0,
  gold_rate_22k NUMERIC DEFAULT 0,
  silver_rate_999 NUMERIC DEFAULT 0,
  default_ltv_gold NUMERIC DEFAULT 75,
  default_ltv_silver NUMERIC DEFAULT 70,
  default_interest_rate NUMERIC DEFAULT 1.5,
  default_interest_mode TEXT DEFAULT 'flat',
  default_tenure INTEGER DEFAULT 6,
  loan_number_prefix TEXT DEFAULT 'PV',
  loan_number_counter INTEGER DEFAULT 1,
  active_branch_id UUID REFERENCES branches(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Subscriptions Table (Billing History)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL, -- 'free', 'starter', 'pro', 'elite'
  interval TEXT NOT NULL, -- 'monthly', 'yearly'
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT NOT NULL, -- 'upi', 'card', 'netbanking', 'cash', 'trial'
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'canceled', 'past_due', 'trial'
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) policies
-- ============================================

-- A. Safe Lookup Functions (SECURITY DEFINER to avoid recursion)
-- These functions bypass RLS to lookup common user attributes

CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_auth_firm()
RETURNS UUID AS $$
  SELECT firm_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Compatibility wrapper for existing queries
CREATE OR REPLACE FUNCTION get_my_firm() 
RETURNS UUID AS $$
  SELECT get_auth_firm();
$$ LANGUAGE sql STABLE;

-- Apply RLS to all Tables
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy: Users can only interact with rows belonging to their firm
-- Admin & Superadmin role-based access integrated through get_auth_role()

DROP POLICY IF EXISTS "Firm Isolation" ON firms;
CREATE POLICY "Firm Isolation" ON firms FOR ALL USING (id = get_auth_firm() OR get_auth_role() IN ('superadmin', 'admin'));

DROP POLICY IF EXISTS "Profile Isolation" ON profiles;
CREATE POLICY "Profile Isolation" ON profiles FOR ALL USING (id = auth.uid() OR get_auth_role() = 'superadmin');

DROP POLICY IF EXISTS "Branch Isolation" ON branches;
CREATE POLICY "Branch Isolation" ON branches FOR ALL USING (firm_id = get_auth_firm() OR get_auth_role() = 'superadmin');

DROP POLICY IF EXISTS "Customer Isolation" ON customers;
CREATE POLICY "Customer Isolation" ON customers FOR ALL USING (firm_id = get_auth_firm() OR get_auth_role() = 'superadmin');

DROP POLICY IF EXISTS "Loan Isolation" ON loans;
CREATE POLICY "Loan Isolation" ON loans FOR ALL USING (firm_id = get_auth_firm() OR get_auth_role() = 'superadmin');

DROP POLICY IF EXISTS "Item Isolation" ON loan_items;
CREATE POLICY "Item Isolation" ON loan_items FOR ALL USING (firm_id = get_auth_firm() OR get_auth_role() = 'superadmin');

DROP POLICY IF EXISTS "Payment Isolation" ON payments;
CREATE POLICY "Payment Isolation" ON payments FOR ALL USING (firm_id = get_auth_firm() OR get_auth_role() = 'superadmin');

DROP POLICY IF EXISTS "Settings Isolation" ON shop_settings;
CREATE POLICY "Settings Isolation" ON shop_settings FOR ALL USING (firm_id = get_auth_firm() OR get_auth_role() = 'superadmin');

DROP POLICY IF EXISTS "Subscription Isolation" ON subscriptions;
CREATE POLICY "Subscription Isolation" ON subscriptions FOR ALL USING (firm_id = get_auth_firm() OR get_auth_role() = 'superadmin');

-- Role based access (example): Only admins can delete loans
-- CREATE POLICY "Admin Delete" ON loans FOR DELETE USING (get_my_firm() = firm_id AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 9. Optimized Analytics Function (Updated for SaaS)
CREATE OR REPLACE FUNCTION get_firm_stats()
RETURNS JSON AS $$
DECLARE
  f_id UUID;
  result JSON;
BEGIN
  f_id := get_my_firm();
  
  SELECT json_build_object(
    'total_active_loans', (SELECT COUNT(*) FROM public.loans WHERE firm_id = f_id AND status IN ('active', 'overdue')),
    'total_active_loan_value', (SELECT COALESCE(SUM(loan_amount), 0) FROM public.loans WHERE firm_id = f_id AND status IN ('active', 'overdue')),
    'total_gold_weight', (
       SELECT COALESCE(SUM(net_weight), 0) FROM loan_items li 
       JOIN loans l ON li.loan_id = l.id 
       WHERE li.metal_type = 'gold' AND l.status IN ('active', 'overdue') AND l.firm_id = f_id
    ),
    'total_silver_weight', (
       SELECT COALESCE(SUM(net_weight), 0) FROM loan_items li 
       JOIN loans l ON li.loan_id = l.id 
       WHERE li.metal_type = 'silver' AND l.status IN ('active', 'overdue') AND l.firm_id = f_id
    ),
    'total_customers', (SELECT COUNT(*) FROM public.customers WHERE firm_id = f_id),
    'total_monthly_interest', (SELECT COALESCE(SUM(loan_amount * interest_rate / 100), 0) FROM public.loans WHERE firm_id = f_id AND status IN ('active', 'overdue')),
    'recent_loans', (
       SELECT COALESCE(json_agg(t), '[]'::json) FROM (
         SELECT id, loan_number, customer_name, customer_phone, loan_amount, status, created_at
         FROM public.loans 
         WHERE firm_id = f_id 
         ORDER BY created_at DESC 
         LIMIT 5
       ) t
    ),
    'overdue_count', (SELECT COUNT(*) FROM public.loans WHERE firm_id = f_id AND status = 'overdue'),
    'metal_distribution', (
       SELECT COALESCE(json_agg(json_build_object('name', metal_type, 'value', weight_sum)), '[]'::json) FROM (
         SELECT li.metal_type, SUM(li.net_weight) as weight_sum
         FROM loan_items li
         JOIN loans l ON li.loan_id = l.id
         WHERE l.firm_id = f_id AND l.status IN ('active', 'overdue')
         GROUP BY li.metal_type
       ) d
    ),
    'monthly_trends', (
       SELECT COALESCE(json_agg(json_build_object('month', month_label, 'gold', gold_count, 'silver', silver_count)), '[]'::json) FROM (
         SELECT 
           to_char(created_at, 'Mon') as month_label,
           COUNT(*) as gold_count,
           0 as silver_count
         FROM loans
         WHERE firm_id = f_id 
         AND (p_branch_id IS NULL OR branch_id = p_branch_id)
         AND created_at >= now() - interval '6 months'
         GROUP BY month_label, date_trunc('month', created_at)
         ORDER BY date_trunc('month', created_at) ASC
       ) m
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Global Superadmin Analytics
CREATE OR REPLACE FUNCTION get_superadmin_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allowed for superadmins
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'superadmin' THEN
    RAISE EXCEPTION 'Unauthorized: Superadmin access required';
  END IF;

  SELECT json_build_object(
    'total_firms', (SELECT COUNT(*) FROM firms),
    'total_loans', (SELECT COUNT(*) FROM loans),
    'total_loan_value', (SELECT COALESCE(SUM(loan_amount), 0) FROM loans),
    'total_gold_weight', (SELECT COALESCE(SUM(net_weight), 0) FROM loan_items WHERE metal_type = 'gold'),
    'total_silver_weight', (SELECT COALESCE(SUM(net_weight), 0) FROM loan_items WHERE metal_type = 'silver'),
    'active_users', (SELECT COUNT(*) FROM profiles)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Branch Metrics (Enterprise Level)
CREATE OR REPLACE FUNCTION get_branches_with_metrics(f_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  location TEXT,
  phone TEXT,
  is_active BOOLEAN,
  active_loans_count BIGINT,
  total_gold_weight NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.code,
    b.location,
    b.phone,
    b.is_active,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status IN ('active', 'overdue')) as active_loans_count,
    COALESCE(SUM(li.net_weight) FILTER (WHERE li.metal_type = 'gold' AND l.status IN ('active', 'overdue')), 0) as total_gold_weight
  FROM public.branches b
  LEFT JOIN public.loans l ON b.id = l.branch_id
  LEFT JOIN public.loan_items li ON l.id = li.loan_id
  WHERE b.firm_id = f_id
  GROUP BY b.id, b.name, b.code, b.location, b.phone, b.is_active
  ORDER BY b.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. System Integrity Diagnostic Function
CREATE OR REPLACE FUNCTION check_db_integrity()
RETURNS JSON AS $$
DECLARE
  tables_status JSON;
  columns_status JSON;
  functions_status JSON;
  rls_status JSON;
  result JSON;
BEGIN
  -- Only allowed for superadmins
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'superadmin' THEN
    RAISE EXCEPTION 'Unauthorized: Superadmin access required';
  END IF;

  -- Check Tables
  SELECT json_agg(json_build_object(
    'table_name', table_name,
    'exists', true
  )) INTO tables_status
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('firms', 'profiles', 'branches', 'customers', 'loans', 'loan_items', 'payments', 'shop_settings', 'subscriptions', 'audit_logs', 'market_rates');

  -- Check Critical Columns (The ones added during refinements)
  SELECT json_agg(json_build_object(
    'table_name', table_name,
    'column_name', column_name,
    'exists', true
  )) INTO columns_status
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND (
    (table_name = 'profiles' AND column_name = 'default_branch_id') OR
    (table_name = 'payments' AND column_name = 'branch_id') OR
    (table_name = 'loans' AND column_name = 'created_by') OR
    (table_name = 'payments' AND column_name = 'created_by') OR
    (table_name = 'customers' AND column_name = 'created_by') OR
    (table_name = 'shop_settings' AND column_name = 'default_interest_mode') OR
    (table_name = 'shop_settings' AND column_name = 'default_tenure') OR
    (table_name = 'firms' AND column_name = 'loan_counter') OR
    (table_name = 'firms' AND column_name = 'plan') OR
    (table_name = 'audit_logs' AND column_name = 'actor_id') OR
    (table_name = 'audit_logs' AND column_name = 'entity_type')
  );

  -- Check Security (RLS)
  SELECT json_agg(json_build_object(
    'table_name', tablename,
    'rls_enabled', rowsecurity
  )) INTO rls_status
  FROM pg_tables
  JOIN pg_class ON pg_tables.tablename = pg_class.relname
  WHERE schemaname = 'public'
  AND tablename IN ('loans', 'payments', 'customers', 'profiles');

  -- Check Functions
  SELECT json_agg(json_build_object(
    'function_name', routine_name,
    'exists', true
  )) INTO functions_status
  FROM information_schema.routines
  WHERE routine_schema = 'public' 
  AND routine_name IN ('get_firm_stats', 'get_superadmin_stats', 'check_db_integrity', 'get_global_activity_feed', 'increment_loan_counter');

  SELECT json_build_object(
    'tables', COALESCE(tables_status, '[]'::json),
    'columns', COALESCE(columns_status, '[]'::json),
    'security', COALESCE(rls_status, '[]'::json),
    'functions', COALESCE(functions_status, '[]'::json),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11b. Schema Column Fetcher (for external verification script)
CREATE OR REPLACE FUNCTION get_schema_metadata()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.table_name::TEXT, 
    c.column_name::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name NOT IN ('pg_stat_user_tables', 'pg_statio_user_tables');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Atomic Loan Counter
CREATE OR REPLACE FUNCTION increment_loan_counter(f_id UUID)
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE firms 
  SET loan_counter = loan_counter + 1 
  WHERE id = f_id 
  RETURNING loan_counter INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Audit Logs (System Activity Tracking)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'loan', 'customer', 'firm'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'closed', 'updated'
  actor_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Optimized Views for Egress Reduction
-- This view allows us to fetch customer names AND their active loan counts in ONE query.
CREATE OR REPLACE VIEW v_customer_summaries AS
SELECT 
  c.id,
  c.firm_id,
  c.name,
  c.phone,
  c.city,
  c.primary_id_type as id_type,
  c.primary_id_number as id_number,
  c.created_at,
  COALESCE(count(l.id) FILTER (WHERE l.status IN ('active', 'overdue')), 0) as active_loans_count
FROM customers c
LEFT JOIN loans l ON c.id = l.customer_id
GROUP BY c.id;

-- 14. Activity Tracking Function
CREATE OR REPLACE FUNCTION log_system_activity(
  p_firm_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_message TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (firm_id, entity_type, entity_id, action, actor_id, message)
  VALUES (p_firm_id, p_entity_type, p_entity_id, p_action, auth.uid(), p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Global Activity Feed (Optimized for Superadmin)
CREATE OR REPLACE FUNCTION get_global_activity_feed(p_limit INTEGER DEFAULT 10)
RETURNS JSON AS $$
BEGIN
  -- Only allowed for superadmins
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'superadmin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT json_agg(t) FROM (
      SELECT 
        a.message,
        a.created_at as time,
        f.name as firm_name
      FROM audit_logs a
      LEFT JOIN firms f ON a.firm_id = f.id
      ORDER BY a.created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Trigger for Auto-Logging Loan Creation
CREATE OR REPLACE FUNCTION tr_log_loan_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_system_activity(
    NEW.firm_id, 
    'loan', 
    NEW.id, 
    'created', 
    'New loan ' || NEW.loan_number || ' generated for ' || NEW.customer_name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_loan_created
  AFTER INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION tr_log_loan_creation();


-- 17. Reporting RPC
CREATE OR REPLACE FUNCTION get_reports_data(
  p_firm_id UUID,
  p_branch_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON AS 
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'total_principal_disbursed', COALESCE(SUM(loan_amount), 0),
        'total_interest_collected', (
           SELECT COALESCE(SUM(amount), 0) FROM payments 
           WHERE firm_id = p_firm_id 
           AND (p_branch_id IS NULL OR branch_id = p_branch_id)
           AND payment_date >= COALESCE(p_start_date, now() - interval '30 days')
           AND payment_date <= COALESCE(p_end_date, now())
        ),
        'outstanding_principal', (
           SELECT COALESCE(SUM(loan_amount - amount_paid), 0) FROM loans 
           WHERE firm_id = p_firm_id AND status IN ('active', 'overdue')
           AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        ),
        'active_count', (
           SELECT COUNT(*) FROM loans 
           WHERE firm_id = p_firm_id AND status IN ('active', 'overdue')
           AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        )
      )
      FROM loans
      WHERE firm_id = p_firm_id 
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND created_at >= COALESCE(p_start_date, now() - interval '30 days')
      AND created_at <= COALESCE(p_end_date, now())
    ),
    'delinquent_loans', (
       SELECT COALESCE(json_agg(t), '[]'::json) FROM (
         SELECT id, loan_number, customer_name, loan_amount, status, due_date
         FROM loans
         WHERE firm_id = p_firm_id 
         AND status = 'overdue'
         AND (p_branch_id IS NULL OR branch_id = p_branch_id)
         ORDER BY due_date ASC
         LIMIT 10
       ) t
    ),
    'daily_earnings', (
       SELECT COALESCE(json_agg(json_build_object('date', d, 'amount', COALESCE(sum_amount, 0))), '[]'::json) FROM (
         SELECT date_trunc('day', payment_date) as d, SUM(amount) as sum_amount
         FROM payments
         WHERE firm_id = p_firm_id 
         AND (p_branch_id IS NULL OR branch_id = p_branch_id)
         AND payment_date >= COALESCE(p_start_date, now() - interval '30 days')
         AND payment_date <= COALESCE(p_end_date, now())
         GROUP BY 1
         ORDER BY 1 ASC
       ) e
    )
  ) INTO result;

  RETURN result;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

