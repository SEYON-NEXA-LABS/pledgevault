-- ============================================
-- PledgeVault — Demo Seed Data for Testing
-- ============================================

-- 0. Schema Synchronisation (Ensures database is up-to-date with latest changes)
-- Sync Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alt_phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS primary_id_type TEXT DEFAULT 'aadhaar';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS primary_id_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS primary_id_photo TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS secondary_id_type TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS secondary_id_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS secondary_id_photo TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS selfie_photo TEXT;

-- Sync Loans
ALTER TABLE loans ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS interest_accrued NUMERIC DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;

-- Sync Shop Settings
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS active_branch_id UUID REFERENCES branches(id);
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS loan_number_prefix TEXT DEFAULT 'PV';
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS loan_number_counter INTEGER DEFAULT 1;

-- Sync Loan Items
ALTER TABLE loan_items ADD COLUMN IF NOT EXISTS rate_per_gram NUMERIC DEFAULT 0;
ALTER TABLE loan_items ADD COLUMN IF NOT EXISTS item_value NUMERIC DEFAULT 0;
ALTER TABLE loan_items ADD COLUMN IF NOT EXISTS photo_base64 TEXT;

-- FIX: Infinite Recursion in RLS
-- A. Safe Lookup Functions (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_auth_firm()
RETURNS UUID AS $$
  SELECT firm_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- B. Update Policies
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

-- 1. Create a Demo Firm
INSERT INTO firms (id, name, plan)
VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Seyon Jewelers', 'pro')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Two Branches
INSERT INTO branches (id, firm_id, name, code, location)
VALUES 
  ('b1111111-1111-1111-1111-111111111111', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Main Branch', 'MAIN01', 'Town Hall'),
  ('b2222222-2222-2222-2222-222222222222', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Gandhipuram Branch', 'GAND02', 'Gandhipuram')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Profiles for your Users
-- Admin User (admin@yourfirm.com)
INSERT INTO profiles (id, firm_id, full_name, role)
VALUES ('395be037-8db4-473e-bb5a-9c767023a8e3', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Firm Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', firm_id = 'd290f1ee-6c54-4b01-90e6-d701748f0851';

-- Staff User (staff@yourfirm.com)
INSERT INTO profiles (id, firm_id, full_name, role)
VALUES ('8f2bdd83-7cb0-4ae7-be9a-4612f81a3885', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Branch Staff', 'staff')
ON CONFLICT (id) DO UPDATE SET role = 'staff', firm_id = 'd290f1ee-6c54-4b01-90e6-d701748f0851';

-- 4. Initialise Shop Settings for the Firm
INSERT INTO shop_settings (firm_id, shop_address, shop_phone, active_branch_id)
VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', '123, Gold Street', '0422-123456', 'b1111111-1111-1111-1111-111111111111')
ON CONFLICT (firm_id) DO NOTHING;

-- 5. Seed a Test Customer (Firm-wide)
INSERT INTO customers (id, firm_id, name, phone, address, city, primary_id_type, primary_id_number)
VALUES ('c1111111-1111-1111-1111-111111111111', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'John Doe', '9876543210', '123 Test St', 'Coimbatore', 'aadhaar', '1234-5678-9012')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed a Test Loan (Branch-specific - Main Branch)
INSERT INTO loans (id, firm_id, branch_id, loan_number, customer_id, customer_name, customer_phone, loan_amount, total_gross_weight, total_net_weight, total_appraised_value, ltv_percent, interest_mode, interest_rate, tenure_months, start_date, due_date, status)
VALUES ('01111111-1111-1111-1111-111111111111', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'b1111111-1111-1111-1111-111111111111', 'PV-2026-0001', 'c1111111-1111-1111-1111-111111111111', 'John Doe', '9876543210', 50000, 10.5, 10.0, 75000, 66, 'flat', 1.5, 6, now(), now() + interval '6 months', 'active')
ON CONFLICT (id) DO NOTHING;
