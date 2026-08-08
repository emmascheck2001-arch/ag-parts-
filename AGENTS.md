# EZPARTS Engineering Operating Standard

This file is the primary operating contract for every human or AI agent working
in this repository. Read it before inspecting, planning, editing, importing,
migrating, deploying, or testing EZPARTS.

The specialized standards are:

- [DATABASE_RULES.md](DATABASE_RULES.md) — schema, identity, integrity, migration,
  and data-lifecycle rules.
- [IMPORT_PIPELINE.md](IMPORT_PIPELINE.md) — source ingestion, staging,
  validation, review, promotion, and provenance.
- [SEARCH_ENGINE.md](SEARCH_ENGINE.md) — retrieval, normalization, ranking,
  fitment scoping, and search quality.
- [STYLE_GUIDE.md](STYLE_GUIDE.md) — product language, UI behavior, React/CSS
  conventions, accessibility, and visual standards.
- [ROADMAP.md](ROADMAP.md) — sequenced delivery plan and exit criteria.

If a specialized document conflicts with this file, stop and resolve the
conflict explicitly. Do not silently choose whichever rule is easier.

## 1. What EZPARTS is

EZPARTS is an agricultural equipment parts search and fitment platform. Its
core job is to help a farmer start from a known machine or part number and reach
the correct, evidence-backed part without mixing machines, assemblies,
categories, OEM identities, aftermarket identities, or serial-specific
applications.

The product is not merely a flat keyword catalog. Its durable value is the
structured relationship graph between:

```text
Manufacturer
→ Machine Type
→ Model
→ Model Variant / Serial Range
→ Major System
→ Subsystem
→ Assembly / Component Group
→ Individual Part
```

A canonical example path is:

```text
John Deere
→ Tractor
→ 5075E
→ applicable configuration or serial range, when supported by a source
→ Hydraulics
→ Hydraulic Pump System
→ Main Hydraulic Pump
→ verified part occurrences
```

This path is a structural example. It is not permission to invent a variant,
serial break, assembly membership, or OEM number.

## 2. Long-term vision

EZPARTS should become a manufacturer-neutral agricultural parts knowledge graph
that can support John Deere, Case IH, New Holland, AGCO, Kubota, Claas, MacDon,
Bourgault, and additional brands without changing the core schema per brand.

The system should eventually support:

- millions of master parts and part numbers;
- thousands of parts per machine;
- the same master part in many machines and many assemblies;
- model variants, configurations, markets, PIN prefixes, and serial ranges;
- OEM, aftermarket, supplier, and internal numbers without identity collisions;
- verified equivalents, replacements, and supersessions;
- diagram/page/figure provenance for every important catalog assertion;
- dealer inventory that remains separate from master catalog truth;
- fast part-number, natural-language, synonym, machine, and assembly search;
- mobile web, PWA, and iOS delivery from the same React application;
- a reviewable ingestion workflow where uncertain data never becomes trusted by
  accident.

## 3. Project goals

Prioritize these goals in order:

1. Correct identity: never merge entities only because their text looks alike.
2. Correct fitment: never claim a part fits a machine without traceable evidence.
3. Correct placement: preserve system, subsystem, assembly, and occurrence
   context instead of flattening it into a category or part name.
4. Traceability: retain source organization, document, page, figure, row, raw
   payload, confidence, and review status.
5. Safe ingestion: parse into staging, validate, review, then promote in one
   controlled transaction.
6. Useful search: exact numbers first, then verified aliases/equivalents, then
   names, taxonomy, synonyms, and fuzzy candidates.
7. Performance: query server-side and paginate; do not load the full catalog in
   a browser.
8. Honest UX: show uncertainty and source quality instead of promising certainty
   the data cannot support.

## 4. Repository reality

The repository is transitional. Agents must distinguish current behavior from
the target architecture.

### 4.1 Current application

- React 18 and Vite 4 provide the web application.
- `src/App.jsx` contains state-based screen routing rather than a routing library.
- `src/lib/db.js` is the active catalog query layer used by the main search,
  machine list, machine detail, and part detail screens.
