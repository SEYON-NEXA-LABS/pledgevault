import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkFirms() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data, error } = await supabase.from('firms').select('id, name, created_at');
  
  if (error) {
    console.error('Error fetching firms:', error);
  } else {
    console.log('Firms in database:', JSON.stringify(data, null, 2));
  }
}

checkFirms();
