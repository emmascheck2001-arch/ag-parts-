-- ============================================================================
-- EzParts — Fitment Index (the moat). Run in the Supabase SQL editor.
--
-- This is the structured "index" EzParts owns: machine → part → fits-correctly
-- → serial → cross-reference. Content you DON'T own (price/stock) comes from
-- dealer listings at runtime; this holds only the fitment graph.
-- ============================================================================

-- ── Machines ────────────────────────────────────────────────────────────────
create table if not exists machines (
  id          bigserial primary key,
  make        text not null,
  model       text not null,
  type        text,                     -- Tractor, Combine, ...
  year_from   int,
  year_to     int,
  hp          text,
  image_url   text,
  created_at  timestamptz default now(),
  unique (make, model)
);

-- ── Parts (keyed by normalized part number) ─────────────────────────────────
-- pn_norm = upper(part_number) with spaces/dashes stripped — the dedup key so
-- "RE587791" and "RE 587791" don't fragment.
create table if not exists parts (
  id            bigserial primary key,
  part_number   text not null,
  pn_norm       text not null unique,
  name          text,
  category      text,                   -- Filters, Hydraulic, Belts, ...
  brand         text,                   -- John Deere, Donaldson, Baldwin, ...
  is_oem        boolean default false,
  created_at    timestamptz default now()
);

-- ── Fitments (which part fits which machine, and how) ───────────────────────
-- serial_from/serial_to bound the applicable production-sequence range for
-- serial-break parts; null = applies to all serials.
create table if not exists fitments (
  id            bigserial primary key,
  machine_id    bigint references machines(id) on delete cascade,
  part_id       bigint references parts(id) on delete cascade,
  position      text,                   -- "Primary engine air filter"
  qty           int default 1,
  serial_from   bigint,                 -- null = from the beginning
  serial_to     bigint,                 -- null = no upper bound
  serial_note   text,                   -- e.g. "TSN 110760 and up"
  verified      boolean default false,  -- verified vs. AI-extracted
  source        text,                   -- "JD filter overview", "Donaldson AG guide", "dealer", "crowd"
  confidence    numeric(3,2) default 1, -- 0..1 from the extractor
  last_verified timestamptz,
  created_at    timestamptz default now(),
  unique (machine_id, part_id, serial_from, serial_to)
);

-- ── Cross-references (OEM ↔ aftermarket equivalents) ────────────────────────
create table if not exists crossrefs (
  id            bigserial primary key,
  part_id       bigint references parts(id) on delete cascade, -- the part this equiv replaces
  brand         text not null,          -- Donaldson, Baldwin, WIX, ...
  equiv_number  text not null,
  source        text,
  confidence    numeric(3,2) default 1,
  created_at    timestamptz default now(),
  unique (part_id, brand, equiv_number)
);

-- ── Demand-driven crawl: log searches we couldn't answer ────────────────────
-- Each unmet search is both the ingestion queue and a demand signal.
create table if not exists search_misses (
  id          bigserial primary key,
  query       text not null,
  hits        int default 1,            -- bump on repeat
  status      text default 'queued',    -- queued | ingesting | done | skipped
  first_seen  timestamptz default now(),
  last_seen   timestamptz default now(),
  unique (query)
);

-- ── Ingestion provenance (which catalogs we've eaten) ───────────────────────
create table if not exists ingestion_sources (
  id           bigserial primary key,
  label        text,                    -- "Donaldson Ag Application Guide 2024"
  url          text,
  rows_written int default 0,
  processed_at timestamptz default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_parts_pn_norm   on parts(pn_norm);
create index if not exists idx_parts_category   on parts(category);
create index if not exists idx_fitments_machine on fitments(machine_id);
create index if not exists idx_fitments_part    on fitments(part_id);
create index if not exists idx_crossrefs_part   on crossrefs(part_id);

-- ── Row Level Security: public read, writes via service role only ───────────
alter table machines    enable row level security;
alter table parts       enable row level security;
alter table fitments    enable row level security;
alter table crossrefs   enable row level security;
do $$ begin
  create policy "public read machines"  on machines  for select using (true);
  create policy "public read parts"     on parts     for select using (true);
  create policy "public read fitments"  on fitments  for select using (true);
  create policy "public read crossrefs" on crossrefs for select using (true);
exception when duplicate_object then null; end $$;
-- Demand log: let the app record unanswered searches (no read exposure).
alter table search_misses enable row level security;
do $$ begin
  create policy "anon insert misses" on search_misses for insert with check (true);
exception when duplicate_object then null; end $$;

-- Ingestion / dealer writes use the service-role key (bypasses RLS) from a
-- server-side function — never the anon key in the browser.
