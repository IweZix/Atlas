# Audit log

Every insert/update/delete/restore on an audited table is recorded in `public.audit_logs`, written by a Postgres trigger (`public.audit_trigger()`, see `supabase/migrations/20260922211736_audit_log.sql`) — not by application code. This is deliberate: a trigger can't be forgotten by a new route, a script, or a direct SQL-editor edit, unlike a `logAudit()` call sprinkled through the codebase.

## Architecture rule: authenticated client only for business writes

The trigger reads `auth.uid()` to attribute a change to its author. That's only populated when the write goes through the authenticated, cookie-session Supabase client (`createClient()` from `src/lib/supabase/server.ts`) — **never** the service-role client (`createAdminClient()`, `src/lib/supabase/admin.ts`), which bypasses RLS and `auth.uid()` entirely.

**Every mutating function on an audited table must use the authenticated client.** If a table's RLS was previously "service-role only, zero policies" (the default posture from `readme/supabase.md`), you'll need to add admin-gated RLS policies (`using ( public.is_admin() )`) before its writes can go through the authenticated client — see `announcements_*` policies in `supabase/migrations/20260922211735_is_admin_and_announcements_rls.sql` for the pattern, and the corresponding client swap in `src/lib/announcements/repository.ts` (four mutating functions changed from `createAdminClient()` to `await createClient()`; the pure-read functions and the anonymous `getActiveAnnouncementRow()` stayed on the admin client).

A log with `userId = null` (no `auth.uid()` at write time — a script, a direct SQL-editor edit, or a service-role write) displays as "Système" in the UI.

## The `logAudit()` escape hatch

Some operations *must* use the service-role client and never touch a `public.*` table via `.from()` — e.g. `supabase.auth.admin.createUser/updateUserById/deleteUser` in `src/lib/supabase/list-users.ts`. The trigger can't see these at all. For these, call `logAudit()` (`src/lib/audit.ts`) explicitly, after the mutation succeeds, passing the connected admin's context implicitly (it reads the current user via `getCurrentUser()`) and a manual `oldData`/`newData` diff. See `createUserForAdmin`/`updateUserForAdmin`/`setUserActiveForAdmin`/`deleteUserForAdmin` in `list-users.ts` for the pattern — note `updateUserForAdmin`/`setUserActiveForAdmin`/`deleteUserForAdmin` all fetch the prior state via `getUserById()` *before* mutating, so there's something to diff against.

Never call `logAudit()` for a table that already has the trigger enabled — that would double-log every write.

## Auditing a new table

1. In the table's own migration, after creating it:
   ```sql
   select public.enable_audit('public.<table>', 'excludedCol1,excludedCol2', 'pkColumn');
   ```
   Omit the 2nd/3rd args for the defaults (no extra exclusions beyond `updatedAt`, pk `id`). Never pass a column that holds a token/secret/IP or other sensitive value.
2. Make sure every mutating function on that table's repository uses the authenticated client (see the architecture rule above) — add RLS admin policies first if the table doesn't already have any.
3. Add an entry to `AUDIT_MODEL_REGISTRY` in `src/lib/audit/model-registry.ts` (`{ labelKey, href? }`).
4. Add the matching `journal.models.<table>` key to both `src/localization/locales/fr.json` and `en.json`, then `npm run generate-translation`.
5. If the table has a `deletedAt` column (soft delete), no extra work is needed — the trigger already turns a soft-delete into `action: 'delete'` and a restore into `action: 'restore'`.
6. Add `<AuditHistory tableName="<table>" recordId={id} />` to the model's detail page if it has one (see the `Tabs` usage in `dashboard/annonces/[announcementId]/page.tsx` or `dashboard/users/[userId]/page.tsx`).

Tables intentionally **not** audited: `public.user_preferences` (pure self-service locale/theme, no admin-facing CRUD, no investigative value).

## Retention (RGPD) — manual one-time step

`audit_logs` isn't purged automatically by any migration — pg_cron isn't available in local dev, and enabling it in production requires a manual step in the Supabase Dashboard first (Database → Extensions → pg_cron). Once that's enabled, run this once via the Dashboard's SQL editor:

```sql
select cron.schedule(
  'audit_logs_retention_purge',
  '0 3 1 * *', -- monthly, 1st of month at 03:00
  $$ delete from public.audit_logs where "createdAt" < now() - interval '12 months' $$
);
```

To change the retention window for a given project, edit the interval and re-run `cron.schedule` with the same job name (`cron.schedule` upserts by name, so this replaces the existing job rather than creating a duplicate).

## Reading the log

- `getAuditLogs(filters, pagination)` (`src/lib/audit.ts`, server-only) — used by `GET /api/admin/journal` (the `/dashboard/journal` page and `<AuditHistory>`). Relies on the `audit_logs_select_admin` RLS policy as the real gate; callers must call `assertCurrentUserIsAdmin()` first.
- Nobody — including admins — can write to `audit_logs` through the API. Only the trigger (`security definer`) and `logAudit()`'s service-role client can insert.

## Verify

- `npx supabase db reset` — both new migrations must apply cleanly on a fresh DB.
- `grep -rn "createAdminClient" src/lib src/app/api` — every remaining hit should be a pure read, an Admin Auth API call, or `logAudit()`'s own insert; never a mutating call on an audited table.
- `npm run build`, `npx tsc --noEmit`, `npm run lint:check`.
