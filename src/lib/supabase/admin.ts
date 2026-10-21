import 'server-only';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Bypasses RLS and every auth rule — never call this without verifying the
 * calling user's role first (see `listUsersForAdmin` in `list-users.ts`).
 * No cookies/session here: this is a service-level client, not tied to a request.
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
