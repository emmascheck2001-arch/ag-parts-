-- ============================================================================
-- EzParts — Dealer inventory (the SUPPLY side). Run in the Supabase SQL editor.
--
-- This is the "Uber Eats menu": real dealers, each with a Stripe Connect
-- account, listing real parts with real price + stock. The fitment index says
-- which part fits; this says who sells it, for how much, and where the money
-- goes. Replaces the localStorage demo listings.
-- ============================================================================

-- ── Dealers ─────────────────────────────────────────────────────────────────
create table if not exists dealers (
  id                bigserial primary key,
  name              text not null,
  email             text,
  stripe_account_id text,                 -- Stripe Connect acct (acct_...) for payouts
  phone             text,
  address           text,
  city              text,
  state             text,
  lat               numeric,
  lng               numeric,
  rating            numeric(2,1) default 4.7,
  status            text default 'pending', -- pending | active (payouts enabled)
  created_at        timestamptz default now(),
  unique (name)
);

-- ── Inventory (a dealer's listing of one part) ──────────────────────────────
-- pn_norm links to parts.pn_norm (the fitment index). One row per dealer+part.
create table if not exists inventory (
  id            bigserial primary key,
  dealer_id     bigint references dealers(id) on delete cascade,
  pn_norm       text not null,
  part_number   text,
  name          text,
  price         numeric(10,2) not null,    -- the part price the farmer pays
  ship          numeric(10,2) default 0,   -- dealer's shipping cost
  stock         int default 0,
  lead_days     int default 2,
  active        boolean default true,
  updated_at    timestamptz default now(),
  unique (dealer_id, pn_norm)
);

create index if not exists idx_inventory_pn       on inventory(pn_norm);
create index if not exists idx_inventory_dealer   on inventory(dealer_id);

-- ── Orders (so a placed order survives a refresh — today it's React state) ───
-- Drop the empty legacy `orders` table (old app schema, wrong columns) so the
-- definition below actually applies. Safe: confirmed 0 rows.
drop table if exists orders cascade;
create table if not exists orders (
  id              bigserial primary key,
  order_ref       text unique,             -- "ORD-..." shown to the user
  dealer_id       bigint references dealers(id),
  buyer_email     text,
  buyer_phone     text,
  ship_address    text,
  fulfillment     text,                    -- ship | pickup
  items           jsonb,                   -- line items snapshot
  subtotal        numeric(10,2),
  shipping        numeric(10,2),
  total           numeric(10,2),           -- what the farmer paid
  platform_fee    numeric(10,2),           -- EzParts commission (from dealer side)
  dealer_payout   numeric(10,2),
  stripe_payment_intent text,
  status          text default 'pending',  -- pending | paid | shipped | delivered | cancelled
  created_at      timestamptz default now()
);
create index if not exists idx_orders_dealer on orders(dealer_id);

-- ── RLS: public read of supply; writes via service role / dealer auth ────────
alter table dealers   enable row level security;
alter table inventory enable row level security;
alter table orders    enable row level security;
do $$ begin
  create policy "public read dealers"   on dealers   for select using (true);
  create policy "public read inventory" on inventory for select using (active);
exception when duplicate_object then null; end $$;
-- Orders are NOT publicly readable (contain buyer contact). Reads/writes happen
-- server-side (service role) or via authenticated dealer/buyer policies later.
