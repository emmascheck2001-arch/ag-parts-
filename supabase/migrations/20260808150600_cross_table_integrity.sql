begin;

create or replace function catalog.validate_serial_range_variant()
returns trigger
language plpgsql
as $$
declare
  expected_variant_id uuid;
  actual_variant_id uuid;
begin
  if new.serial_range_id is null then
    return new;
  end if;

  select model_variant_id into actual_variant_id
  from catalog.serial_ranges
  where id = new.serial_range_id;

  if tg_table_name = 'fitments' then
    expected_variant_id := new.model_variant_id;
  elsif tg_table_name = 'part_occurrences' then
    select model_variant_id into expected_variant_id
    from catalog.catalog_sections
    where id = new.catalog_section_id;
  else
    raise exception 'Unexpected table % for serial-range validation', tg_table_name;
  end if;

  if actual_variant_id is distinct from expected_variant_id then
    raise exception 'Serial range % belongs to variant %, expected %',
      new.serial_range_id, actual_variant_id, expected_variant_id;
  end if;

  return new;
end;
$$;

create constraint trigger fitments_serial_range_variant_check
after insert or update on catalog.fitments
deferrable initially immediate
for each row execute function catalog.validate_serial_range_variant();

create constraint trigger part_occurrences_serial_range_variant_check
after insert or update on catalog.part_occurrences
deferrable initially immediate
for each row execute function catalog.validate_serial_range_variant();

create or replace function catalog.validate_catalog_section_parent()
returns trigger
language plpgsql
as $$
declare
  parent_variant_id uuid;
  parent_document_id uuid;
begin
  if new.parent_section_id is null then
    return new;
  end if;

  select model_variant_id, source_document_id
    into parent_variant_id, parent_document_id
  from catalog.catalog_sections
  where id = new.parent_section_id;

  if parent_variant_id is distinct from new.model_variant_id or
     parent_document_id is distinct from new.source_document_id then
    raise exception 'Catalog section parent must use the same model variant and source document';
  end if;

  return new;
end;
$$;

create constraint trigger catalog_sections_parent_scope_check
after insert or update
on catalog.catalog_sections
deferrable initially immediate
for each row execute function catalog.validate_catalog_section_parent();

create or replace function catalog.validate_occurrence_section()
returns trigger
language plpgsql
as $$
declare
  section_assembly_id uuid;
begin
  select assembly_id into section_assembly_id
  from catalog.catalog_sections
  where id = new.catalog_section_id;

  if section_assembly_id is null and new.occurrence_status = 'verified' then
    raise exception 'Verified part occurrence % requires a catalog section mapped to an assembly', new.id;
  end if;

  return new;
end;
$$;

create constraint trigger part_occurrences_verified_assembly_check
after insert or update on catalog.part_occurrences
deferrable initially immediate
for each row execute function catalog.validate_occurrence_section();

commit;
