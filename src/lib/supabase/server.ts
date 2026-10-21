import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { secureCookieOptions } from '@/lib/supabase/secure-cookie-options';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, secureCookieOptions(options));
          }
        } catch {
          // Called from a Server Component that can't set cookies (session
          // refresh is handled by the middleware in that case).
        }
      },
    },
  });
}
