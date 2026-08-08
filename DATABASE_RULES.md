# EZPARTS Database Rules

This document defines the permanent database standard for EZPARTS. It should be
read with `AGENTS.md` and `IMPORT_PIPELINE.md`.

## 1. Current state versus target state

### Current legacy implementation

The active application currently queries flat tables in `public` through
`src/lib/db.js`:

```text
public.machines
public.parts
public.fitments
public.crossrefs
```

Supply and operations use additional public tables, including:

```text
public.dealers
public.inventory
public.orders
public.profiles
public.search_misses
public.ingestion_sources
```

The exact live state must be inspected before operational work. Root SQL files
represent multiple incompatible historical schemas and do not prove what is
deployed.

Known legacy limitations:

- machines combine make, model, type, years, and presentation into one row;
- parts combine master identity, number, name, category, brand, and OEM flag;
- `pn_norm` is globally unique rather than issuer-scoped;
- fitment links a part directly to a machine without variant or assembly;
- serial ranges are often stored only as free text;
- cross-references contain unresolved number text rather than two resolved IDs;
- inventory joins catalog data by `pn_norm` text;
- uncontrolled category values are written by different importers;
- multiple setup SQL files and direct loaders bypass ordered migration control.

### Recommended normalized implementation

The migration authority is `supabase/migrations`, which defines:

- `catalog` for approved master data;
- `catalog_staging` for unvalidated imports.

The migrations are designed to coexist with `public`; they do not authorize
legacy table deletion or backup restoration.

## 2. Schema ownership

### `catalog`

Contains approved identities and relationships only. A row is not approved merely
because an extractor produced it or a script inserted it.

### `catalog_staging`

Contains import jobs, immutable raw records, canonical candidates, validation
issues, and promotion state. Ambiguous and rejected data can remain here without
contaminating master truth.

### `public`

Currently contains legacy catalog, inventory, dealer, auth-adjacent, order, and
search-demand tables. Treat these as compatibility surfaces until a separately
approved cutover.

## 3. Canonical equipment model

```text
manufacturers
├── manufacturer_aliases
└── machine_models
    ├── machine_types
    └── model_variants
        └── serial_ranges
```

Rules:

- `manufacturers.id` is the machine/part issuer identity; display names may change.
- Manufacturer aliases are source-scoped and approved. An ambiguous alias remains
  a staging issue.
- A model is unique by manufacturer, machine type, and normalized model code.
- A model variant represents a real configuration/market/version distinction or a
  documented default placeholder. It must not be generated from arbitrary wording.
- Only one default variant is allowed per model.
- Serial ranges belong to exactly one variant.
- An all-serial range cannot also contain serial bounds.
- Store exact serial text and optional numeric bounds. Do not coerce alphanumeric
  PINs into lossy integers.
- Cross-table triggers must reject a fitment or occurrence that uses a serial
  range from another variant.

## 4. Canonical catalog hierarchy

```text
systems
└── subsystems
    └── assemblies

model_variants
└── catalog_sections
    ├── parent catalog section
    ├── source document
    └── mapped assembly
```

Distinguish reusable classification from source navigation:

- `systems`, `subsystems`, and `assemblies` are controlled EZPARTS concepts.
- `catalog_sections` preserve the structure/order of a particular source catalog
  for a particular model variant.
- A catalog section can be a parent heading and temporarily have no assembly.
- A verified `part_occurrence` must use a section mapped to an assembly.
- Parent/child catalog sections must use the same variant and source document.

## 5. Master parts and part numbers

### Master part

`catalog.parts` describes the underlying item. It does not own a machine,
assembly, dealer, or single display number.

Required principles:

- UUID primary key;
- canonical name and optional description;
- controlled `part_kind` and lifecycle status;
- no uniqueness constraint on part name;
- no implicit OEM status on the master part.

### Part number

`catalog.part_numbers` represents a number issued by a manufacturer/supplier
identity and resolves to a master part.

Identity:

```text
unique(issuer_manufacturer_id, normalized_number)
```

Rules:

