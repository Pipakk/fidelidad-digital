create extension if not exists pgcrypto;

create table if not exists public.bars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  stamp_goal int not null default 8,
  reward_title text not null default 'Consumición gratis',
  reward_expires_days int not null default 30,
  stamp_daily_limit int not null default 1,
  wheel_enabled boolean not null default true,
  wheel_cooldown_days int not null default 7,
  -- Multi-tenant parametrization: canonical config (jsonb)
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bars_updated_at on public.bars;
create trigger set_bars_updated_at
before update on public.bars
for each row
execute function public.set_updated_at();

create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  bar_id uuid not null references public.bars(id) on delete cascade,
  pin_hash text not null,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  bar_id uuid not null references public.bars(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  stamps_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(bar_id, customer_id)
);

create table if not exists public.stamp_events (
  id uuid primary key default gen_random_uuid(),
  bar_id uuid not null references public.bars(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  staff_id uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  bar_id uuid not null references public.bars(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('stamps', 'wheel')),
  title text not null,
  status text not null default 'active' check (status in ('active','redeemed','expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wheel_spins (
  id uuid primary key default gen_random_uuid(),
  bar_id uuid not null references public.bars(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid references public.rewards(id) on delete set null,
  segment_id text,
  segment_label text,
  segment_type text,
  created_at timestamptz not null default now()
);

create index if not exists stamp_events_idx on public.stamp_events (bar_id, customer_id, created_at desc);
create index if not exists rewards_idx on public.rewards (bar_id, customer_id, status);
create index if not exists wheel_spins_idx on public.wheel_spins (bar_id, customer_id, created_at desc);

-- ------------------------------------------------------------
-- RLS (recommended). Keep policies minimal but non-breaking.
-- ------------------------------------------------------------

alter table public.bars enable row level security;
alter table public.customers enable row level security;
alter table public.memberships enable row level security;
alter table public.rewards enable row level security;

-- Public read for business discovery/config.
drop policy if exists "bars_public_read" on public.bars;
create policy "bars_public_read"
on public.bars
for select
to anon, authenticated
using (true);

-- Customers: a user can read/insert/update their own profile.
drop policy if exists "customers_self_read" on public.customers;
create policy "customers_self_read"
on public.customers
for select
to authenticated
using (id = auth.uid());

drop policy if exists "customers_self_upsert" on public.customers;
create policy "customers_self_upsert"
on public.customers
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "customers_self_update" on public.customers;
create policy "customers_self_update"
on public.customers
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Memberships: a user can read their own memberships.
drop policy if exists "memberships_self_read" on public.memberships;
create policy "memberships_self_read"
on public.memberships
for select
to authenticated
using (customer_id = auth.uid());

-- Rewards: a user can read their own rewards.
drop policy if exists "rewards_self_read" on public.rewards;
create policy "rewards_self_read"
on public.rewards
for select
to authenticated
using (customer_id = auth.uid());
