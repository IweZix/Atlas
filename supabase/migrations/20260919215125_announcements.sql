create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  "siteId"     text not null,
  message     text not null check (char_length(message) between 1 and 160),
  "linkUrl"    text,
  "linkLabel"  text check ("linkLabel" is null or char_length("linkLabel") <= 40),
  variant     text not null default 'info' check (variant in ('info', 'promo', 'alerte')),
  "startsAt"   timestamptz,
  "endsAt"     timestamptz,
  "isActive"   boolean not null default false,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now(),
  check ("endsAt" is null or "startsAt" is null or "endsAt" > "startsAt"),
  check (("linkUrl" is null) = ("linkLabel" is null))
);

create index announcements_site_active_idx
  on public.announcements ("siteId", "isActive");

-- "updatedAt" automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end $$;

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- RLS activé sans aucune policy : la table est inaccessible
-- avec la clé publique, seule la clé secrète serveur y accède.
alter table public.announcements enable row level security;

-- Sélection de "l'annonce gagnante" : utilisée à la fois par le site public
-- (lib/announcements/get-active.ts) et par le calcul de statut du dashboard
-- (app/[locale]/dashboard/annonces/page.tsx), pour que les deux ne puissent
-- jamais se contredire sur l'annonce actuellement affichée.
-- `security invoker` (par défaut) : tout appelant utilise déjà le client
-- service-role (qui contourne RLS), cette fonction n'a besoin d'aucun
-- privilège élevé propre.
create or replace function public.get_active_announcement(p_site_id text)
returns public.announcements
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
