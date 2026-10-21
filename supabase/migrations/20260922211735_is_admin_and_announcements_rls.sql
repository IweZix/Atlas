-- No `profiles` table / is_admin() exist yet — role lives purely in
-- auth.users.app_metadata.role (see src/lib/supabase/role.ts#getUserRole).
-- `stable`, plain `language sql`: only reads the calling request's own JWT,
-- no elevated privileges needed.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- announcements had RLS enabled with ZERO policies (service-role only —
-- see 20260919215125_announcements.sql). The audit trigger being added in
-- the next migration needs auth.uid() populated, which only happens when
-- writes go through the authenticated (cookie-session) client. These
-- policies let an authenticated admin through; anon and non-admin
-- authenticated users still see nothing.
create policy "announcements_select_admin"
  on public.announcements for select
  to authenticated
  using ( public.is_admin() );

create policy "announcements_insert_admin"
  on public.announcements for insert
  to authenticated
  with check ( public.is_admin() );

create policy "announcements_update_admin"
  on public.announcements for update
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

create policy "announcements_delete_admin"
  on public.announcements for delete
  to authenticated
  using ( public.is_admin() );

-- get_active_announcement() / getActiveAnnouncementRow() (the anonymous
-- public path) are untouched — they use the admin client, which bypasses
-- RLS regardless of these policies.
