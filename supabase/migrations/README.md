# EZPARTS normalized catalog migrations

These migrations create the approved catalog in the `catalog` schema and the
unvalidated import pipeline in `catalog_staging`. They are additive: the legacy
tables in `public` are not renamed, altered, dropped, or populated.

Apply files strictly in filename order. Do not run an importer against
`catalog.*`; importers first write immutable source rows and candidates into
`catalog_staging.*`. A job is promotable only after it is approved, contains no
open error/blocking issues, and every candidate is approved, rejected, or
already promoted.

`catalog.dealer_inventory_resolutions` is an additive bridge from the existing
`public.inventory.id` to `catalog.part_numbers.id`. It does not change dealer
inventory or the current application.

Run the non-database structural safety check with:

```sh
node scripts/catalog/validate-migrations.mjs
```

Before production application, also execute the migrations against an empty
PostgreSQL 15+ validation database and inspect `pg_constraint`. Production
application is intentionally not part of this change.
