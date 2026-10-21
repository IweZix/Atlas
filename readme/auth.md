# Auth — how the session works

This document explains the mechanism behind login/logout: what the cookie is, who reads it, and why `getUser()` is used everywhere instead of just decoding a token. For how to build a new Supabase-backed route, see [supabase.md](./supabase.md).

## The login flow

1. The login form (`src/app/[locale]/login/page.tsx`) submits `{ email, password }` to `POST /api/auth/login`.
2. The route handler ([`src/app/api/auth/login/route.ts`](../src/app/api/auth/login/route.ts)) calls `supabase.auth.signInWithPassword(...)`.
3. On success, Supabase's SDK writes the session to a cookie via the `setAll` callback wired up in [`src/lib/supabase/server.ts`](../src/lib/supabase/server.ts). The response carries a `Set-Cookie` header, e.g.:

   ```
   Set-Cookie: sb-<project-ref>-auth-token=...; Path=/; HttpOnly; SameSite=lax
   ```

The browser never talks to Supabase itself — it only ever sees our own `/api/auth/login` response.

## The cookie

- It's a normal HTTP cookie. The browser stores it and sends it back automatically on every request to the app (page loads, `fetch` calls), no JS involved.
- `HttpOnly` means `document.cookie` in the page's JS can't read or tamper with it — only the server (route handlers, middleware, Server Components) can, via `next/headers`/`request.cookies`. We force this explicitly in [`src/lib/supabase/secure-cookie-options.ts`](../src/lib/supabase/secure-cookie-options.ts), because `@supabase/ssr`'s own default is `httpOnly: false` (it's designed to also support a browser-side Supabase client sharing the cookie — we don't use one, so we lock it down).
- It's what lets any server-side code recover "who is logged in" on a fresh request, without the front end managing a token manually — unlike the older `localStorage` + `Authorization` header pattern used by `customInstance.ts` for the separate Strapi backend.

## `getUser()` vs `getSession()`

Every place in this app that needs to know who's logged in calls `supabase.auth.getUser()`, never `getSession()`. The difference matters:

- `getSession()` just decodes the JWT sitting in the cookie, locally, with no network call. It trusts whatever is in the cookie — if it were tampered with (or expired), you wouldn't know until something else failed.
- `getUser()` sends the access token to Supabase's Auth server and asks it to confirm the token's signature, expiry, and that the user still exists. It's a real network round-trip, so it's slower, but it can't be spoofed by editing the cookie.

Since this app makes trust decisions based on this check (protecting `/dashboard`, gating API routes), it always pays the cost of `getUser()`.

## Automatic token refresh

Access tokens expire (1 hour by default). If `getUser()`/`getSession()` detects an expired access token but a still-valid refresh token, the Supabase SDK silently exchanges it for a new one and calls `setAll` again to rewrite the cookie with the refreshed session — this is why the cookie adapters in `server.ts` and `src/lib/supabase/middleware.ts` both implement `setAll`, not just `getAll`.

## Where this runs in the app

- **Middleware** ([`src/proxy.ts`](../src/proxy.ts)): on every request to `/login` or `/dashboard` (other routes skip Supabase entirely, see the resiliency notes in the file), `updateSession()` (in [`src/lib/supabase/middleware.ts`](../src/lib/supabase/middleware.ts)) calls `getUser()` to decide whether to redirect. This is the actual access gate.
- **Dashboard page** ([`src/app/[locale]/dashboard/page.tsx`](../src/app/[locale]/dashboard/page.tsx)): calls `getUser()` again, but only to read `user.email` for the greeting — by the time this renders, the middleware has already guaranteed a session exists.
- **Any new protected API route**: must call `getUser()` itself and return 401 if there's no user — routes under `/api` are excluded from the middleware's matcher, so the middleware doesn't protect them (see "Protecting a route" in [supabase.md](./supabase.md)).
- If Supabase is unreachable or misconfigured, the middleware's `try/catch` treats the request as logged out (fails closed) instead of crashing the page — see `src/proxy.ts`.

## Logout

`POST /api/auth/logout` calls `supabase.auth.signOut()`, which invalidates the session server-side (the refresh token stops working) and clears the cookie via the same `setAll` mechanism. After that, `getUser()` returns `null` everywhere, and the middleware redirects `/dashboard` back to `/login`.
