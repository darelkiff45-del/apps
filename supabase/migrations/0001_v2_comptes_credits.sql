-- V2 — Comptes, crédits, projets, paiements.
-- À exécuter dans Supabase : SQL Editor → coller ce fichier → Run.

-- ---------------------------------------------------------------------------
-- Profils (1 par utilisateur, créé automatiquement à l'inscription)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'business')),
  plan_expires_at timestamptz,
  credits integer not null default 5 check (credits >= 0),
  credits_reset_at timestamptz not null default now() + interval '30 days',
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- Crédits mensuels par formule (garder en phase avec src/lib/plans.ts)
create or replace function public.plan_credits(p_plan text)
returns integer language sql immutable as $$
  select case p_plan
    when 'starter' then 30
    when 'pro' then 150
    when 'business' then 500
    else 5
  end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Projets (ebooks, templates, pages, mockups, vidéos…)
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('ebook', 'template', 'site', 'sales-page', 'mockup', 'video')),
  title text not null,
  data jsonb not null default '{}'::jsonb,
  files jsonb not null default '[]'::jsonb, -- chemins dans le bucket « projects »
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Historique de consommation des crédits
-- ---------------------------------------------------------------------------
create table if not exists public.usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  credits integer not null, -- négatif = remboursement
  created_at timestamptz not null default now()
);
create index if not exists usage_user_idx on public.usage (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Paiements (Stripe et CinetPay)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('stripe', 'cinetpay')),
  plan text not null,
  amount integer not null,
  currency text not null default 'XOF',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  reference text not null unique, -- id de transaction CinetPay ou de facture Stripe
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Sécurité : chaque utilisateur ne voit que ses données.
-- Les crédits et la formule ne sont modifiables que par le serveur (service role).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.usage enable row level security;
alter table public.payments enable row level security;

drop policy if exists "profil lisible par son propriétaire" on public.profiles;
create policy "profil lisible par son propriétaire" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "projets du propriétaire" on public.projects;
create policy "projets du propriétaire" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "usage lisible par son propriétaire" on public.usage;
create policy "usage lisible par son propriétaire" on public.usage
  for select using (auth.uid() = user_id);

drop policy if exists "paiements lisibles par leur propriétaire" on public.payments;
create policy "paiements lisibles par leur propriétaire" on public.payments
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Renouvellement mensuel + expiration de la formule (appelé avant chaque débit)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_profile(p_user uuid)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  prof public.profiles;
begin
  select * into prof from public.profiles where id = p_user for update;
  if not found then
    raise exception 'profile_not_found';
  end if;

  if prof.plan <> 'free' and prof.plan_expires_at is not null and prof.plan_expires_at < now() then
    update public.profiles
      set plan = 'free', plan_expires_at = null,
          credits = least(credits, plan_credits('free')),
          credits_reset_at = now() + interval '30 days'
      where id = p_user returning * into prof;
  end if;

  if prof.credits_reset_at < now() then
    update public.profiles
      set credits = plan_credits(plan), credits_reset_at = now() + interval '30 days'
      where id = p_user returning * into prof;
  end if;

  return prof;
end;
$$;

-- Débit atomique : échoue avec « insufficient_credits » si le solde ne suffit pas.
create or replace function public.consume_credits(p_user uuid, p_amount integer, p_kind text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  remaining integer;
begin
  perform public.refresh_profile(p_user);
  update public.profiles set credits = credits - p_amount
    where id = p_user and credits >= p_amount
    returning credits into remaining;
  if remaining is null then
    raise exception 'insufficient_credits';
  end if;
  insert into public.usage (user_id, kind, credits) values (p_user, p_kind, p_amount);
  return remaining;
end;
$$;

-- Remboursement si la génération échoue.
create or replace function public.refund_credits(p_user uuid, p_amount integer, p_kind text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  remaining integer;
begin
  update public.profiles set credits = credits + p_amount where id = p_user returning credits into remaining;
  insert into public.usage (user_id, kind, credits) values (p_user, p_kind || ' (remboursé)', -p_amount);
  return remaining;
end;
$$;

-- Active ou prolonge une formule après un paiement confirmé (idempotent par référence).
create or replace function public.activate_plan(p_reference text, p_days integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
begin
  update public.payments set status = 'paid', paid_at = now()
    where reference = p_reference and status <> 'paid'
    returning * into pay;
  if not found then
    return false; -- déjà traité ou inconnu
  end if;

  update public.profiles
    set plan = pay.plan,
        plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + make_interval(days => p_days),
        credits = greatest(credits, plan_credits(pay.plan)),
        credits_reset_at = now() + interval '30 days'
    where id = pay.user_id;
  return true;
end;
$$;

revoke all on function public.refresh_profile(uuid) from public, anon, authenticated;
revoke all on function public.consume_credits(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.activate_plan(text, integer) from public, anon, authenticated;
grant execute on function public.refresh_profile(uuid) to service_role;
grant execute on function public.consume_credits(uuid, integer, text) to service_role;
grant execute on function public.refund_credits(uuid, integer, text) to service_role;
grant execute on function public.activate_plan(text, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Stockage cloud : bucket privé « projects », un dossier par utilisateur.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('projects', 'projects', false)
on conflict (id) do nothing;

drop policy if exists "fichiers du propriétaire (lecture)" on storage.objects;
create policy "fichiers du propriétaire (lecture)" on storage.objects
  for select using (bucket_id = 'projects' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fichiers du propriétaire (écriture)" on storage.objects;
create policy "fichiers du propriétaire (écriture)" on storage.objects
  for insert with check (bucket_id = 'projects' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fichiers du propriétaire (suppression)" on storage.objects;
create policy "fichiers du propriétaire (suppression)" on storage.objects
  for delete using (bucket_id = 'projects' and (storage.foldername(name))[1] = auth.uid()::text);
