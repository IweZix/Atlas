// middleware.ts

import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { featureForPath, isEnabled } from '@/lib/features';
import { updateSession } from '@/lib/supabase/middleware';
import { secureCookieOptions } from '@/lib/supabase/secure-cookie-options';
import { routing } from '@/localization/routing';
import type { Locale } from '@/types/Locale';

const handleIntl = createMiddleware(routing);

const localePattern = new RegExp(`^/(${routing.locales.join('|')})(/.*)?$`);

const PROTECTED_PATHS = ['/dashboard'];
const AUTH_PATHS = ['/login'];

// Our own cookie, separate from next-intl's app-wide NEXT_LOCALE (which the
// public site also relies on) — this one only caches whether this browser's
// backoffice locale has already been reconciled with the DB, so it's never
// read back for its value, only its presence.
const ADMIN_LOCALE_COOKIE = 'ADMIN_LOCALE';

export default async function middleware(request: NextRequest) {
  const intlResponse = handleIntl(request);

  // Locale correction/redirect: let it happen first, auth is re-checked on the next pass.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const match = request.nextUrl.pathname.match(localePattern);
  const locale = match?.[1] ?? routing.defaultLocale;
  const pathnameWithoutLocale = match?.[2] || '/';

  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathnameWithoutLocale.startsWith(path),
  );
  const isAuthPath = AUTH_PATHS.some((path) =>
    pathnameWithoutLocale.startsWith(path),
  );

  // Public routes never touch Supabase, so they keep working even if it's
  // unreachable or misconfigured.
  if (!isProtectedPath && !isAuthPath) {
    return intlResponse;
  }

  let user = null;
  let supabase: Awaited<ReturnType<typeof updateSession>>['supabase'] | null =
    null;
  try {
    const {
      response: supabaseResponse,
      user: sessionUser,
      supabase: supabaseClient,
    } = await updateSession(request);
    user = sessionUser;
    supabase = supabaseClient;
    for (const cookie of supabaseResponse.cookies.getAll()) {
      intlResponse.cookies.set(cookie);
    }
  } catch {
    // Supabase unreachable/misconfigured: fail closed (treat as logged out)
    // instead of crashing the whole request.
  }

  if (isProtectedPath && !user) {
    return redirectTo(request, intlResponse, `/${locale}/login`);
  }

  if (
    isProtectedPath &&
    user &&
    supabase &&
    !request.cookies.get(ADMIN_LOCALE_COOKIE)?.value
  ) {
    const redirected = await syncAdminLocale(
      request,
      intlResponse,
      supabase,
      user.id,
      locale,
      pathnameWithoutLocale,
    );
    if (redirected) return redirected;
  }

  if (isProtectedPath && user) {
    const feature = featureForPath(pathnameWithoutLocale);
    if (feature && !(await isEnabled(feature))) {
      return redirectTo(request, intlResponse, `/${locale}/dashboard/upgrade`, {
        feature,
      });
    }
  }

  if (isAuthPath && user) {
    return redirectTo(request, intlResponse, `/${locale}/dashboard`);
  }

  return intlResponse;
}

function redirectTo(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  searchParams?: Record<string, string>,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = '';
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    redirectUrl.searchParams.set(key, value);
  }
  const redirectResponse = NextResponse.redirect(redirectUrl);
  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}

/**
 * Reconciles the ADMIN_LOCALE cookie with the user_preferences row, only
 * called when the cookie is absent (login, cleared cookie, first visit).
 *
 * Only redirects DB -> URL, and only when the row was actually *customized*
 * (updatedAt > createdAt). A never-customized row (still at the trigger's
 * fresh default) must NOT force a redirect here — that would flip a user
 * landing on e.g. /en/login back to /fr before PreferencesSync (client-side)
 * ever gets a chance to recover their current URL locale into the DB. In
 * that case we just mark the cookie with the current URL locale and let the
 * client-side effect write it back.
 */
async function syncAdminLocale(
  request: NextRequest,
  intlResponse: NextResponse,
  supabase: Awaited<ReturnType<typeof updateSession>>['supabase'],
  userId: string,
  locale: string,
  pathnameWithoutLocale: string,
): Promise<NextResponse | null> {
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('locale, createdAt, updatedAt')
      .eq('userId', userId)
      .maybeSingle();

    const dbLocale = data?.locale as Locale | undefined;
    const neverCustomized = !data || data.createdAt === data.updatedAt;
    const cookieOptions = secureCookieOptions({
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    if (
      !neverCustomized &&
      dbLocale &&
      dbLocale !== locale &&
      routing.locales.includes(dbLocale)
    ) {
      const redirected = redirectTo(
        request,
        intlResponse,
        `/${dbLocale}${pathnameWithoutLocale}`,
      );
      redirected.cookies.set(ADMIN_LOCALE_COOKIE, dbLocale, cookieOptions);
      return redirected;
    }

    intlResponse.cookies.set(
      ADMIN_LOCALE_COOKIE,
      neverCustomized || !dbLocale ? locale : dbLocale,
      cookieOptions,
    );
    return null;
  } catch {
    // Preference lookup failed — skip silently, never conflate with the
    // outer auth fail-closed catch.
    return null;
  }
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
