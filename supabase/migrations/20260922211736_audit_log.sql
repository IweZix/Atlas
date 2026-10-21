-- audit_logs: append-only trail of every insert/update/delete/restore made
-- to an audited table, written exclusively by the SECURITY DEFINER trigger
-- below (or, for the handful of service-role-only admin operations that
-- never touch a public.* table, via lib/audit.ts#logAudit() — see
-- readme/audit.md).
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  "createdAt" timestamptz not null default now(),
  "userId"    uuid,            -- no FK: deleting a user must never cascade/null historical logs
  "userEmail" text,            -- snapshot at write time, stays readable after user deletion
  action      text not null check (action in ('insert', 'update', 'delete', 'restore')),
  "tableName" text not null,
  "recordId"  text,
  "oldData"   jsonb,
  "newData"   jsonb
);

create index audit_logs_record_idx     on public.audit_logs ("tableName", "recordId", "createdAt" desc);
create index audit_logs_user_idx       on public.audit_logs ("userId", "createdAt" desc);
create index audit_logs_created_at_idx on public.audit_logs ("createdAt" desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using ( public.is_admin() );

-- No insert/update/delete policy for anyone, including admins. Only the
-- SECURITY DEFINER trigger (runs as its owner, unaffected by this revoke)
-- and logAudit()'s service-role client (bypasses RLS entirely) can write.
revoke insert, update, delete on public.audit_logs from anon, authenticated;

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
  -- Arguments
  if tg_nargs > 0 and coalesce(tg_argv[0], '') <> '' then
    v_excluded := v_excluded || string_to_array(replace(tg_argv[0], ' ', ''), ',');
  end if;
  if tg_nargs > 1 and coalesce(tg_argv[1], '') <> '' then
    v_pk := tg_argv[1];
  end if;

  -- Auteur : session Supabase, sinon variable de session (scripts / RPC)
  v_user_id := coalesce(
    auth.uid(),
    nullif(current_setting('app.actor_id', true), '')::uuid
  );
  if v_user_id is not null then
    select u.email into v_email from auth.users u where u.id = v_user_id;
  end if;

  -- Id de l'élément
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

  else -- UPDATE
    v_old := to_jsonb(old) - v_excluded;
    v_new := to_jsonb(new) - v_excluded;

    select coalesce(array_agg(e.key), '{}')
      into v_changed
      from jsonb_each(v_new) as e(key, value)
     where e.value is distinct from v_old -> e.key;

    -- Rien de significatif n'a changé (ex. seule updatedAt) : on ne log pas
    if cardinality(v_changed) = 0 then
      return null;
    end if;

    -- Soft delete / restauration
    if v_old ? 'deletedAt'
       and v_old ->> 'deletedAt' is null
       and v_new ->> 'deletedAt' is not null then
      v_action := 'delete';
    elsif v_old ? 'deletedAt'
       and v_old ->> 'deletedAt' is not null
       and v_new ->> 'deletedAt' is null then
      v_action := 'restore';
    else
      v_action := 'update';
    end if;

    -- Ne garder que les champs modifiés
    select jsonb_object_agg(e.key, e.value) into v_old
      from jsonb_each(v_old) as e(key, value) where e.key = any(v_changed);
    select jsonb_object_agg(e.key, e.value) into v_new
      from jsonb_each(v_new) as e(key, value) where e.key = any(v_changed);
  end if;

  insert into public.audit_logs
    ("userId", "userEmail", action, "tableName", "recordId", "oldData", "newData")
  values
    (v_user_id, v_email, v_action, tg_table_name, v_record_id, v_old, v_new);

  return null; -- trigger AFTER : valeur de retour ignorée
end;
$$;

-- Attaches audit_trigger() to a table. drop-if-exists-then-create makes
-- re-running this idempotent (e.g. to change excluded columns / pk).
create or replace function public.enable_audit(
  p_table    regclass,
  p_excluded text default '',
  p_pk       text default 'id'
)
returns void
language plpgsql
as $$
begin
  execute format('drop trigger if exists audit_trigger on %s', p_table);
  execute format(
    'create trigger audit_trigger
       after insert or update or delete on %s
       for each row execute function public.audit_trigger(%L, %L)',
    p_table, p_excluded, p_pk
  );
end;
$$;

revoke execute on function public.enable_audit(regclass, text, text) from public, anon, authenticated;

-- Activation — one line per audited table.
select public.enable_audit('public.announcements');

-- public.user_preferences is intentionally NOT audited: pure self-service
-- (locale/theme), gated by its own "self row only" RLS policies, no
-- admin-facing CRUD surface — auditing it adds noise with zero
-- investigative value (spec §0).
