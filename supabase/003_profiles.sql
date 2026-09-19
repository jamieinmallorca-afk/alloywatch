-- 003_profiles.sql
-- Run in Supabase SQL Editor (project: nrpeuiutvlmtarteufgv)

create table if not exists profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  plan               text not null default 'free'
                     check (plan in ('free', 'pro', 'enterprise')),
  alert_email        boolean not null default true,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Row-level security
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Service role bypass (used by API routes with supabase-js service key)
create policy "Service role full access"
  on profiles for all
  using (auth.role() = 'service_role');

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Updated-at trigger
create or replace function profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function profiles_updated_at();