- preserve `number` exactly as sourced;
- generate `normalized_number` deterministically;
- never use normalized number alone as global identity;
- `number_type` is one of `oem`, `aftermarket`, `supplier`, or `internal`;
- one issuer may have one primary number for a given part;
- formatting variants become aliases/source evidence, not duplicate master rows;
- if normalization causes a collision between genuinely different numbers for the
  same issuer, stop and revise normalization/identity handling. Do not append an
  invented suffix such as `~OTHER`.

Current migration normalization uppercases and removes non-alphanumeric
characters. Any future change requires a collision analysis and new migration;
never silently recompute an applied identity key.

## 6. Fitments and occurrences

### Fitment

`catalog.fitments` answers whether a master part is applicable to a model variant
and optional serial range.

Identity includes:

```text
part_id + model_variant_id + serial_range_id + applicability_type
```

Fitment does not prove where the part appears in a machine.

### Part occurrence

`catalog.part_occurrences` answers where and how the part appears in a specific
catalog section/assembly.

It contains:

- `catalog_section_id`;
- `part_id`;
- optional `serial_range_id`;
- stable `occurrence_key`;
- illustration reference;
- position/name from the source;
- quantity;
- verification status;
- notes.

The same `part_id` may have unlimited occurrences across sections, assemblies,
variants, and models. This is the required representation for reused bolts,
bearings, seals, filters, pumps, kits, and other components.

Do not add `assembly_id` directly to the master part.

## 7. Part relationships

`catalog.part_number_relationships` connects two resolved part-number IDs.

Supported meanings include:

- `equivalent_to`;
- `supersedes` / `superseded_by`;
- `replaces` / `replaced_by`;
- `remanufactured_for`.

Rules:

- relationships are explicit and directional;
- self-relationships are forbidden;
- one relationship tuple is unique;
- equivalence is not automatically transitive;
- supersession is never assumed symmetric;
- comma/slash-separated input becomes individual candidates;
- both endpoints must resolve before promotion;
- record status, effective dates, notes, source, confidence, reviewer, and time;
- an unresolved string is not a relationship.

## 8. Controlled taxonomy

Taxonomy is separate from equipment hierarchy and source catalog sections.

```text
taxonomy_nodes
├── parent node
└── taxonomy_aliases

parts
└── part_taxonomy_assignments
```

Rules:

- canonical nodes are centrally governed;
- aliases map source-scoped messy text to one approved node;
- imports may propose aliases but cannot silently create approved nodes;
- ambiguous terms require context or human review;
- only one verified primary taxonomy assignment is allowed per part;
- taxonomy is for classification/search, not proof of assembly placement;
- categories such as `Hydraulic`, `Hydraulics`, `Hose`, `Fittings`, `Valve`, and
  `Pumps` must map through controlled rules rather than proliferate as peers.

## 9. Provenance

Approved catalog assertions trace through:

```text
source_organizations
→ source_documents
→ source_locations
```

Source locations may identify page, figure, section heading, source record key,
and raw payload.

Provenance junctions:

- `part_sources`;
- `part_number_sources`;
- `fitment_sources`;
- `occurrence_sources`;
- `relationship_sources`.

Rules:

- hash source documents when content is available;
- keep publication/revision identifiers separately;
- a URL alone is insufficient provenance;
- do not overwrite one source assertion with another;
- confidence is bounded from 0 to 1 and does not replace verification status;
- `verified_at` without a reviewer/source is not meaningful;
- authoritative source level must be defined by policy, not inferred from a URL
  domain or AI statement.

## 10. Dealer inventory

Dealer inventory is operational supply data and remains separate from master
catalog identity.

Current legacy link:

```text
public.inventory.pn_norm
```

Target bridge:

```text
public.inventory.id
→ catalog.dealer_inventory_resolutions.inventory_id
→ catalog.part_numbers.id
→ catalog.parts.id
```

Rules:

- do not alter a dealer listing merely to match catalog wording;
- preserve dealer SKU, original number, description, price, stock, condition,
  location, and update time as supply facts;
- a resolution is candidate/verified/rejected/stale and records method/confidence;
- ambiguous number matches remain unresolved;
- exact normalized number is not enough unless the issuer is also resolved;
- master catalog deletion must be restricted while inventory resolutions exist;
- future normalized inventory should reference `part_number_id`, not `part_id`,
  because a dealer sells under a specific number identity.

