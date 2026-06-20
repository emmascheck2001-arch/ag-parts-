-- ============================================================================
-- EzParts — Auth profiles. Run in the Supabase SQL editor.
--
-- Supabase Auth (auth.users) handles credentials; this adds a profile per user
-- with their role and (for dealers) business name. Farmers never need an
-- account — guest checkout stays open. Dealers sign in so listings/orders tie
-- to them.
--
-- Also enable email/password in Supabase → Authentication → Providers, and for
-- low-friction dealer onboarding consider turning OFF "Confirm email" while
-- testing (Authentication → Settings).
-- ============================================================================

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'farmer',  -- 'farmer' | 'dealer'
  dealer_name text,                             -- business name for dealers
  email       text,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

-- A user can read, create, and update ONLY their own profile.
do $$ begin
  create policy "own profile read"   on profiles for select using (auth.uid() = id);
  create policy "own profile insert" on profiles for insert with check (auth.uid() = id);
  create policy "own profile update" on profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- NOTE on dealer-scoping: inventory/order writes go through the service-role
-- serverless functions (save-inventory, save-order, get-orders), so they bypass
-- RLS today. Before production, harden those functions to verify the caller's
-- auth token and that the dealer_name/dealer_id matches the signed-in dealer,
-- so a dealer can only touch their own inventory and see their own orders.
