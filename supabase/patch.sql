-- Patch for existing environments (idempotent where possible)
-- Apply after initial schema if DB already exists.

-- 1) bars: add jsonb config + updated_at
alter table if exists public.bars
  add column if not exists config jsonb not null default '{}'::jsonb;

alter table if exists public.bars
  add column if not exists updated_at timestamptz not null default now();

-- wheel_spins: audit segment info
alter table if exists public.wheel_spins
  add column if not exists segment_id text;

alter table if exists public.wheel_spins
  add column if not exists segment_label text;

alter table if exists public.wheel_spins
  add column if not exists segment_type text;

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

-- 2) RLS (optional but recommended) - enable + policies
alter table if exists public.bars enable row level security;
alter table if exists public.customers enable row level security;
alter table if exists public.memberships enable row level security;
alter table if exists public.rewards enable row level security;

-- bars: public read
drop policy if exists "bars_public_read" on public.bars;
create policy "bars_public_read"
on public.bars
for select
to anon, authenticated
using (true);

-- customers: users can read/insert/update their own profile row
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

-- memberships: users can read their own memberships
drop policy if exists "memberships_self_read" on public.memberships;
create policy "memberships_self_read"
on public.memberships
for select
to authenticated
using (customer_id = auth.uid());

-- rewards: users can read their own rewards
drop policy if exists "rewards_self_read" on public.rewards;
create policy "rewards_self_read"
on public.rewards
for select
to authenticated
using (customer_id = auth.uid());

