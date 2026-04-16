'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function onboardFirmAction(formData: any) {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 1. Double check the caller is a superadmin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    throw new Error('Only superadmins can onboard new firms');
  }

  const { name, plan, email, password, fullName, staffMembers } = formData;

  try {
    // 2. Create the Firm
    const { data: firm, error: firmError } = await adminClient
      .from('firms')
      .insert([{ name, plan }])
      .select()
      .single();

    if (firmError) throw firmError;

    // 3. Create the Primary Admin User (No logout!)
    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;

    // 4. Create the Profile for the new admin
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert([{
        id: newUser.user.id,
        firm_id: firm.id,
        full_name: fullName,
        role: 'admin'
      }]);

    if (profileError) throw profileError;

    // 5. Create Staff Members (Optional)
    if (staffMembers && staffMembers.length > 0) {
      for (const staff of staffMembers) {
        if (!staff.email || !staff.password) continue;
        
        const { data: nStaff, error: sAuthError } = await adminClient.auth.admin.createUser({
          email: staff.email,
          password: staff.password,
          email_confirm: true,
          user_metadata: { full_name: staff.fullName }
        });

        if (sAuthError) continue; // Log error but continue onboarding others

        await adminClient
          .from('profiles')
          .insert([{
            id: nStaff.user.id,
            firm_id: firm.id,
            full_name: staff.fullName,
            role: 'staff'
          }]);
      }
    }

    // 6. Initialize Shop Settings
    const { error: settingsError } = await adminClient
      .from('shop_settings')
      .insert([{
        firm_id: firm.id,
        shop_address: 'Initial Address',
        shop_phone: 'Initial Phone'
      }]);

    if (settingsError) throw settingsError;

    revalidatePath('/superadmin');
    return { success: true, firmId: firm.id };

  } catch (error: any) {
    console.error('Onboarding Error:', error);
    return { success: false, error: error.message };
  }
}
