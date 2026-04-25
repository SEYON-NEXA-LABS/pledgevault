'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function addStaffMemberAction(staffData: { fullName: string, email: string, password: string, branchId?: string, role: 'staff' | 'admin' }) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // 1. Verify the caller is an ADMIN of their firm
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('firm_id, role')
      .eq('id', user.id)
      .single();

    if (profileFetchError || !profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only firm admins can manage the team.');
    }

    // 1.5 PLAN USAGE CHECK (Egress Optimized)
    const { data: firm } = await supabase.from('firms').select('plan').eq('id', profile.firm_id).single();
    const currentPlan = firm?.plan || 'free';
    const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;

    if (limits.maxUsers !== Infinity) {
      const { count, error: countError } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('firm_id', profile.firm_id);
      
      if (countError) throw countError;
      if ((count || 0) >= limits.maxUsers) {
        throw new Error(`Your ${currentPlan.toUpperCase()} plan is limited to ${limits.maxUsers} users. Please upgrade to add more staff.`);
      }
    }

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

    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error('Add Staff Error:', err);
    return { success: false, error: err?.message || typeof err === 'string' ? err : 'An error occurred during staff creation' };
  }
}

export async function removeStaffMemberAction(staffId: string) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('firm_id, role')
      .eq('id', user.id)
      .single();

    if (profileFetchError || !profile || profile.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    // 1. Verify target belongs to SAME firm
    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from('profiles')
      .select('firm_id, role')
      .eq('id', staffId)
      .single();

    if (targetProfileError || !targetProfile || targetProfile.firm_id !== profile.firm_id) {
      throw new Error('User not found in your firm.');
    }

    // 2. MANDATORY ADMIN RULE: Prevent deleting the last admin
    if (targetProfile.role === 'admin') {
      const { count, error: countError } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('firm_id', profile.firm_id)
        .eq('role', 'admin');
      
      if (countError) throw countError;
      
      if ((count || 0) <= 1) {
        throw new Error('Cannot remove the last admin. Every firm must have at least one admin.');
      }
    }

    // 3. Delete from Auth
    const { error } = await adminClient.auth.admin.deleteUser(staffId);
    if (error) throw error;

    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error('Remove Staff Error:', err);
    return { success: false, error: err?.message || typeof err === 'string' ? err : 'An error occurred during staff removal' };
  }
}
