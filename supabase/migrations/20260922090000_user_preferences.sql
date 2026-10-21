create table public.user_preferences (
  "userId"    uuid primary key references auth.users(id) on delete cascade,
  locale      text not null default 'fr' check (locale in ('fr', 'en')),
  theme       text not null default 'system' check (theme in ('light', 'dark', 'system')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own"
  on public.user_preferences for select
  to authenticated
  using (auth.uid() = "userId");

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  to authenticated
  with check (auth.uid() = "userId");

create policy "user_preferences_update_own"
  on public.user_preferences for update
  to authenticated
  using (auth.uid() = "userId")
  with check (auth.uid() = "userId");

-- Reuses public.set_updated_at() from 20260919215125_announcements.sql —
-- do not redefine it here; it already targets NEW."updatedAt".
create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- First trigger on auth.users in this repo — no existing handle_new_user()
-- to merge into (no profiles table, no prior on_auth_user_created trigger).
create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_preferences ("userId")
  values (new.id)
  on conflict ("userId") do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_preferences
  after insert on auth.users
  for each row execute function public.handle_new_user_preferences();

-- Backfill existing users.
insert into public.user_preferences ("userId")
select id from auth.users
on conflict ("userId") do nothing;
