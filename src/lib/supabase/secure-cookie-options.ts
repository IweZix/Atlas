import type { CookieOptions } from '@supabase/ssr';

/**
 * The browser never talks to Supabase directly in this app (no createBrowserClient
 * anywhere), so the session cookie only needs to be readable by our own server code —
 * force httpOnly regardless of @supabase/ssr's default (which is `false`, since it's
 * designed to also support a browser-side client sharing the same cookie).
 */
export function secureCookieOptions(options?: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };
}
