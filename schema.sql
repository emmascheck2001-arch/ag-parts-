-- PartFinder AG — Supabase Schema
-- Paste this entire file into Supabase > SQL Editor > New query, then Run.

create extension if not exists "uuid-ossp";

-- Farmer's garage
create table machines (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid,
  make          text not null,
  model         text not null,
  year          int,
  pin           text,
  engine_hours  int,
  created_at    timestamptz default now()
);

-- Part catalogue
create table parts (
  id            uuid primary key default uuid_generate_v4(),
  part_number   text not null unique,
  name          text not null,
  category      text,
  description   text,
  image_url     text,
  created_at    timestamptz default now()
);

-- Fitment — which part fits which make/model (the "never wrong part" table)
create table fitment (
  id            uuid primary key default uuid_generate_v4(),
  part_id       uuid references parts(id) on delete cascade,
  make          text not null,
  model         text not null,
  year_from     int,
  year_to       int
);
create index on fitment(part_id);
create index on fitment(make, model);

-- Supplier directory
create table suppliers (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  rating          numeric(3,1) default 0,
  rating_count    int default 0,
  ships_in_days   int,
  shipping_cost   numeric(10,2) default 0,
  created_at      timestamptz default now()
);

-- Live prices per supplier per part
create table prices (
  id            uuid primary key default uuid_generate_v4(),
  part_id       uuid references parts(id) on delete cascade,
  supplier_id   uuid references suppliers(id) on delete cascade,
  price         numeric(10,2) not null,
  in_stock_qty  int default 0,
  is_oem        boolean default false,
  last_updated  timestamptz default now()
);
create index on prices(part_id);
create index on prices(supplier_id);

-- Recent searches per user
create table searches (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid,
  query         text not null,
  searched_at   timestamptz default now()
);

-- Orders
create table orders (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid,
  part_id       uuid references parts(id),
  supplier_id   uuid references suppliers(id),
  price_paid    numeric(10,2),
  shipping_paid numeric(10,2),
  ship_to_name  text,
  ship_to_addr  text,
  status        text default 'confirmed',
  created_at    timestamptz default now()
);

-- Order tracking timeline
create table order_events (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid references orders(id) on delete cascade,
  status        text not null,
  note          text,
  occurred_at   timestamptz default now()
);
create index on order_events(order_id);