## 11. Constraints and deletion behavior

- Approved catalog foreign keys default to `ON DELETE RESTRICT`.
- Staging job children may use `ON DELETE CASCADE` because they are a contained,
  unapproved workspace.
- Use `UNIQUE NULLS NOT DISTINCT` where null represents a single meaningful
  identity state, such as all-serial fitment.
- Use partial unique indexes for “only one active/default/primary” invariants.
- Add checks for nonblank identifiers, allowed status values, confidence ranges,
  positive quantities, valid date/year ranges, and no self-parenting.
- Cross-table invariants that cannot be expressed by foreign keys belong in
  constraint triggers with automated tests.
- Never weaken constraints simply to make an import pass. Fix or quarantine the
  data.

## 12. Indexing and query design

At minimum index:

- every high-volume foreign key used from the parent side;
- normalized manufacturer/model/part-number lookup keys;
- catalog section by variant, parent, and assembly;
- occurrence by part, section, and serial range;
- fitment by part and variant;
- relationship reverse endpoint;
- taxonomy parent and aliases;
- open validation issues by job/severity;
- importer candidates by job/status;
- dealer resolution by `part_number_id`.

Before adding a speculative index:

1. identify the query;
2. capture representative `EXPLAIN (ANALYZE, BUFFERS)`;
3. confirm selectivity and write/storage cost;
4. measure again.

Do not compute machine part counts by downloading all fitments to the client.

## 13. Status and verification vocabulary

Status values are controlled schema contracts. Do not invent a new string in
application code without a migration and behavior review.

Keep these concepts separate:

- parsing success;
- candidate resolution;
- validation severity;
- review/verification state;
- lifecycle state;
- import job state;
- promotion state.

“AI extracted,” “researched,” “source verified,” and “OEM verified” are not
interchangeable.

## 14. Migrations

### Authority

All future normalized changes live in `supabase/migrations` with monotonically
ordered timestamp names:

```text
YYYYMMDDHHMMSS_short_description.sql
```

### Rules

1. Inspect applied migration history before creating a file.
2. Use schema-qualified names.
3. Wrap in `BEGIN`/`COMMIT` when supported.
4. Prefer additive changes and compatibility views during transition.
5. Never edit an applied shared migration.
6. Do not use a root SQL setup file as a migration.
7. Validate on PostgreSQL 15+.
8. Check locks and table-rewrite behavior on populated tables.
9. Separate schema deployment from data backfill.
10. Separate backfill from application cutover.
11. Separate cutover from legacy deletion.
12. Stop before any destructive production operation.

### Required validation

Run:

```sh
node scripts/catalog/validate-migrations.mjs
git diff --check
```

Then execute migrations on a disposable database/development branch and inspect:

- tables and columns;
- primary/foreign/unique/check constraints;
- triggers;
- indexes;
- grants/default privileges;
- RLS/schema exposure;
- repeated application behavior where intended;
- representative invalid inserts;
- transaction rollback.

The structural Node validator is necessary but not a substitute for PostgreSQL
execution.

## 15. Security and access

- Browser roles receive no write access to approved `catalog` tables.
- Import service credentials may write staging and read approved catalog data,
  but not mutate approved master rows directly.
- Promotion uses reviewed server-side transactions/functions with least privilege.
- Service-role keys never appear in `VITE_` variables or browser code.
- Public read exposure should use intentional views/RPCs rather than exposing
  every normalized table automatically.
- Personal data in search leads and order records stays outside public catalog
  access.
- RLS and grants must be tested as `anon`, `authenticated`, importer, promoter,
  dealer, and service roles—not only as database owner.

## 16. Legacy transition

Until cutover:

- do not rename or drop legacy production tables;
- do not make the normalized app read path depend on partially migrated data;
- do not dual-write without an idempotent reconciliation design;
- do not restore the 22,000-part backup;
- inventory/order/payment behavior remains operationally separate;
- use compatibility views or an explicit read adapter for controlled rollout;
- compare row counts, identifier collisions, sample machines, search outcomes,
  occurrence counts, and provenance coverage before switching traffic;
- retain rollback to the legacy read path until normalized parity is proven.
