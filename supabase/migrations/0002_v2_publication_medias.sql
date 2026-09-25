-- V2 lot 2 — Pages publiées (hébergement en 1 clic) et médias publics (images IA).
-- À exécuter dans Supabase : SQL Editor → coller ce fichier → Run (après 0001).

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null default '',
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$'),
  custom_domain text unique,
  html text not null,
  views integer not null default 0,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sites_user_idx on public.sites (user_id, updated_at desc);

alter table public.sites enable row level security;

-- Le propriétaire voit ses pages ; l'affichage public passe par le serveur (service role).
drop policy if exists "pages lisibles par leur propriétaire" on public.sites;
create policy "pages lisibles par leur propriétaire" on public.sites
  for select using (auth.uid() = user_id);

-- Compteur de vues (appelé par le serveur à chaque affichage)
create or replace function public.increment_site_views(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.sites set views = views + 1 where id = p_id;
$$;
revoke all on function public.increment_site_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_site_views(uuid) to service_role;

-- Bucket public « media » : images IA et images importées, utilisables dans les pages publiées.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "médias du propriétaire (écriture)" on storage.objects;
create policy "médias du propriétaire (écriture)" on storage.objects
  for insert with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
