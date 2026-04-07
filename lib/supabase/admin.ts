import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for privileged server operations.
 * NEVER expose this to the browser — server-only.
 * Bypasses all RLS policies.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
