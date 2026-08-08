begin;

create table catalog_staging.import_jobs (
  id uuid primary key default gen_random_uuid(),
  importer_name text not null,
  source_label text not null,
  status text not null default 'received' check (
    status in ('received', 'parsing', 'parsed', 'validating', 'needs_review', 'approved', 'promoting', 'promoted', 'rejected', 'failed')
  ),
  source_organization_id uuid references catalog.source_organizations(id) on delete restrict,
  requested_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_jobs_importer_not_blank check (btrim(importer_name) <> ''),
  constraint import_jobs_source_not_blank check (btrim(source_label) <> '')
);

create trigger import_jobs_set_updated_at before update on catalog_staging.import_jobs
for each row execute function catalog.set_updated_at();

create table catalog_staging.import_files (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references catalog_staging.import_jobs(id) on delete cascade,
  file_name text not null,
  media_type text,
  storage_uri text,
  content_sha256 text not null,
  byte_size bigint,
  created_at timestamptz not null default now(),
  constraint import_files_name_not_blank check (btrim(file_name) <> ''),
  constraint import_files_hash_format check (content_sha256 ~ '^[0-9a-fA-F]{64}$'),
  constraint import_files_size_valid check (byte_size is null or byte_size >= 0),
  constraint import_files_job_hash_key unique (import_job_id, content_sha256)
);

create table catalog_staging.raw_records (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references catalog_staging.import_jobs(id) on delete cascade,
  import_file_id uuid references catalog_staging.import_files(id) on delete cascade,
  source_record_key text not null,
  page_number integer,
  row_number integer,
  raw_payload jsonb not null,
  raw_text text,
  parse_status text not null default 'parsed' check (parse_status in ('parsed', 'warning', 'error', 'ignored')),
  created_at timestamptz not null default now(),
  constraint raw_records_key_not_blank check (btrim(source_record_key) <> ''),
  constraint raw_records_page_positive check (page_number is null or page_number > 0),
  constraint raw_records_row_positive check (row_number is null or row_number > 0),
  constraint raw_records_job_key unique (import_job_id, source_record_key)
);

create index raw_records_import_file_idx on catalog_staging.raw_records(import_file_id);

create table catalog_staging.entity_candidates (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references catalog_staging.import_jobs(id) on delete cascade,
  raw_record_id uuid not null references catalog_staging.raw_records(id) on delete cascade,
  entity_type text not null check (
    entity_type in ('manufacturer', 'machine_type', 'model', 'variant', 'serial_range', 'system', 'subsystem',
                    'assembly', 'catalog_section', 'part', 'part_number', 'fitment', 'part_occurrence',
                    'part_relationship', 'taxonomy_alias', 'inventory_resolution')
  ),
  candidate_key text not null,
  canonical_payload jsonb not null,
  resolution_status text not null default 'unresolved' check (
    resolution_status in ('unresolved', 'matched', 'new', 'ambiguous', 'rejected', 'approved', 'promoted')
  ),
  resolved_catalog_id uuid,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_candidates_key_not_blank check (btrim(candidate_key) <> ''),
  constraint entity_candidates_record_key unique (raw_record_id, entity_type, candidate_key)
);

create index entity_candidates_job_status_idx
  on catalog_staging.entity_candidates(import_job_id, resolution_status);
create trigger entity_candidates_set_updated_at before update on catalog_staging.entity_candidates
for each row execute function catalog.set_updated_at();

create table catalog_staging.validation_issues (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references catalog_staging.import_jobs(id) on delete cascade,
  raw_record_id uuid references catalog_staging.raw_records(id) on delete cascade,
  entity_candidate_id uuid references catalog_staging.entity_candidates(id) on delete cascade,
  issue_code text not null,
  severity text not null check (severity in ('info', 'warning', 'error', 'blocking')),
  field_name text,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz not null default now(),
  constraint validation_issues_code_not_blank check (btrim(issue_code) <> ''),
  constraint validation_issues_message_not_blank check (btrim(message) <> '')
);

create index validation_issues_open_job_idx
  on catalog_staging.validation_issues(import_job_id, severity) where resolved_at is null;

create table catalog_staging.promotion_batches (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null unique references catalog_staging.import_jobs(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'running', 'completed', 'failed')),
  approved_by uuid,
  approved_at timestamptz,
  promoted_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger promotion_batches_set_updated_at before update on catalog_staging.promotion_batches
for each row execute function catalog.set_updated_at();

create or replace function catalog_staging.assert_job_promotable(job_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  job_status text;
begin
  select status into job_status
  from catalog_staging.import_jobs
  where id = job_id;

  if job_status is distinct from 'approved' then
    raise exception 'Import job % is not approved', job_id;
  end if;

  if exists (
    select 1 from catalog_staging.validation_issues
    where import_job_id = job_id
      and resolved_at is null
      and severity in ('error', 'blocking')
  ) then
    raise exception 'Import job % has unresolved error/blocking validation issues', job_id;
  end if;

  if exists (
    select 1 from catalog_staging.entity_candidates
    where import_job_id = job_id
      and resolution_status not in ('approved', 'rejected', 'promoted')
  ) then
    raise exception 'Import job % has unresolved candidates', job_id;
  end if;
end;
$$;

-- New catalog tables are read-only to browser roles. Importers write only to
-- catalog_staging; approved promotion is a separate server-side transaction.
revoke insert, update, delete, truncate, references, trigger on all tables in schema catalog from public;
revoke insert, update, delete, truncate, references, trigger on all tables in schema catalog from anon, authenticated;
revoke all on schema catalog_staging from public, anon, authenticated;

-- A Supabase service-role client may stage and inspect imports, but cannot
-- directly mutate approved catalog rows. Future promotion functions are
-- SECURITY DEFINER routines that call assert_job_promotable first.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant usage on schema catalog, catalog_staging to service_role';
    execute 'grant select on all tables in schema catalog to service_role';
    execute 'revoke insert, update, delete, truncate, references, trigger on all tables in schema catalog from service_role';
    execute 'grant select, insert, update on all tables in schema catalog_staging to service_role';
  end if;
end;
$$;

alter default privileges in schema catalog
  revoke insert, update, delete, truncate, references, trigger on tables from public;
alter default privileges in schema catalog
  revoke insert, update, delete, truncate, references, trigger on tables from anon, authenticated;
alter default privileges in schema catalog_staging
  revoke all on tables from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'alter default privileges in schema catalog revoke insert, update, delete, truncate, references, trigger on tables from service_role';
    execute 'alter default privileges in schema catalog_staging grant select, insert, update on tables to service_role';
  end if;
end;
$$;

commit;
