import type { User } from '@supabase/supabase-js';
import { Role } from '@/types/Role';

/**
 * The role lives in `app_metadata`, which only the service_role key can write —
 * a logged-in user can never change their own role (unlike `user_metadata`).
 */
export function getUserRole(user: User | null | undefined): Role | null {
  const role = user?.app_metadata?.role;
  return (Object.values(Role) as string[]).includes(role)
    ? (role as Role)
    : null;
}