- The active query layer still reads legacy `public.machines`, `public.parts`,
  `public.fitments`, and `public.crossrefs`.
- The main active UI currently describes itself as a parts and machine search
  engine and does not route the marketplace/checkout screens from `App.jsx`.
- Older demo, marketplace, inventory, checkout, and alternative API paths remain
  under `src/data`, `src/lib`, and `src/screens`. Their presence does not make
  them authoritative.
- Netlify Functions provide server-side Supabase, Anthropic, email, authentication,
  inventory, order, and Stripe operations.
- Capacitor 8 wraps the built Vite bundle as iOS app `com.ezparts.app` under
  `ios/App`.
- `public/sw.js` and `public/manifest.json` provide PWA support.

### 4.2 Current legacy data model

The deployed legacy catalog was designed around flat tables:

```text
public.machines
public.parts
public.fitments
public.crossrefs
public.ingestion_sources
public.search_misses
```

The flat model cannot represent the required assembly hierarchy. Historical
importers write directly to it and commonly use global `pn_norm`, uncontrolled
category text, direct machine-to-part fitments, and free-text serial notes.

Root SQL files such as `schema.sql`, `SUPABASE_SCHEMA.sql`,
`FITMENT_INDEX_SCHEMA.sql`, and `FITMENT_SETUP.sql` describe incompatible
generations of the database. They are historical references, not the future
migration authority.

### 4.3 Target normalized data model

The committed ordered migrations under `supabase/migrations` define two new
schemas:

- `catalog` — approved normalized master catalog;
- `catalog_staging` — raw and candidate import data awaiting validation.

They create normalized equipment, catalog hierarchy, master part, scoped number,
fitment, occurrence, relationship, taxonomy, source, provenance, staging, and
dealer inventory resolution tables.

These migrations are additive and do not drop legacy tables. Do not assume they
have been applied to any environment unless migration history and database
introspection prove it.

### 4.4 Data and backups

- `backups/` contains valuable historical snapshots. Treat every backup as
  immutable.
- `catalogs/` contains vendor documents, research JSON, diagram material, and
  rebuild artifacts. Most of it is intentionally ignored by Git.
- `catalogs/rebuild/` is a generated normalized candidate dataset. It is not
  production data and explicitly leaves assembly membership unresolved.
- Do not restore, transform, delete, overwrite, or promote the historical
  22,000-part backup unless the user explicitly authorizes that migration.

## 5. Database philosophy

1. Store identity separately from labels.
2. Use stable UUID primary keys in the normalized catalog.
3. A part name is descriptive text, never a deduplication key.
4. A raw part number is not globally unique.
5. Approved part-number identity is:

   ```text
   issuer manufacturer ID + normalized number
   ```

6. Keep the original number exactly as published and a deterministic normalized
   value for matching.
7. A master part exists once. `part_occurrences` place it in catalog sections
   and assemblies as many times as necessary.
8. Fitment and assembly occurrence are related but distinct facts. A part may fit
   a model variant without its exact assembly placement being resolved.
9. Dealer inventory is supply data, not master catalog truth.
10. Equivalence and supersession are explicit, directional relationships between
    resolved part-number IDs.
11. Raw source text, canonical text, confidence, and verification state must not
    be collapsed into one field.
12. Use foreign keys, checks, unique constraints, indexes, and restricted deletes
    to make invalid states difficult to create.

See `DATABASE_RULES.md` for the complete standard.

## 6. Agricultural parts hierarchy

The canonical browse hierarchy is mandatory:

```text
catalog.manufacturers
└── catalog.machine_models
    ├── catalog.machine_types
    └── catalog.model_variants
        ├── catalog.serial_ranges
        └── catalog.catalog_sections
            └── catalog.assemblies
                └── catalog.subsystems
                    └── catalog.systems
```

Parts attach through occurrences:

```text
catalog.catalog_sections
└── catalog.part_occurrences
    └── catalog.parts
        └── catalog.part_numbers
```

Rules:

