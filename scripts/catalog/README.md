# Catalog engineering scripts

These scripts support the normalized `catalog` and `catalog_staging` schemas.
They do not replace the ordered migrations in `supabase/migrations`.

## Structural migration validation

```sh
node scripts/catalog/validate-migrations.mjs
```

This checks migration ordering and static safety properties. PostgreSQL-engine
execution is still required before deployment.

## Research candidate staging

Validate the pure transformation without a database write:

```sh
node scripts/catalog/test-research-staging.mjs
node scripts/catalog/stage-research-dataset.mjs \
  --dry-run \
  --report catalogs/rebuild/staging-report.json
```

Write to an explicitly selected local database after the ordered migrations have
been applied:

```sh
EZPARTS_STAGING_DATABASE_URL=postgresql://127.0.0.1:55439/ezparts_catalog_staging_20260808 \
EZPARTS_PSQL_BIN=/opt/homebrew/opt/postgresql@15/bin/psql \
node scripts/catalog/stage-research-dataset.mjs \
  --report catalogs/rebuild/staging-report.json
```

Safety behavior:

- non-local hosts are refused unless `--allow-remote` is explicitly supplied;
- all database writes target `catalog_staging`;
- the job ends as `needs_review`;
- no promotion batch or part occurrence is created;
- exact source file, row, content hash, and all corroborating files are retained;
- research compilation is explicitly marked non-authoritative;
- stable job, file, raw-record, candidate, and issue UUIDs make identical reruns
  idempotent;
- post-write database assertions fail the command if counts or safety invariants
  differ.

`--allow-remote` is not production approval. Before using it, follow
`IMPORT_PIPELINE.md`, name the target environment, verify credentials are
staging-only, run dry mode, and obtain explicit authorization.

## Three-machine source-backed pilot

Build and validate the normalized Hagie 2100, MacDon D60, and MacDon FD70
read-only snapshot from the pinned manuals:

```sh
python3 scripts/catalog/build_three_machine_pilot.py
python3 scripts/catalog/test_three_machine_pilot.py
```

The build uses stable UUIDv5 identities, renders the referenced catalog pages,
and retains record-level document provenance. It does not read, restore,
promote, or modify the 22,000-part backup. Sync the same successful web build to
Xcode with:

```sh
npm run build
npx cap sync ios
```
