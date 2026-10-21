import type { User } from '@supabase/supabase-js';
import type { UserMetadata } from '@/types/UserMetadata';

/**
 * Unlike `app_metadata` (role), `user_metadata` can be changed by the user
 * themselves via `supabase.auth.updateUser()` — fine for profile info like a
 * name, since it has no bearing on authorization.
 */
export function getUserMetadata(user: User | null | undefined): UserMetadata {
  return (user?.user_metadata ?? {}) as UserMetadata;
}
