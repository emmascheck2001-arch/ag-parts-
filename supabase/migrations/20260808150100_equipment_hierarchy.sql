begin;

create table catalog.manufacturers (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  normalized_name text generated always as (catalog.normalize_label(canonical_name)) stored,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manufacturers_canonical_name_not_blank check (btrim(canonical_name) <> ''),
  constraint manufacturers_slug_not_blank check (btrim(slug) <> ''),
  constraint manufacturers_normalized_name_key unique (normalized_name),
  constraint manufacturers_slug_key unique (slug)
);

create trigger manufacturers_set_updated_at
before update on catalog.manufacturers
for each row execute function catalog.set_updated_at();

create table catalog.manufacturer_aliases (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references catalog.manufacturers(id) on delete restrict,
  alias text not null,
  normalized_alias text generated always as (catalog.normalize_label(alias)) stored,
  source_scope text not null default '*',
  created_at timestamptz not null default now(),
  constraint manufacturer_aliases_alias_not_blank check (btrim(alias) <> ''),
  constraint manufacturer_aliases_scope_not_blank check (btrim(source_scope) <> ''),
  constraint manufacturer_aliases_scope_alias_key unique (source_scope, normalized_alias)
);

create table catalog.machine_types (
  id uuid primary key default gen_random_uuid(),
  parent_machine_type_id uuid references catalog.machine_types(id) on delete restrict,
  canonical_name text not null,
  normalized_name text generated always as (catalog.normalize_label(canonical_name)) stored,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint machine_types_name_not_blank check (btrim(canonical_name) <> ''),
  constraint machine_types_slug_not_blank check (btrim(slug) <> ''),
  constraint machine_types_normalized_name_key unique nulls not distinct (parent_machine_type_id, normalized_name),
  constraint machine_types_slug_key unique (slug),
  constraint machine_types_not_self_parent check (parent_machine_type_id is null or parent_machine_type_id <> id)
);

create trigger machine_types_set_updated_at
before update on catalog.machine_types
for each row execute function catalog.set_updated_at();

create table catalog.machine_models (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references catalog.manufacturers(id) on delete restrict,
  machine_type_id uuid not null references catalog.machine_types(id) on delete restrict,
  model_code text not null,
  normalized_model_code text generated always as (catalog.normalize_identifier(model_code)) stored,
  display_name text not null,
  introduction_year integer,
  discontinuation_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint machine_models_code_not_blank check (btrim(model_code) <> ''),
  constraint machine_models_display_name_not_blank check (btrim(display_name) <> ''),
  constraint machine_models_years_valid check (
    introduction_year is null or discontinuation_year is null or introduction_year <= discontinuation_year
  ),
  constraint machine_models_identity_key unique (manufacturer_id, machine_type_id, normalized_model_code)
);

create index machine_models_manufacturer_idx on catalog.machine_models(manufacturer_id);
create index machine_models_machine_type_idx on catalog.machine_models(machine_type_id);

create trigger machine_models_set_updated_at
before update on catalog.machine_models
for each row execute function catalog.set_updated_at();

create table catalog.model_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references catalog.machine_models(id) on delete restrict,
  variant_code text not null,
  normalized_variant_code text generated always as (catalog.normalize_identifier(variant_code)) stored,
  display_name text not null,
  market text,
  configuration jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint model_variants_code_not_blank check (btrim(variant_code) <> ''),
  constraint model_variants_display_name_not_blank check (btrim(display_name) <> ''),
  constraint model_variants_configuration_object check (jsonb_typeof(configuration) = 'object'),
  constraint model_variants_identity_key unique (model_id, normalized_variant_code)
);

create unique index model_variants_one_default_per_model_idx
  on catalog.model_variants(model_id) where is_default;
create index model_variants_model_idx on catalog.model_variants(model_id);

create trigger model_variants_set_updated_at
before update on catalog.model_variants
for each row execute function catalog.set_updated_at();

create table catalog.serial_ranges (
  id uuid primary key default gen_random_uuid(),
  model_variant_id uuid not null references catalog.model_variants(id) on delete restrict,
  range_code text not null,
  pin_prefix text,
  serial_from text,
  serial_to text,
  serial_from_numeric numeric,
  serial_to_numeric numeric,
  year_from integer,
  year_to integer,
  applicability_note text,
  is_all_serials boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint serial_ranges_code_not_blank check (btrim(range_code) <> ''),
  constraint serial_ranges_bounds_valid check (
    serial_from_numeric is null or serial_to_numeric is null or serial_from_numeric <= serial_to_numeric
  ),
  constraint serial_ranges_years_valid check (year_from is null or year_to is null or year_from <= year_to),
  constraint serial_ranges_all_or_bounded check (
    not is_all_serials or
    (pin_prefix is null and serial_from is null and serial_to is null and
     serial_from_numeric is null and serial_to_numeric is null)
  ),
  constraint serial_ranges_identity_key unique (model_variant_id, range_code)
);

create unique index serial_ranges_one_all_serials_per_variant_idx
  on catalog.serial_ranges(model_variant_id) where is_all_serials;
create index serial_ranges_variant_idx on catalog.serial_ranges(model_variant_id);

create trigger serial_ranges_set_updated_at
before update on catalog.serial_ranges
for each row execute function catalog.set_updated_at();

commit;
