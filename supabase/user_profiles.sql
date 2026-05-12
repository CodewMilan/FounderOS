-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Creates a personal-details table linked to auth.users with RLS and a signup trigger.

-- 1) Table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_profiles is 'End-user personal details; one row per auth user.';

-- 2) RLS
alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3) Auto-create row when a new auth user is created (email OTP, OAuth, etc.)
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- If your Postgres build rejects the above, try instead:
--   for each row execute procedure public.handle_new_user_profile();

-- 4) Optional: bump updated_at on change
create or replace function public.set_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_user_profiles_updated_at();

-- 5) Email OTP (Supabase Dashboard)
-- Authentication → Providers → Email: enable the provider.
-- Authentication → Email Templates: use the "Magic Link" / OTP template that includes {{ .Token }} so users receive a 6-digit code.
-- Authentication → URL configuration: add redirect URLs, e.g.
--   http://localhost:3000/auth/callback
--   https://YOUR_DOMAIN/auth/callback
