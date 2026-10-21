-- get_active_announcement() was declared to return a single composite row
-- (public.announcements). When zero rows match, Postgres/PostgREST doesn't
-- return NULL for that shape — it returns a row with every field set to
-- null, which callers can't distinguish from "no announcement" via a plain
-- truthiness/`?? null` check. Returning `setof` instead gives an empty
-- array when nothing matches, removing the ambiguity entirely.
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
    and ("startsAt" is null or "startsAt" <= now())
    and ("endsAt" is null or "endsAt" > now())
  order by "startsAt" desc nulls last, "updatedAt" desc
  limit 1
$$;