- Do not put a category, system, subsystem, or assembly heading into a part name.
- Do not make every catalog heading a new global taxonomy node.
- Do not guess assembly membership from a part description alone.
- Do not combine several models in one model field when the source identifies
  separate models.
- Do not split a genuine model designation merely because it contains `/`, `-`,
  spaces, or punctuation.
- Use variants and serial ranges only when the source supports them.
- Keep machine-specific catalog navigation in `catalog_sections`; keep reusable
  controlled concepts in `systems`, `subsystems`, `assemblies`, and taxonomy.

## 7. Import rules

All new normalized-catalog ingestion follows:

```text
source
→ immutable file and raw records
→ parsed candidates
→ identifier resolution
→ taxonomy resolution
→ validation issues
→ human review where needed
→ approved promotion batch
→ transactional master-catalog writes
→ search-index refresh
```

Non-negotiable rules:

- New importers write to `catalog_staging`, never directly to `catalog`.
- AI extraction is evidence collection, not approval.
- Every raw record has a stable source record key.
- Every import file has a content hash.
- Rerunning the same source must be idempotent.
- Unknown or ambiguous values create validation issues; they do not create
  approved manufacturers, models, categories, assemblies, or relationships.
- Preserve source spelling even after canonical resolution.
- Promotion fails closed when blocking issues remain.
- Promotion is transactional and records counts and lineage.
- Existing direct-to-legacy scripts are historical/quarantined until refactored.
  Never point them at the normalized master schema.

See `IMPORT_PIPELINE.md`.

## 8. Search rules

Search must distinguish retrieval from ranking.

Retrieval sources, in priority order:

1. exact manufacturer-scoped normalized part number;
2. exact approved number alias or relationship target;
3. part-number prefix;
4. canonical part name and approved name aliases;
5. controlled system, subsystem, assembly, and taxonomy terms;
6. approved search synonyms and abbreviations;
7. fuzzy candidates, clearly marked and conservatively ranked.

Ranking must prefer exact identifiers and verified fitment/occurrence evidence.
Machine scope must be applied in the database query, not by fetching broad
results and filtering only in the browser.

Search must support common intent such as `hydraulic pump`, `hyd pump`, and an
OEM number without treating uncontrolled category text as catalog structure.

Never allow synonym expansion to manufacture fitment. See `SEARCH_ENGINE.md`.

## 9. Coding standards

- Use ES modules and functional React components in the current JavaScript code.
- Match the formatting of the file being edited; do not mechanically reformat
  unrelated code.
- Prefer small, single-purpose modules and pure normalization/ranking functions.
- Keep database access in `src/lib` or server-side functions, not inline across
  screen components.
- Keep secrets and service-role operations out of browser bundles.
- Do not add a second implementation when an active implementation can be safely
  extended. If replacing an obsolete path, remove or quarantine it in a separate,
  explicit cleanup task.
- Use descriptive domain names: `manufacturerId`, `modelVariantId`,
  `partNumberId`, `catalogSectionId`, `partOccurrenceId`.
- Avoid ambiguous names such as `type`, `group`, `item`, or `number` when the
  domain meaning is not obvious.
- Comments explain invariants and reasons, not line-by-line syntax.
- Do not mix unrelated product, marketplace, or payment changes into catalog work.

## 10. Database standards

- All future normalized schema changes are ordered files in
  `supabase/migrations`.
- Never add another root-level standalone schema file for new architecture.
- A committed migration is immutable after it has been applied anywhere shared.
  Corrections go in a later migration.
- Migrations must be transaction-wrapped when PostgreSQL permits it.
- Use schema-qualified table names.
- Name every important foreign key, unique constraint, check, and index clearly.
- Default catalog foreign keys to `ON DELETE RESTRICT`.
- Destructive operations require an explicit inventory of affected objects, a
  verified backup, dry-run evidence, rollback procedure, and fresh user approval.
- Do not use `CASCADE` against approved master catalog data without explicit,
  reviewed justification.
- Verify changes against PostgreSQL 15+ before production.

## 11. AI operating rules

Every AI agent must:

