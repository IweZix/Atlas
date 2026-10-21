# Supabase — adding a new route

This project uses Supabase (Auth for now) **server-side only**. The browser never talks to Supabase directly: everything goes through Next.js route handlers under `src/app/api/`. This document explains what to do when adding a new route that uses Supabase.

## Initializing Supabase for a new project

Steps to bootstrap Supabase when spinning up a new site from this boilerplate (assumes the Vercel Marketplace Supabase integration):

1. **Provision**: in the new site's Vercel project → Storage → Create Database → Supabase. This creates the Supabase project and injects the env vars (`POSTGRES_*`, `SUPABASE_*`, `NEXT_PUBLIC_SUPABASE_*`) into the Vercel project automatically.
2. **Pull the env vars locally**: `vercel link` then `vercel env pull .env`. Only four are actually read by the code: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`src/lib/supabase/admin.ts`). The service role key never leaves `.env`/the server.
3. **Link the local CLI**: `npx supabase login` (once per machine), then `npx supabase link --project-ref <ref>` (ref shown in Vercel → Storage, or `npx supabase projects list`).
4. **Push the hardened config**: `npx supabase config push`. This pushes `supabase/config.toml` — including `enable_signup = false` — to the new project, closing off the Supabase-hosted `/auth/v1/signup` endpoint so it can't be hit directly with the public anon key, bypassing this app entirely. Verify in Dashboard → Authentication → Sign In / Providers → Email that "Allow new users to sign up" is off.
5. **Bootstrap the first admin**: account creation is admin-gated only (`assertCurrentUserIsAdmin()`), so there's no user yet to create the first one. Run a one-off local script using `createAdminClient()` (`src/lib/supabase/admin.ts`) to call `supabase.auth.admin.createUser({ ..., app_metadata: { role: Role.ADMIN } })` by hand, with the service role key — never as an app route.
6. **RLS on any new table**: this app currently has no custom tables in `public` (all user data lives in Supabase-managed `auth.users`). The moment a table is added, enable RLS and write its policies before exposing it — don't rely on default Supabase privileges (`anon`/`authenticated` get full CRUD by default on new tables).
7. **Verify**: `npm run dev`, log in as the bootstrap admin, create a user via `/api/admin/users`, and confirm a direct `curl` to `<project>.supabase.co/auth/v1/signup` is rejected.

## Architecture rule

- No Supabase client in a `'use client'` component, no `fetch` from the browser to `*.supabase.co`.
- All Supabase logic lives in a route under `src/app/api/**/route.ts`, called from the front end via a function in `src/services/*.ts` (see `src/services/auth.ts`).
- The server-side Supabase client is obtained via `createClient()` in [`src/lib/supabase/server.ts`](../src/lib/supabase/server.ts) — it reads/writes the session cookies via `next/headers` and forces `httpOnly` on those cookies (see `src/lib/supabase/secure-cookie-options.ts`). Don't instantiate `createServerClient`/`createClient` (`@supabase/supabase-js`) any other way in a route.

## Creating a new route

1. Create `src/app/api/<name>/route.ts` and export the HTTP method you need (`GET`, `POST`, ...).
2. Get the client with `const supabase = await createClient()`.
3. Wrap the Supabase call in a `try/catch` and return a generic error message (never Supabase's raw error) — see `src/app/api/auth/login/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // ... validate the body ...

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('my_table').select();

    if (error) {
      return NextResponse.json({ error: 'request_failed' }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'auth_unavailable' }, { status: 503 });
  }
}
```

## Protecting a route (requires a logged-in user)

The middleware (`src/proxy.ts`) only protects **pages** (`/dashboard`, `/login`) — routes under `/api` are explicitly excluded from its matcher. An API route that needs a logged-in user must check for one itself:

```ts
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
```

## Keys and secrets

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the only keys to use in an app route (already wired into `createClient()`). The `NEXT_PUBLIC_` prefix isn't an issue here since these keys are never used client-side in this project.
- `SUPABASE_SERVICE_ROLE_KEY`: **forbidden in any app route**. It bypasses RLS policies and auth rules. Reserved for one-off admin scripts, run locally by hand, never committed.

## Hard rule: no public self-signup

No route should ever call `supabase.auth.signUp` — that's the client-facing signup flow, and this app has none: nobody creates their own account. There's no public, unauthenticated way to create a user.

Account creation *is* allowed, but only admin-gated, through `POST /api/admin/users` → `createUserForAdmin()` in `src/lib/supabase/list-users.ts`, which calls `supabase.auth.admin.createUser` behind the exact same `assertCurrentUserIsAdmin()` check as every other `admin/*` route (see `listUsersForAdmin`, `getUserForAdmin`, `updateUserForAdmin` in the same file for the pattern). Don't call `admin.createUser` from anywhere else, and never from a route that isn't behind that check.

## Calling the route from the front end

Add a function in `src/services/*.ts` (or a new service file) that does a relative `fetch` to the route — **not** `customInstance` (`src/utils/custom-instance.ts`), which targets the external Strapi backend (`NEXT_PUBLIC_BACKEND_URL`), not our own `/api`. See `src/services/auth.ts` for the pattern:

```ts
export async function myFunction(payload: Payload): Promise<Result> {
  const response = await fetch('/api/my-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('request_failed');
  }

  return response.json();
}
```

## Verify

- `npm run lint:check`
- `npx tsc --noEmit`
- `npm run build`
- Manual test: `curl -X POST http://localhost:3000/api/my-endpoint -H 'Content-Type: application/json' -d '{...}'`, or directly in the browser for a route called by a page.
