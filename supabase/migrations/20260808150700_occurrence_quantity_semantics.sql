begin;

-- OEM catalogs do not always express quantity as one positive number. They can
-- use values such as A/R (as required), REF, OPT, or multiple kit columns.
-- Keep the numeric column for computable quantities and preserve the source
-- notation alongside it without inventing a value.
alter table catalog.part_occurrences
  alter column quantity drop not null,
  alter column quantity drop default,
  add column quantity_text text;

alter table catalog.part_occurrences
  drop constraint part_occurrences_quantity_positive,
  add constraint part_occurrences_quantity_positive
    check (quantity is null or quantity > 0),
  add constraint part_occurrences_quantity_present
    check (quantity is not null or nullif(btrim(quantity_text), '') is not null);

comment on column catalog.part_occurrences.quantity is
  'Parsed positive numeric quantity when the source provides one unambiguous value.';

comment on column catalog.part_occurrences.quantity_text is
  'Exact source notation for non-numeric or multi-column quantities such as A/R, REF, OPT, or kit-specific values.';

commit;
