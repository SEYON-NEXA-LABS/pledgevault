'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addStaffMemberAction(staffData: { fullName: string, email: string, password: string, branchId?: string, role: 'staff' | 'manager' }) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Verify the caller is an ADMIN of their firm
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'manager') {
    throw new Error('Unauthorized: Only firm managers can manage the team.');
  }

  try {
    // 2. Create the user via Admin API (to avoid logging out the current admin)
    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email: staffData.email,
      password: staffData.password,
      email_confirm: true,
      user_metadata: { full_name: staffData.fullName }
    });

    if (authError) throw authError;

    // 3. Create the profile for the new staff
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert([{
        id: newUser.user.id,
        firm_id: profile.firm_id,
        default_branch_id: staffData.branchId || null,
        full_name: staffData.fullName,
        role: staffData.role
      }]);

    if (profileError) throw profileError;

    revalidatePath('/settings/team');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeStaffMemberAction(staffId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'manager') {
    throw new Error('Unauthorized');
  }

  try {
    // 1. Verify target belongs to SAME firm
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('firm_id, role')
      .eq('id', staffId)
      .single();

    if (!targetProfile || targetProfile.firm_id !== profile.firm_id) {
      throw new Error('User not found in your firm.');
    }

    // 2. MANDATORY MANAGER RULE: Prevent deleting the last manager
    if (targetProfile.role === 'manager') {
      const { count } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('firm_id', profile.firm_id)
        .eq('role', 'manager');
      
      if ((count || 0) <= 1) {
        throw new Error('Cannot remove the last manager. Every firm must have at least one manager.');
      }
    }

    // 3. Delete from Auth
    const { error } = await adminClient.auth.admin.deleteUser(staffId);
    if (error) throw error;

    revalidatePath('/settings/team');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
