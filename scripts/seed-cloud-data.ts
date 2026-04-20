import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const FIRST_NAMES = ['Ananya', 'Arjun', 'Diya', 'Rohan', 'Sneha', 'Vivek', 'Meera', 'Karthik', 'Pooja', 'Vikram', 'Nithya', 'Sanjay', 'Kavya', 'Rahul', 'Aishwarya', 'Manoj'];
const LAST_NAMES = ['Sharma', 'Iyer', 'Reddy', 'Patel', 'Menon', 'Nair', 'Kumar', 'Singh', 'Das', 'Rao', 'Pillai', 'Rajan', 'Devi', 'Krishna'];
const CITIES = ['Coimbatore', 'Chennai', 'Madurai', 'Trichy', 'Salem', 'Tiruppur', 'Erode'];

const ITEM_TYPES = ['chain', 'necklace', 'ring', 'bangle', 'earring', 'bracelet', 'coin', 'bar'];
const PURITIES = ['916', '750', '999', '875'];

function randomChoice(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

async function seedData() {
  const SEYON_FIRM_ID = 'd290f1ee-6c54-4b01-90e6-d701748f0851';
  const MAIN_BRANCH_ID = 'b1111111-1111-1111-1111-111111111111';

  console.log('🌱 Starting Seed Process for "Seyon Jewelers" -> "Main Branch"...');

  // 1. Verify/Create Firm
  let { data: firm, error: firmError } = await supabase
    .from('firms')
    .select('id, name')
    .eq('id', SEYON_FIRM_ID)
    .single();

  if (firmError || !firm) {
    console.log('⚠️ Seyon Jewelers not found. Creating it now...');
    const { data: newFirm, error: newFirmErr } = await supabase
      .from('firms')
      .insert([{ id: SEYON_FIRM_ID, name: 'Seyon Jewelers', plan: 'pro' }])
      .select('id, name')
      .single();
      
    if (newFirmErr) {
      console.error('❌ Failed to create firm:', newFirmErr);
      process.exit(1);
    }
    firm = newFirm;
  }
  console.log(`✅ Ready Firm: ${firm.name}`);

  // 2. Verify/Create Branch
  let { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('id, name')
    .eq('id', MAIN_BRANCH_ID)
    .single();

  if (branchError || !branch) {
    console.log('⚠️ Main Branch not found. Creating it now...');
    const { data: newBranch, error: newBranchErr } = await supabase
      .from('branches')
      .insert([{ id: MAIN_BRANCH_ID, firm_id: SEYON_FIRM_ID, name: 'Main Branch', code: 'MB01', location: 'Headquarters' }])
      .select('id, name')
      .single();
      
    if (newBranchErr) {
      console.error('❌ Failed to create branch:', newBranchErr);
      process.exit(1);
    }
    branch = newBranch;
  }
  console.log(`✅ Ready Branch: ${branch.name}`);

  // Generate 25 Customers
  console.log('Generating Customers...');
  const customers = [];
  for (let i = 0; i < 25; i++) {
    const custName = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
    const phone = `9${randomInt(100000000, 999999999)}`;
    const cust = {
      firm_id: firm.id,
      name: custName,
      phone: phone,
      address: `${randomInt(1, 150)}, Sample Street`,
      city: randomChoice(CITIES),
      state: 'Tamil Nadu',
      pincode: `64100${randomInt(1, 9)}`,
      primary_id_type: randomChoice(['aadhaar', 'pan', 'voter']),
      primary_id_number: `${randomInt(1000, 9999)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      created_at: new Date(Date.now() - randomInt(1, 100) * 86400000).toISOString()
    };
    customers.push(cust);
  }

  const { data: insertedCustomers, error: custErr } = await supabase.from('customers').insert(customers).select('id, name, phone, created_at');
  if (custErr) throw custErr;
  console.log(`✅ Inserted ${insertedCustomers.length} Customers!`);

  // Generate 40 Loans
  console.log('Generating Loans...');
  let totalLoanAmount = 0;
  
  for (let i = 0; i < 40; i++) {
    const customer = randomChoice(insertedCustomers);
    const loanStartDate = new Date(new Date(customer.created_at).getTime() + randomInt(1, 10) * 86400000);
    const dueDate = new Date(loanStartDate.getTime() + 180 * 86400000); // 6 months later
    const status = (dueDate.getTime() < Date.now()) ? 'overdue' : 'active';
    
    // Get next loan number counter
    const { data: newCount } = await supabase.rpc('increment_loan_counter', { f_id: firm.id });
    const formattedNumber = `SG_MB_${String(newCount || 100 + i).padStart(7, '0')}`;

    const numItems = randomInt(1, 4);
    let totalItemsValue = 0;
    let totalGross = 0;
    let totalNet = 0;
    const loanItems = [];
    
    for (let j = 0; j < numItems; j++) {
      const grossW = randomInt(5, 50) + Math.random();
      const netW = grossW * 0.95;
      const rate = 7200;
      const val = Math.floor(netW * rate);
      totalItemsValue += val;
      totalGross += grossW;
      totalNet += netW;
      
      loanItems.push({
        metal_type: 'gold',
        item_type: randomChoice(ITEM_TYPES),
        description: 'Gold Ornament',
        purity: randomChoice(PURITIES),
        gross_weight: parseFloat(grossW.toFixed(2)),
        net_weight: parseFloat(netW.toFixed(2)),
        rate_per_gram: rate,
        item_value: val
      });
    }

    const loanAmount = Math.floor((totalItemsValue * randomInt(65, 75)) / 100);
    totalLoanAmount += loanAmount;

    // Insert loan
    const loanData = {
      firm_id: firm.id,
      branch_id: branch.id,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      loan_number: formattedNumber,
      total_gross_weight: parseFloat(totalGross.toFixed(2)),
      total_net_weight: parseFloat(totalNet.toFixed(2)),
      total_appraised_value: totalItemsValue,
      ltv_percent: Math.floor((loanAmount / totalItemsValue) * 100),
      loan_amount: loanAmount,
      interest_rate: 1.5,
      interest_mode: 'flat',
      tenure_months: 6,
      start_date: loanStartDate.toISOString(),
      due_date: dueDate.toISOString(),
      status: status,
      created_at: loanStartDate.toISOString()
    };

    const { data: newLoan, error: loanErr } = await supabase.from('loans').insert([loanData]).select('id').single();
    if (loanErr) throw loanErr;

    // Insert items
    const itemsToInsert = loanItems.map(item => ({ ...item, loan_id: newLoan.id }));
    const { error: itemErr } = await supabase.from('loan_items').insert(itemsToInsert);
    if (itemErr) throw itemErr;
  }
  
  console.log(`✅ Inserted 40 Loans! Total Loan Amount: ₹${totalLoanAmount.toLocaleString('en-IN')}`);

  console.log('🎉 Seeding Complete! Refresh the application to see the new data.');
}

seedData().catch(console.error);
