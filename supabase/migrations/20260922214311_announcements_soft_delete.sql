alter table public.announcements
  add column "isDeleted" boolean not null default false;

-- Soft-deleted announcements must never appear as "the active banner".
drop function if exists public.get_active_announcement(text);
create function public.get_active_announcement(p_site_id text)
returns setof public.announcements
language sql
stable
set search_path = public, pg_temp
as $$
  select *
  from public.announcements
  where "siteId" = p_site_id
    and "isActive" = true
    and not "isDeleted"
    and ("startsAt" is null or "startsAt" <= now())
    and ("endsAt" is null or "endsAt" > now())
  order by "startsAt" desc nulls last, "updatedAt" desc
  limit 1
$$;

-- Generalize the audit trigger's soft-delete/restore detection from the
-- unused "deletedAt" timestamp convention to the real "isDeleted" boolean
-- convention. No table has ever used "deletedAt", so this is a straight
-- swap, not an added branch.
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_excluded  text[] := array['updatedAt'];
  v_pk        text   := 'id';
  v_user_id   uuid;
  v_email     text;
  v_action    text;
  v_record_id text;
  v_old       jsonb;
  v_new       jsonb;
  v_changed   text[];
begin
  if tg_nargs > 0 and coalesce(tg_argv[0], '') <> '' then
    v_excluded := v_excluded || string_to_array(replace(tg_argv[0], ' ', ''), ',');
  end if;
  if tg_nargs > 1 and coalesce(tg_argv[1], '') <> '' then
    v_pk := tg_argv[1];
  end if;

  v_user_id := coalesce(auth.uid(), nullif(current_setting('app.actor_id', true), '')::uuid);
  if v_user_id is not null then
    select u.email into v_email from auth.users u where u.id = v_user_id;
  end if;

  if tg_op = 'DELETE' then
    v_record_id := to_jsonb(old) ->> v_pk;
  else
    v_record_id := to_jsonb(new) ->> v_pk;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'insert';
    v_new := to_jsonb(new) - v_excluded;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_old := to_jsonb(old) - v_excluded;
  else
    v_old := to_jsonb(old) - v_excluded;
    v_new := to_jsonb(new) - v_excluded;

    select coalesce(array_agg(e.key), '{}')
      into v_changed
      from jsonb_each(v_new) as e(key, value)
      where e.value is distinct from v_old -> e.key;

    if cardinality(v_changed) = 0 then
      return null;
    end if;

    if v_old ? 'isDeleted'
       and coalesce((v_old ->> 'isDeleted')::boolean, false) = false
       and coalesce((v_new ->> 'isDeleted')::boolean, false) = true then
      v_action := 'delete';
    elsif v_old ? 'isDeleted'
       and coalesce((v_old ->> 'isDeleted')::boolean, false) = true
       and coalesce((v_new ->> 'isDeleted')::boolean, false) = false then
      v_action := 'restore';
    else
      v_action := 'update';
    end if;

    select jsonb_object_agg(e.key, e.value) into v_old
      from jsonb_each(v_old) as e(key, value) where e.key = any(v_changed);
    select jsonb_object_agg(e.key, e.value) into v_new
      from jsonb_each(v_new) as e(key, value) where e.key = any(v_changed);
  end if;

  insert into public.audit_logs ("userId", "userEmail", action, "tableName", "recordId", "oldData", "newData")
  values (v_user_id, v_email, v_action, tg_table_name, v_record_id, v_old, v_new);

  return null;
end;
$$;

-- The app will only ever soft-delete (UPDATE isDeleted = true) from now on.
-- Dropping this policy makes a hard DELETE impossible for the
-- authenticated/admin role at the database level, not just by convention.
drop policy "announcements_delete_admin" on public.announcements;
