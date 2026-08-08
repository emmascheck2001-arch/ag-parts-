begin;

create table catalog.systems (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  normalized_name text generated always as (catalog.normalize_label(canonical_name)) stored,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint systems_name_not_blank check (btrim(canonical_name) <> ''),
  constraint systems_name_key unique (normalized_name),
  constraint systems_slug_key unique (slug)
);

create trigger systems_set_updated_at before update on catalog.systems
for each row execute function catalog.set_updated_at();

create table catalog.subsystems (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references catalog.systems(id) on delete restrict,
  canonical_name text not null,
  normalized_name text generated always as (catalog.normalize_label(canonical_name)) stored,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subsystems_name_not_blank check (btrim(canonical_name) <> ''),
  constraint subsystems_identity_key unique (system_id, normalized_name),
  constraint subsystems_slug_key unique (system_id, slug)
);

create index subsystems_system_idx on catalog.subsystems(system_id);
create trigger subsystems_set_updated_at before update on catalog.subsystems
for each row execute function catalog.set_updated_at();

create table catalog.assemblies (
  id uuid primary key default gen_random_uuid(),
  subsystem_id uuid not null references catalog.subsystems(id) on delete restrict,
  canonical_name text not null,
  normalized_name text generated always as (catalog.normalize_label(canonical_name)) stored,
  assembly_code text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assemblies_name_not_blank check (btrim(canonical_name) <> ''),
  constraint assemblies_identity_key unique (subsystem_id, normalized_name)
);

create index assemblies_subsystem_idx on catalog.assemblies(subsystem_id);
create trigger assemblies_set_updated_at before update on catalog.assemblies
for each row execute function catalog.set_updated_at();

create table catalog.source_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (catalog.normalize_label(name)) stored,
  organization_type text not null check (
    organization_type in ('manufacturer', 'dealer', 'distributor', 'publisher', 'government', 'other')
  ),
  website_url text,
  created_at timestamptz not null default now(),
  constraint source_organizations_name_key unique (normalized_name)
);

create table catalog.source_documents (
  id uuid primary key default gen_random_uuid(),
  source_organization_id uuid references catalog.source_organizations(id) on delete restrict,
  document_type text not null check (
    document_type in ('parts_catalog', 'service_manual', 'application_guide', 'price_file', 'api', 'spreadsheet', 'dealer_submission', 'other')
  ),
  title text not null,
  document_number text,
  revision text,
  publication_date date,
  source_url text,
  content_sha256 text,
  created_at timestamptz not null default now(),
  constraint source_documents_title_not_blank check (btrim(title) <> ''),
  constraint source_documents_hash_format check (content_sha256 is null or content_sha256 ~ '^[0-9a-fA-F]{64}$')
);

create unique index source_documents_content_hash_idx
  on catalog.source_documents(lower(content_sha256)) where content_sha256 is not null;

create table catalog.source_locations (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references catalog.source_documents(id) on delete restrict,
  page_number integer,
  figure_number text,
  section_heading text,
  source_record_key text,
  source_payload jsonb,
  created_at timestamptz not null default now(),
  constraint source_locations_page_positive check (page_number is null or page_number > 0),
  constraint source_locations_identity_key unique nulls not distinct (
    source_document_id, page_number, figure_number, source_record_key
  )
);

create index source_locations_document_idx on catalog.source_locations(source_document_id);

create table catalog.catalog_sections (
  id uuid primary key default gen_random_uuid(),
  model_variant_id uuid not null references catalog.model_variants(id) on delete restrict,
  parent_section_id uuid references catalog.catalog_sections(id) on delete restrict,
  assembly_id uuid references catalog.assemblies(id) on delete restrict,
  source_document_id uuid not null references catalog.source_documents(id) on delete restrict,
  section_key text not null,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_sections_key_not_blank check (btrim(section_key) <> ''),
  constraint catalog_sections_title_not_blank check (btrim(title) <> ''),
  constraint catalog_sections_not_self_parent check (parent_section_id is null or parent_section_id <> id),
  constraint catalog_sections_source_key unique (model_variant_id, source_document_id, section_key)
);

create index catalog_sections_variant_idx on catalog.catalog_sections(model_variant_id);
create index catalog_sections_parent_idx on catalog.catalog_sections(parent_section_id);
create index catalog_sections_assembly_idx on catalog.catalog_sections(assembly_id);
create trigger catalog_sections_set_updated_at before update on catalog.catalog_sections
for each row execute function catalog.set_updated_at();

commit;
