begin;

create table catalog.part_sources (
  part_id uuid not null references catalog.parts(id) on delete restrict,
  source_location_id uuid not null references catalog.source_locations(id) on delete restrict,
  assertion_type text not null default 'identity' check (assertion_type in ('identity', 'name', 'description', 'classification')),
  confidence numeric(4,3) not null default 1 check (confidence >= 0 and confidence <= 1),
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (part_id, source_location_id, assertion_type)
);

create table catalog.part_number_sources (
  part_number_id uuid not null references catalog.part_numbers(id) on delete restrict,
  source_location_id uuid not null references catalog.source_locations(id) on delete restrict,
  confidence numeric(4,3) not null default 1 check (confidence >= 0 and confidence <= 1),
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (part_number_id, source_location_id)
);

create table catalog.fitment_sources (
  fitment_id uuid not null references catalog.fitments(id) on delete restrict,
  source_location_id uuid not null references catalog.source_locations(id) on delete restrict,
  confidence numeric(4,3) not null default 1 check (confidence >= 0 and confidence <= 1),
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (fitment_id, source_location_id)
);

create table catalog.occurrence_sources (
  part_occurrence_id uuid not null references catalog.part_occurrences(id) on delete restrict,
  source_location_id uuid not null references catalog.source_locations(id) on delete restrict,
  confidence numeric(4,3) not null default 1 check (confidence >= 0 and confidence <= 1),
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (part_occurrence_id, source_location_id)
);

create table catalog.relationship_sources (
  part_number_relationship_id uuid not null references catalog.part_number_relationships(id) on delete restrict,
  source_location_id uuid not null references catalog.source_locations(id) on delete restrict,
  confidence numeric(4,3) not null default 1 check (confidence >= 0 and confidence <= 1),
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (part_number_relationship_id, source_location_id)
);

-- Additive bridge only: public.inventory is not altered. A legacy dealer listing
-- may remain unresolved or may resolve to exactly one approved part number.
create table catalog.dealer_inventory_resolutions (
  inventory_id bigint primary key references public.inventory(id) on delete restrict,
  part_number_id uuid not null references catalog.part_numbers(id) on delete restrict,
  resolution_status text not null default 'candidate' check (
    resolution_status in ('candidate', 'verified', 'rejected', 'stale')
  ),
  resolution_method text not null check (
    resolution_method in ('exact_issuer_number', 'approved_alias', 'manual', 'import_mapping')
  ),
  confidence numeric(4,3) not null default 1 check (confidence >= 0 and confidence <= 1),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dealer_inventory_resolutions_part_number_idx
  on catalog.dealer_inventory_resolutions(part_number_id);
create trigger dealer_inventory_resolutions_set_updated_at
before update on catalog.dealer_inventory_resolutions
for each row execute function catalog.set_updated_at();

commit;
