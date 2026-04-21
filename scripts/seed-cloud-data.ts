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
  
  // Diversified Branches
  const BRANCHES = [
    { id: 'b1111111-1111-1111-1111-111111111111', name: 'Main Branch (Town Hall)', code: 'MAIN01', location: 'Town Hall Plaza' },
    { id: 'b2222222-2222-2222-2222-222222222222', name: 'Gandhipuram Hub', code: 'GAND02', location: 'Cross Cut Road' },
    { id: 'b3333333-3333-3333-3333-333333333333', name: 'West End Satellite', code: 'WEST03', location: 'R.S. Puram' }
  ];

  console.log('🌱 Consolidating Diversified Seed Process for "Seyon Jewelers"...');

  // 1. Verify/Create Firm
  const { error: firmError } = await supabase
    .from('firms')
    .upsert([{ id: SEYON_FIRM_ID, name: 'Seyon Jewelers', plan: 'pro' }]);

  if (firmError) {
    console.error('❌ Failed to verify firm:', firmError);
    process.exit(1);
  }
  console.log(`✅ Firm Ready: Seyon Jewelers`);

  // 2. Diversify Branches
  for (const b of BRANCHES) {
    const { error: bErr } = await supabase
      .from('branches')
      .upsert([{ ...b, firm_id: SEYON_FIRM_ID }]);
    if (bErr) console.warn(`⚠️ Warning on branch ${b.name}:`, bErr.message);
  }
  console.log(`✅ ${BRANCHES.length} Branches Synchronized.`);

  // 3. Generate 15 Diversified Customers
  console.log('Generating Customers...');
  const customers = [];
  for (let i = 0; i < 15; i++) {
    const custName = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
    customers.push({
      firm_id: SEYON_FIRM_ID,
      name: custName,
      phone: `9${randomInt(100000000, 999999999)}`,
      address: `${randomInt(1, 150)}, ${randomChoice(['Nehru St', 'Gandhiji Rd', 'Market Lane'])}`,
      city: randomChoice(CITIES),
      pincode: `64100${randomInt(1, 9)}`,
      primary_id_type: randomChoice(['aadhaar', 'pan', 'voter_id']),
      primary_id_number: `${randomInt(1000, 9999)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      created_at: new Date(Date.now() - randomInt(10, 100) * 86400000).toISOString()
    });
  }

  const { data: insertedCustomers, error: custErr } = await supabase
    .from('customers')
    .insert(customers)
    .select('id, name, phone, created_at');
    
  if (custErr) throw custErr;
  console.log(`✅ Inserted ${insertedCustomers.length} Customers!`);

  // 4. Generate 25 Diversified Loans (Mixed Status & Metal)
  console.log('Generating Diverse Loans...');
  
  for (let i = 0; i < 25; i++) {
    const customer = randomChoice(insertedCustomers);
    const branch = randomChoice(BRANCHES);
    const isGold = Math.random() > 0.3; // 70% Gold, 30% Silver
    const metalType = isGold ? 'gold' : 'silver';
    
    // Backdate some to create overdue loans
    const daysAgo = randomInt(5, 200);
    const startDate = new Date(Date.now() - daysAgo * 86400000);
    const tenureMonths = randomChoice([3, 6, 12]);
    const dueDate = new Date(startDate.getTime() + (tenureMonths * 30 * 86400000));
    const status = (dueDate.getTime() < Date.now()) ? 'overdue' : 'active';
    
    const numItems = randomInt(1, 3);
    let totalItemsValue = 0;
    let totalGross = 0;
    let totalNet = 0;
    const items = [];
    
    for (let j = 0; j < numItems; j++) {
      const grossW = isGold ? (randomInt(5, 40) + Math.random()) : (randomInt(50, 500) + Math.random());
      const netW = grossW * 0.98;
      const rate = isGold ? 7200 : 90;
      const val = Math.floor(netW * rate);
      
      totalItemsValue += val;
      totalGross += grossW;
      totalNet += netW;
      
      items.push({
        firm_id: SEYON_FIRM_ID,
        metal_type: metalType,
        item_type: randomChoice(isGold ? ['Necklace', 'Bangle', 'Ring'] : ['Anklet', 'Plate', 'Coin']),
        description: `${isGold ? '22ct' : 'Fine'} Ornament`,
        purity: isGold ? '916 KDM' : '999 Pure',
        gross_weight: parseFloat(grossW.toFixed(2)),
        net_weight: parseFloat(netW.toFixed(2)),
        rate_per_gram: rate,
        item_value: val
      });
    }

    const loanAmount = Math.floor((totalItemsValue * randomInt(60, 75)) / 100);

    const { data: newLoan, error: loanErr } = await supabase
      .from('loans')
      .insert([{
        firm_id: SEYON_FIRM_ID,
        branch_id: branch.id,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        loan_number: `SG-${branch.code}-${randomInt(1000, 9999)}`,
        loan_amount: loanAmount,
        total_gross_weight: parseFloat(totalGross.toFixed(2)),
        total_net_weight: parseFloat(totalNet.toFixed(2)),
        total_appraised_value: totalItemsValue,
        ltv_percent: Math.floor((loanAmount / totalItemsValue) * 100),
        interest_rate: isGold ? 1.5 : 1.8,
        interest_mode: 'flat',
        tenure_months: tenureMonths,
        start_date: startDate.toISOString(),
        due_date: dueDate.toISOString(),
        status: status
      }])
      .select('id')
      .single();

    if (loanErr) {
      console.warn('⚠️ Error inserting loan:', loanErr.message);
      continue;
    }

    // Insert Items
    const { error: itemErr } = await supabase
      .from('loan_items')
      .insert(items.map(item => ({ ...item, loan_id: newLoan.id })));
    
    if (itemErr) console.warn('⚠️ Error inserting items:', itemErr.message);
  }
  
  console.log('🎉 Consolidate Seeding Complete! Shop: Seyon Jewelers');
}

seedData().catch(console.error);
