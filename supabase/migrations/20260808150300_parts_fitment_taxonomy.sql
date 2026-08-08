begin;

create table catalog.parts (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  normalized_name text generated always as (catalog.normalize_label(canonical_name)) stored,
  description text,
  part_kind text not null default 'component' check (
    part_kind in ('component', 'assembly', 'kit', 'consumable', 'hardware', 'service_item', 'other')
  ),
  lifecycle_status text not null default 'active' check (
    lifecycle_status in ('active', 'superseded', 'obsolete', 'unknown')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parts_name_not_blank check (btrim(canonical_name) <> '')
);

create index parts_normalized_name_idx on catalog.parts(normalized_name);
create trigger parts_set_updated_at before update on catalog.parts
for each row execute function catalog.set_updated_at();

create table catalog.part_numbers (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references catalog.parts(id) on delete restrict,
  issuer_manufacturer_id uuid not null references catalog.manufacturers(id) on delete restrict,
  number text not null,
  normalized_number text generated always as (catalog.normalize_identifier(number)) stored,
  number_type text not null check (number_type in ('oem', 'aftermarket', 'supplier', 'internal')),
  is_primary boolean not null default false,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint part_numbers_number_not_blank check (btrim(number) <> ''),
  constraint part_numbers_normalized_not_blank check (catalog.normalize_identifier(number) <> ''),
  constraint part_numbers_valid_dates check (valid_from is null or valid_to is null or valid_from <= valid_to),
  constraint part_numbers_issuer_number_key unique (issuer_manufacturer_id, normalized_number)
);

create unique index part_numbers_one_primary_per_part_issuer_idx
  on catalog.part_numbers(part_id, issuer_manufacturer_id) where is_primary;
create index part_numbers_part_idx on catalog.part_numbers(part_id);
create index part_numbers_normalized_idx on catalog.part_numbers(normalized_number);
create trigger part_numbers_set_updated_at before update on catalog.part_numbers
for each row execute function catalog.set_updated_at();

create table catalog.part_name_aliases (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references catalog.parts(id) on delete restrict,
  alias text not null,
  normalized_alias text generated always as (catalog.normalize_label(alias)) stored,
  source_document_id uuid references catalog.source_documents(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint part_name_aliases_alias_not_blank check (btrim(alias) <> ''),
  constraint part_name_aliases_identity_key unique nulls not distinct (part_id, normalized_alias, source_document_id)
);

create table catalog.part_number_relationships (
  id uuid primary key default gen_random_uuid(),
  from_part_number_id uuid not null references catalog.part_numbers(id) on delete restrict,
  to_part_number_id uuid not null references catalog.part_numbers(id) on delete restrict,
  relationship_type text not null check (
    relationship_type in ('equivalent_to', 'supersedes', 'superseded_by', 'replaces', 'replaced_by', 'remanufactured_for')
  ),
  status text not null default 'candidate' check (status in ('candidate', 'verified', 'rejected')),
  effective_from date,
  effective_to date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint part_number_relationships_not_self check (from_part_number_id <> to_part_number_id),
  constraint part_number_relationships_dates_valid check (
    effective_from is null or effective_to is null or effective_from <= effective_to
  ),
  constraint part_number_relationships_identity_key unique (
    from_part_number_id, to_part_number_id, relationship_type
  )
);

create index part_number_relationships_to_idx on catalog.part_number_relationships(to_part_number_id);
create trigger part_number_relationships_set_updated_at before update on catalog.part_number_relationships
for each row execute function catalog.set_updated_at();

create table catalog.taxonomy_nodes (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references catalog.taxonomy_nodes(id) on delete restrict,
  node_type text not null check (node_type in ('part_category', 'part_class', 'attribute_group')),
  canonical_name text not null,
  normalized_name text generated always as (catalog.normalize_label(canonical_name)) stored,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxonomy_nodes_name_not_blank check (btrim(canonical_name) <> ''),
  constraint taxonomy_nodes_not_self_parent check (parent_id is null or parent_id <> id),
  constraint taxonomy_nodes_identity_key unique nulls not distinct (parent_id, node_type, normalized_name),
  constraint taxonomy_nodes_slug_key unique (slug)
);

create index taxonomy_nodes_parent_idx on catalog.taxonomy_nodes(parent_id);
create trigger taxonomy_nodes_set_updated_at before update on catalog.taxonomy_nodes
for each row execute function catalog.set_updated_at();

create table catalog.taxonomy_aliases (
  id uuid primary key default gen_random_uuid(),
  taxonomy_node_id uuid not null references catalog.taxonomy_nodes(id) on delete restrict,
  source_scope text not null default '*',
  raw_value text not null,
  normalized_value text generated always as (catalog.normalize_label(raw_value)) stored,
  mapping_status text not null default 'approved' check (mapping_status in ('proposed', 'approved', 'rejected')),
  source_document_id uuid references catalog.source_documents(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint taxonomy_aliases_raw_not_blank check (btrim(raw_value) <> ''),
  constraint taxonomy_aliases_scope_not_blank check (btrim(source_scope) <> ''),
  constraint taxonomy_aliases_scope_value_key unique (source_scope, normalized_value)
);

create table catalog.part_taxonomy_assignments (
  part_id uuid not null references catalog.parts(id) on delete restrict,
  taxonomy_node_id uuid not null references catalog.taxonomy_nodes(id) on delete restrict,
  is_primary boolean not null default false,
  assignment_status text not null default 'candidate' check (assignment_status in ('candidate', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  primary key (part_id, taxonomy_node_id)
);

create unique index part_taxonomy_one_primary_idx
  on catalog.part_taxonomy_assignments(part_id) where is_primary and assignment_status = 'verified';

create table catalog.fitments (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references catalog.parts(id) on delete restrict,
  model_variant_id uuid not null references catalog.model_variants(id) on delete restrict,
  serial_range_id uuid references catalog.serial_ranges(id) on delete restrict,
  applicability_type text not null default 'fits' check (applicability_type in ('fits', 'optional', 'excluded')),
  verification_status text not null default 'candidate' check (
    verification_status in ('candidate', 'verified', 'rejected', 'deprecated')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fitments_identity_key unique nulls not distinct (
    part_id, model_variant_id, serial_range_id, applicability_type
  )
);

create index fitments_variant_idx on catalog.fitments(model_variant_id);
create index fitments_part_idx on catalog.fitments(part_id);
create trigger fitments_set_updated_at before update on catalog.fitments
for each row execute function catalog.set_updated_at();

create table catalog.part_occurrences (
  id uuid primary key default gen_random_uuid(),
  catalog_section_id uuid not null references catalog.catalog_sections(id) on delete restrict,
  part_id uuid not null references catalog.parts(id) on delete restrict,
  serial_range_id uuid references catalog.serial_ranges(id) on delete restrict,
  occurrence_key text not null,
  illustration_reference text,
  position_name text,
  quantity numeric(12,3) not null default 1,
  occurrence_status text not null default 'candidate' check (
    occurrence_status in ('candidate', 'verified', 'rejected', 'deprecated')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint part_occurrences_key_not_blank check (btrim(occurrence_key) <> ''),
  constraint part_occurrences_quantity_positive check (quantity > 0),
  constraint part_occurrences_section_key unique (catalog_section_id, occurrence_key)
);

create index part_occurrences_part_idx on catalog.part_occurrences(part_id);
create index part_occurrences_section_idx on catalog.part_occurrences(catalog_section_id);
create index part_occurrences_serial_range_idx on catalog.part_occurrences(serial_range_id);
create trigger part_occurrences_set_updated_at before update on catalog.part_occurrences
for each row execute function catalog.set_updated_at();

commit;