1. Inspect repository instructions and current status before acting.
2. Distinguish tracked, untracked, generated, ignored, and user-owned changes.
3. State whether it is describing current behavior or future architecture.
4. Cite actual repository files when making architectural claims.
5. Inspect the live schema read-only when live database behavior matters and
   access is authorized; do not infer deployment from SQL files.
6. Preserve raw source facts and uncertainty.
7. Use stable IDs whenever available instead of text matching.
8. Validate relevant builds, migrations, queries, and user flows.
9. Report what was not tested and why.
10. Keep changes within the user-authorized scope.

## 12. AI must never

- Invent OEM numbers, supersessions, machine specifications, serial ranges,
  assembly membership, quantities, or fitment.
- Claim that research or AI output is OEM-verified without an authoritative
  source and recorded provenance.
- Restore or migrate the historical backup without explicit authorization.
- Delete or overwrite backups.
- Drop, truncate, clear, or mass-update production tables without stopping for
  explicit approval.
- Run `load_machines_clean.mjs`, `keep15.mjs --write`, or any destructive legacy
  loader as routine setup.
- Use a part name, category label, make/model display string, or global normalized
  number as the sole identity when a scoped ID exists.
- Let an importer create approved taxonomy nodes from arbitrary incoming text.
- Treat an aftermarket equivalent as a supersession, or a supersession as a
  symmetric equivalent.
- Join dealer inventory directly to a master part by display text.
- Put a Supabase service-role key, Anthropic key, Stripe secret, or email key in
  client code, logs, documentation examples, commits, or screenshots.
- Silence a critical import, payment, authentication, or catalog-integrity error.
- Change UI, payments, authentication, or unrelated code during a database-only
  task.
- Commit unrelated user changes from a dirty worktree.

## 13. Migration workflow

1. Inspect current migration history and target database version.
2. Write an additive migration with a later timestamp.
3. Run `node scripts/catalog/validate-migrations.mjs`.
4. Run formatting/diff checks.
5. Execute against a disposable PostgreSQL 15+ database or Supabase development
   branch.
6. Inspect `pg_constraint`, indexes, privileges, and trigger behavior.
7. Test both forward execution and rollback/recovery procedure.
8. Apply to staging and validate representative data.
9. Obtain explicit production approval.
10. Apply once, record migration history, and never edit the applied file.

## 14. Testing rules

The repository currently has no configured unit, integration, or end-to-end test
runner. That is a known gap, not permission to skip verification.

Minimum validation by change type:

- Documentation: link/path review, terminology consistency, and `git diff --check`.
- React/UI: `npm run build`, responsive browser check, iOS-safe-area check, and
  the affected interaction path.
- iOS wrapper: `npm run build`, `npx cap sync ios`, Xcode simulator build, launch,
  and visual smoke test.
- Netlify Function: method validation, auth failure, malformed input, dependency
  failure, success, and idempotency.
- Migration: structural validator plus execution on PostgreSQL 15+; inspect all
  constraints and privileges.
- Importer: fixture-based dry run, duplicate rerun, ambiguous identity, invalid
  number, unresolved taxonomy, serial boundary, and promotion-blocking tests.
- Search: exact number, formatted number, abbreviation, typo, cross-reference,
  machine scope, serial scope, no-result, and deterministic ranking tests.

New critical domain logic should add automated tests rather than relying only on
manual inspection.

## 15. File organization

```text
src/
  components/        reusable presentational components
  screens/           screen-level React components
  lib/               data access and domain services
  data/              demo/fallback/static data only
netlify/functions/   server-only API boundaries and secrets
public/              shipped static assets, manifest, service worker
scripts/             controlled maintenance/import/build tooling
scripts/catalog/     normalized-catalog validation and tooling
supabase/migrations/ ordered normalized database migrations
catalogs/            ignored source/research/generated catalog material
backups/             immutable snapshots; never application input by default
ios/                 Capacitor/Xcode wrapper; generated web assets are ignored
```

