# Catalog drop folder

Drop parts-catalog files here, then run the batch ingester to fill the fitment
index:

```
node scripts/ingest-catalogs.mjs            # ingest everything in this folder
node scripts/ingest-catalogs.mjs --dry-run  # preview extraction, write nothing
node scripts/ingest-catalogs.mjs --limit 1  # just the first file (test run)
```

Supported: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`

## What to put here (highest leverage first)

Aftermarket **application guides** and **cross-reference catalogs** — one file
maps thousands of machine→part relationships:

- Donaldson — Agriculture application guide / cross-reference
- Baldwin Filters — application catalog
- WIX / Fleetguard / Fram / MANN — ag application listings

These are free PDFs from each manufacturer's site. Each ingested row lands as
`verified=false, confidence=0.7` so you can review AI-extracted data in Supabase
before trusting it.

(Files in this folder are gitignored — don't commit large vendor PDFs.)
