# EZPARTS Import Pipeline

This is the mandatory ingestion standard for all future catalog sources: OEM
catalogs, aftermarket application guides, spreadsheets, APIs, scanned manuals,
diagrams, dealer submissions, and curated research.

## 1. Current implementation

The repository contains many historical direct loaders under `scripts/` and a
Netlify extraction/save flow:

- `scripts/ingest-catalogs.mjs`;
- `netlify/functions/extract-fitment.js`;
- `netlify/functions/save-fitment.js`;
- `scripts/import_spreadsheet.py`;
- manufacturer/manual-specific `load_*.py` scripts;
- OCR/vision scripts;
- `netlify/functions/save-inventory.js`.

These paths commonly upsert directly into legacy `public.parts`,
`public.machines`, `public.fitments`, `public.crossrefs`, and `public.inventory`.
They normalize globally, derive category with separate keyword sets, and often
discard source section/assembly context.

They are historical utilities, not the approved normalized pipeline. Do not run
them against `catalog` and do not copy their direct-upsert pattern.

`scripts/build_rebuild_dataset.mjs` is safer because it writes generated JSON
only and explicitly marks assembly status unresolved. Its output remains
candidate data and does not bypass staging/review. It is not load-ready for the
normalized schema: the current generator emits values such as `OEM`,
`equivalent`, and `researched`, while the migrations require controlled values
such as `oem`, `equivalent_to`, and one of the accepted verification statuses.
Its taxonomy records also use a source-level `level` vocabulary rather than the
schema's `node_type` vocabulary, and its README describes `number_type` as part
of number identity even though the database uniqueness key is issuer plus
normalized number. A versioned adapter and validation pass must reconcile these
differences before any generated record enters staging, much less promotion.

The approved adapter for this specific research compilation is
`scripts/catalog/stage-research-dataset.mjs`. It reads the aggregate research
rows, resolves each one back to its deep/pilot file and row, converts values to
the staging candidate vocabulary, records issues, and writes only to
`catalog_staging`. Its pure transformation tests are in
`scripts/catalog/test-research-staging.mjs`. This adapter does not establish OEM
verification, create occurrences, approve candidates, or promote catalog data.
See `scripts/catalog/README.md` for safe usage.

The official-manual pilot uses
`scripts/catalog/build_degelman_pro_till_staging.py` and the generic
`scripts/catalog/stage-manual-bundle.mjs` loader. It verifies the pinned source
hash, preserves PDF-page and bounding-box provenance, and emits distinct model
variants and part occurrences. The generated bundle in
`data/catalog-staging/` is review evidence, not an approved catalog snapshot.
The loader writes only to `catalog_staging`, ends at `needs_review`, and refuses
bundles containing blocking issues, pre-approved candidates, resolved catalog
IDs, or promotion batches.

## 2. Pipeline architecture

```text
Acquire source
→ Register import job
→ Store immutable file metadata/hash
→ Extract raw source records
→ Build canonical candidates
→ Resolve controlled identities
→ Validate
→ Review ambiguity
→ Approve job and candidates
→ Transactionally promote
→ Attach provenance
→ Reconcile counts
→ Refresh search indexes
```

No step may skip directly from extraction to approved master tables.

## 3. Import job lifecycle

Use the states defined in `catalog_staging.import_jobs`:

```text
received
→ parsing
→ parsed
→ validating
→ needs_review
→ approved
→ promoting
→ promoted
```

Terminal alternatives:

```text
rejected
failed
```

Rules:

- job status transitions are server-controlled and logged;
- `approved` requires no unresolved blocking/error issues;
- `promoting` is entered within or immediately before a guarded transaction;
- `promoted` records counts, duration, and catalog IDs;
- a failed promotion leaves the catalog unchanged and preserves staging evidence;
- a corrected source creates a new job/file version; it does not rewrite history.

## 4. Source registration

### Source organization

Resolve or propose the organization that issued/published the data. Do not infer
that machine manufacturer, part-number issuer, seller, publisher, and file host
are the same entity.

### Source document

Capture when available:

- organization;
- document type;
- title;
- document/form number;
- revision;
- publication date;
- canonical URL;
- SHA-256 content hash.

### Import file

Capture:

- original file name;
- MIME/media type;
- immutable storage URI;
- content hash;
- byte size;
- import job ID.

Do not store source secrets or temporary signed URLs as permanent catalog fields.

## 5. Raw records

Every extracted unit goes into `catalog_staging.raw_records` before canonical
interpretation.

A raw record must include:

- stable `source_record_key`;
- job and file IDs;
- page and/or row where available;
- raw JSON payload;
- original text when useful;
- parse status.