Do not place new production data models in `src/data/demo.js`. Do not put new
schema definitions in the project root. Do not commit vendor PDFs unless their
license, size, and purpose have been reviewed.

## 16. Naming conventions

Database:

- schemas/tables/columns: `snake_case`;
- primary keys: `id` UUID unless a documented external/legacy bridge requires
  another type;
- foreign keys: `<entity>_id`;
- normalized fields: `normalized_<field>`;
- status fields: explicit checked vocabulary, never arbitrary text;
- booleans: `is_`, `has_`, or a clear predicate;
- timestamps: `<event>_at`, stored as `timestamptz`;
- natural source identity: `source_record_key`, never array position alone.

JavaScript/React:

- components/screens: `PascalCase`;
- functions/variables: `camelCase`;
- constants: `UPPER_SNAKE_CASE` when truly constant;
- domain IDs include the entity name;
- file names follow the existing directory convention unless a broader rename is
  separately approved.

## 17. Error handling

- Fail closed on catalog integrity, promotion, authentication, inventory writes,
  and payments.
- Return structured server errors with safe public messages and internal context.
- Never return service keys, raw provider responses containing secrets, or stack
  traces to clients.
- Do not use an empty array to make a critical database failure look like a valid
  empty catalog without also exposing an operational error state.
- Best-effort features such as recent searches may degrade quietly; core search
  and fitment must distinguish “no results” from “data source unavailable.”
- Import jobs retain row-level issues rather than aborting without a report.
- Log stable job/entity IDs, not sensitive payloads or user contact details.

## 18. Performance standards

- Never download the full parts or fitment catalog into the browser.
- Paginate server queries and use deterministic ordering.
- Avoid browser-side scans of hundreds of thousands of fitments to compute counts.
- Maintain indexes for every common foreign-key join and search key.
- Batch imports and promotions; avoid one HTTP request per row.
- Cache only data with a clear invalidation strategy.
- Keep initial mobile payloads small and lazy-load diagrams/images.
- Search latency targets should be measured. The initial target is a responsive
  first page under normal mobile conditions, not an unmeasured “fast enough.”
- Use query plans and representative volumes before claiming million-row scale.

## 19. Security standards

- Client code receives only public configuration such as Supabase anon and Stripe
  publishable keys.
- Service-role, Stripe secret, webhook secret, Anthropic, and email credentials
  remain server-side.
- Server functions authenticate the token and resolve dealer ownership on the
  server before inventory or order access.
- Do not trust dealer IDs, role names, prices, stock, or payout destinations sent
  by the browser.
- Validate method, content type, shape, size, ranges, and identifiers at every
  server boundary.
- Verify Stripe webhook signatures against the raw body.
- Approved catalog tables are not directly writable by browser or importer roles.
- Minimize public schema exposure and use least-privilege grants/RLS.
- Search-miss email and machine data are personal data; restrict access and define
  retention before scale.
- Do not fetch arbitrary user-provided URLs from privileged servers without SSRF
  controls.

## 20. Future roadmap

The future sequence is summarized here and governed in `ROADMAP.md`:

1. Validate normalized migrations on disposable PostgreSQL/Supabase development.
2. Apply the normalized schemas alongside legacy production tables.
3. Add automated schema, importer, search, and UI tests.
4. Replace direct-to-master importers with staging adapters and promotion logic.
5. Load a small, source-backed pilot catalog without restoring the legacy backup.
6. Build normalized read APIs and search indexes.
7. Add the full hierarchy navigation to the UI.
8. Resolve dealer inventory to approved `part_number_id` values.
9. Reconcile and migrate useful historical catalog data only after explicit
   authorization and evidence review.
10. Retire legacy paths only after measured parity and a reversible cutover.

## 21. Definition of done

A task is done only when:

- the requested outcome is implemented within scope;
- current and future architecture are not accidentally mixed;
- relevant invariants and security boundaries are preserved;
- tests/validation have run and results are reported;
- no unrelated user changes or backups were modified;
- migrations/imports are traceable and reversible where applicable;
- documentation is updated when a permanent standard or architecture changes;
- remaining limitations are stated plainly.
