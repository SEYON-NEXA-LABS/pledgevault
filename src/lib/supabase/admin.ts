import { createClient } from '@supabase/supabase-js';

// WARNING: This client uses the Service Role Key, which bypasses RLS.
// ONLY use this on the server side (Server Actions, API Routes).
// NEVER expose the Service Role Key in NEXT_PUBLIC_ variables.

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