The key must remain stable across reruns of identical content. Good inputs include
document hash + page + figure + callout/row key. Array index alone is insufficient
when parser ordering can change.

Never “clean” the only copy of a raw value.

## 6. Canonical candidate contract

Candidates belong in `catalog_staging.entity_candidates`. Each candidate has:

- entity type;
- stable candidate key;
- canonical payload;
- resolution status;
- optional resolved catalog UUID;
- confidence;
- originating raw record.

Allowed entity types are defined by the migration and include manufacturer,
machine type, model, variant, serial range, system, subsystem, assembly, catalog
section, part, part number, fitment, occurrence, relationship, taxonomy alias,
and inventory resolution.

Do not put unrelated entity types into one candidate payload.

## 7. Normalization

### Labels

Canonical label matching may lowercase, trim, collapse punctuation/whitespace, and
apply an approved alias. Preserve the raw label separately.

### Part numbers

Preserve the exact published number. The normalized lookup form currently:

- trims;
- uppercases;
- removes non-alphanumeric separators.

Identity still requires issuer manufacturer ID. If issuer is unresolved, the
part number is unresolved.

### Manufacturer/model

- Resolve manufacturer aliases through approved mappings.
- Resolve models within manufacturer and machine type.
- Do not strip meaningful model punctuation without collision analysis.
- Do not split a model on `/`, comma, or hyphen unless the source explicitly lists
  distinct models and the parser can prove the split.
- Do not infer machine type from a number pattern when authoritative metadata is
  available.

### Serial/PIN

- Preserve exact note and prefix.
- Parse lower/upper bounds only when unambiguous.
- Record inclusive/exclusive semantics if the source distinguishes them; extend
  schema through migration rather than hiding semantics in parser code.
- Reject reversed numeric bounds.
- Do not apply a serial range to another variant.

## 8. Entity resolution

Resolution order:

1. exact stable external/source ID when trusted;
2. exact approved scoped identity;
3. approved alias;
4. deterministic candidate match with no ambiguity;
5. human review;
6. create a new approved entity only after review.

Part resolution:

```text
issuer manufacturer + normalized number
→ existing part_number_id
→ existing part_id
```

Never merge master parts by similar name alone. Name, dimensions, assembly,
fitment overlap, and description can raise a duplicate candidate, not authorize
an automatic merge.

## 9. Taxonomy mapping

Incoming `category`, `group`, `section`, `assembly`, and `type` are not synonyms.
Store them in their appropriate raw/candidate fields.

Mapping order:

1. approved source-specific taxonomy alias;
2. approved global alias;
3. context-aware deterministic rule;
4. proposed alias with confidence;
5. human review.

Examples of normalization targets may include mapping raw variations such as
`Hyd`, `Hydraulic`, and `Hydraulics` to an approved Hydraulics concept. That
mapping does not prove a specific subsystem or assembly.

Importers cannot create approved taxonomy nodes automatically. `Uncategorized`
is a temporary review state, not a permanent dumping ground.

## 10. Catalog section and assembly extraction

Preserve:

- section hierarchy;
- page/figure;
- assembly title/code;
- callout/reference number;
- quantity;
- position text;
- serial/option notes.

If the parser cannot prove an assembly mapping:

- create an unresolved section/assembly candidate;
- keep the fitment candidate separate;
- do not guess from part name;
- do not promote the occurrence as verified.

The same part number repeated in several figures creates several occurrence
candidates pointing to the same resolved master part.

## 11. Relationships

For OEM/aftermarket/supersession input:

1. split lists only with source-aware delimiters;
2. preserve each raw token;
3. resolve issuer and normalized number for both endpoints;
4. classify the relationship type explicitly;
5. attach source location and confidence;
6. require review for ambiguous direction or meaning.

Words such as `cross`, `interchange`, `replaces`, `supersedes`, `superseded by`,
and `OEM #` must not all map to the same relationship type.

## 12. Validation rules

Every importer must check at least:

### File/job

- supported type and safe size;
- content hash duplicate;
- parser version recorded;
- nonempty result where content is expected.

### Manufacturer/equipment

- manufacturer resolved;
- machine type resolved;
- model code present and scoped;
- variant resolved or explicitly provisional;
- serial range consistent with variant.

### Part/number

- exact raw number present;
- normalized number nonblank;
- issuer resolved;
- no scoped collision;
- canonical part resolved or candidate created;
- number type valid.

### Structure

- section source key unique;
- parent section in same variant/document;
- verified occurrence maps to an assembly;
- occurrence key unique within section;
- quantity positive;
- repeated parts preserved as occurrences.

### Relationships

- both endpoints resolved;
- no self-link;
- direction and type valid;
- source evidence present.

