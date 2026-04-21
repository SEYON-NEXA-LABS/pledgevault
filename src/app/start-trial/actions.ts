'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * registerTrialAction
 * Allows a new shop owner to start a 14-day Elite Trial.
 * Does NOT require prior authentication.
 */
export async function registerTrialAction(formData: any) {
  const adminClient = createAdminClient();

  const { 
    name, location,
    email, password, fullName
  } = formData;

  try {
    // 1. Create the Firm (Default Elite Trial Branding)
    // We use a simplified slug based on name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const shortCode = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 4);

    const { data: firm, error: firmError } = await adminClient
      .from('firms')
      .insert([{ 
        name, 
        slug, 
        short_code: shortCode, 
        plan: 'elite', 
        branding_config: { 
          primary_color: '#107B88', 
          login_greeting: `Welcome to ${name}` 
        } 
      }])
      .select()
      .single();

    if (firmError) throw firmError;
    
    // 2. Create default "Main Branch"
    const { data: mainBranch, error: branchError } = await adminClient
      .from('branches')
      .insert([{
        firm_id: firm.id,
        name: 'Main Branch',
        code: 'MAIN',
        location: location || 'Main Office'
      }])
      .select()
      .single();

    if (branchError) throw branchError;

    // 3. Create the Owner User in Auth
    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;

    // 4. Create the Profile for the owner
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert([{
        id: newUser.user.id,
        firm_id: firm.id,
        default_branch_id: mainBranch.id,
        full_name: fullName,
        role: 'manager'
      }]);

    if (profileError) throw profileError;

    // 5. Initialize Shop Settings
    const { error: settingsError } = await adminClient
      .from('shop_settings')
      .insert([{
        firm_id: firm.id,
        shop_address: location || 'Initial Address',
        shop_phone: 'Not provided',
        active_branch_id: mainBranch.id
      }]);

    if (settingsError) throw settingsError;

    // 6. Initialize 14-Day Elite Trial Subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const { error: trialError } = await adminClient
      .from('subscriptions')
      .insert([{
        firm_id: firm.id,
        plan_id: 'elite',
        interval: 'monthly',
        amount: 0,
        currency: 'INR',
        payment_method: 'trial',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: trialEndDate.toISOString(),
      }]);

    if (trialError) throw trialError;

    return { 
      success: true, 
      firmId: firm.id, 
      email, 
      password, // Return credentials for auto-login on client side
      fullName 
    };

  } catch (error: any) {
    console.error('Trial Registration Error:', error);
    return { success: false, error: error.message };
  }
}
