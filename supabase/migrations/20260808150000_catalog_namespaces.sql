begin;

create extension if not exists pgcrypto;

create schema if not exists catalog;
create schema if not exists catalog_staging;

comment on schema catalog is
  'Approved, normalized EZPARTS master catalog. Legacy public tables remain unchanged.';
comment on schema catalog_staging is
  'Unvalidated import records. Data must be reviewed before promotion into catalog.';

create or replace function catalog.normalize_identifier(value text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select upper(regexp_replace(trim(value), '[^[:alnum:]]+', '', 'g'));
$$;

create or replace function catalog.normalize_label(value text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select lower(trim(regexp_replace(value, '[^[:alnum:]]+', ' ', 'g')));
$$;

create or replace function catalog.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

commit;