### Provenance

- source document/location present for promoted numbers, fitments, occurrences,
  and relationships;
- confidence within 0–1;
- verification status consistent with evidence.

## 13. Validation issues

Use stable `issue_code` values, for example:

```text
UNKNOWN_MANUFACTURER
AMBIGUOUS_MANUFACTURER_ALIAS
UNKNOWN_MACHINE_TYPE
AMBIGUOUS_MODEL
INVALID_SERIAL_RANGE
MISSING_PART_NUMBER
UNKNOWN_PART_NUMBER_ISSUER
SCOPED_PART_NUMBER_COLLISION
UNRESOLVED_TAXONOMY
UNRESOLVED_ASSEMBLY
DUPLICATE_SOURCE_RECORD
UNRESOLVED_RELATIONSHIP_ENDPOINT
RELATIONSHIP_TYPE_AMBIGUOUS
MISSING_PROVENANCE
```

Severity:

- `info` — useful observation;
- `warning` — review recommended, not necessarily unsafe;
- `error` — invalid candidate, promotion blocked until resolved/rejected;
- `blocking` — job-level safety/integrity problem.

Do not resolve an issue merely by lowering severity.

## 14. Human review

Review screens/tools should show:

- raw record beside canonical candidate;
- source page/figure preview;
- proposed and existing identity;
- normalization result;
- taxonomy/assembly path;
- fitment/serial scope;
- relationship direction;
- confidence and issue history;
- approve, reject, correct, or defer actions.

Reviewer edits create explicit reviewed candidate values and an audit trail; they
must not mutate the raw record.

## 15. Promotion

Before promotion, call `catalog_staging.assert_job_promotable(job_id)` or the
equivalent guarded server routine.

Promotion must:

1. lock/claim the approved batch;
2. rerun critical validation under transaction isolation;
3. upsert only by approved stable identities;
4. create parent entities before children;
5. attach all provenance junctions;
6. record candidate-to-catalog IDs;
7. mark candidates and batch promoted;
8. record inserted/matched/rejected counts;
9. commit once;
10. refresh search artifacts after commit.

It must not:

- update a canonical name with lower-quality source wording by default;
- convert unresolved candidates into new entities automatically;
- overwrite a verified relationship with an unverified candidate;
- write inventory into master parts;
- partially publish a failed job.

## 16. Idempotency and reruns

Idempotency keys exist at several levels:

- file content hash;
- raw source record key;
- candidate key by raw record/entity type;
- manufacturer/model/variant scoped identities;
- manufacturer-scoped part number;
- catalog section source key;
- part occurrence source key;
- fitment identity;
- relationship tuple;
- provenance composite primary keys.

Tests must run the same fixture twice and prove no duplicate approved rows or
occurrences are created.

## 17. Inventory imports

Dealer inventory ingestion is a separate pipeline. It may reuse source/job/raw
infrastructure but produces inventory and resolution candidates, not master
catalog assertions.

- Preserve dealer-provided SKU/number/name.
- Resolve issuer and `part_number_id` independently.
- Unknown inventory remains sellable only according to product policy, but must
  not create a verified master part automatically.
- Price and stock never become part attributes.
- A later catalog supersession does not silently rewrite a dealer SKU.

## 18. Importer implementation standard

Each adapter should expose pure phases:

```text
readSource
extractRawRecords
normalizeCandidates
resolveCandidates
validateCandidates
stageResults
```

Adapters must support:

- `--dry-run` with no writes;
- explicit environment selection;
- bounded batch size;
- retry with idempotency;
- structured summary;
- row-level error export;
- parser/version metadata;
- no embedded credentials;
- no destructive cleanup.

Shared normalization and taxonomy logic belongs in one catalog library, not
copied keyword functions across Python and JavaScript scripts.

## 19. Required tests

Maintain fixtures for:

- same number formatting variants, same issuer;
- same normalized number, different issuers;
- same name, different parts;
- one part in multiple assemblies and machines;
- repeated part twice in one assembly with separate callouts;
- serial-bounded and all-serial fitments;
- combined-looking but legitimate model code;
- ambiguous manufacturer alias;
- messy category alias;
- comma-separated cross-references;
- equivalent versus supersession;
- OCR-invalid number;
- duplicate source file and duplicate rerun;
- failed promotion rollback;
- inventory number that has zero, one, and several candidate matches.

## 20. Operational safety

Before any import against a shared environment:

- name the target project/environment;
- confirm the importer writes only staging;
- record expected source/hash/row counts;
- run dry mode;
- review blocking issues;
- obtain approval for promotion;
- monitor counts and errors;
- retain the immutable source and job report.

Never test an importer by clearing existing catalog tables.
