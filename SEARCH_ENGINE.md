# EZPARTS Search Engine Standard

Search is a domain engine, not a substring filter. It must understand part-number
identity, agricultural terminology, machine scope, fitment, hierarchy,
equivalence, provenance quality, and uncertainty.

## 1. Current implementation

The active search path is:

```text
src/App.jsx
→ src/screens/SearchResults.jsx
→ src/lib/db.js
→ legacy Supabase public.parts/fitments/crossrefs/machines
```

Current behavior:

- a query that looks like a part number searches immediately;
- a natural-language query first asks the farmer to choose a machine;
- `db.js` retrieves rows whose legacy part number, name, or category matches an
  `ILIKE` substring;
- candidate ranking occurs in the browser;
- exact and prefix part-number matches receive the largest scores;
- name/category and verified legacy fitment affect ranking;
- machine scoping is currently applied after broad search results return;
- machine list and part counts are loaded/counted from legacy tables;
- cross-reference numbers are selected for display but are not a complete search
  retrieval index;
- abbreviation/synonym handling is incomplete;
- category text is flat and uncontrolled;
- part detail lookup uses exact legacy `part_number`, not issuer-scoped identity.

Other search/data implementations remain in `src/lib/api.js`, `src/lib/catalog.js`,
`src/lib/index-store.js`, demo data, and marketplace modules. They are not the
future authority and should not be mixed into one result set without an explicit
adapter/cutover design.

## 2. Search goals

Search must answer:

- “What exact part number is this?”
- “What parts match this name or abbreviation?”
- “What part belongs to this machine/system/assembly?”
- “Does this number fit my exact variant/serial range?”
- “What verified equivalents or supersessions exist?”
- “Which assembly contains this reusable part?”
- “Why did this result match, and what evidence supports it?”

## 3. Search input model

Classify intent without forcing one interpretation:

- exact/likely part number;
- manufacturer or machine;
- system/subsystem/assembly browse;
- natural-language part name;
- mixed machine + part query;
- serial/PIN lookup;
- equivalent/superseded number;
- unknown/no-result demand.

Keep the original query for display/audit and derive normalized forms separately.

## 4. Normalization

### Part-number normalization

- trim and uppercase;
- remove approved formatting separators for lookup;
- retain original characters;
- search across issuer scope and show issuer in ambiguous results;
- never treat globally matching normalized text as one part.

### Text normalization

- Unicode normalization;
- lowercase for matching;
- punctuation and whitespace normalization;
- safe tokenization;
- controlled singular/plural handling;
- domain synonym expansion;
- no destructive rewriting of the displayed query.

### Synonyms and abbreviations

Synonyms must be governed data with direction, scope, and review state. Examples
of intended behavior include:

```text
hyd pump → hydraulic pump
hydraulic pump → hydraulic pump
```

Do not create an unrestricted global synonym for an ambiguous abbreviation.
Measure synonym precision and allow manufacturer/system scope.

## 5. Retrieval layers

Retrieve candidates in parallel or a planned sequence:

### Identifier retrieval

1. exact `part_numbers.normalized_number`;
2. approved formatting/name aliases;
3. relationship endpoints for equivalent/superseded numbers;
4. prefix match;
5. conservative fuzzy identifier match, never presented as exact.

Every result includes issuer manufacturer.

### Text retrieval

- canonical part names;
- approved part-name aliases;
- descriptions where source quality allows;
- controlled taxonomy nodes/aliases;
- system, subsystem, assembly, and catalog-section titles;
- approved search synonyms.

### Equipment retrieval

- manufacturer aliases;
- machine type;
- manufacturer-scoped model code/display name;
- model variant and serial/PIN scope;
- catalog hierarchy beneath the selected variant.

### Fitment/occurrence retrieval

Machine-scoped queries join the selected variant and optional serial range in the
database. Assembly browse retrieves `part_occurrences`, not every fitment for the
machine.

## 6. Ranking

Ranking is deterministic and explainable. Recommended feature priority:

1. exact scoped part number;
2. exact approved alias/relationship number;
3. serial-applicable verified occurrence in selected assembly;
4. verified fitment to selected variant/serial range;
5. exact canonical name;
6. exact approved name/taxonomy alias;
7. phrase and prefix matches;
8. token matches;
9. fuzzy candidates;
10. source quality, verification recency, and completeness as tie-breakers.

Do not allow popularity or dealer inventory to outrank an exact correct part
identity. Availability may rank sellers after a part is selected; it must not
change master catalog correctness.

Penalties should apply to:

- rejected/deprecated assertions;
- serial-inapplicable parts;
- unverified candidate-only data;
- fuzzy-only matches;
- unresolved issuer or assembly;
- results outside selected machine scope.

## 7. Result grouping

Group by master part and show its relevant scoped numbers. Do not collapse two
issuers merely because number text matches.

A result should expose:

- canonical part name;
- displayed number and issuer;
- OEM/aftermarket/supplier number type;
- selected-machine fitment status;
- system/subsystem/assembly breadcrumb where known;
- applicable variant/serial range;
- equivalent/supersession indicator;
- evidence/verification level;
- match reason.

If the same normalized text belongs to several issuers, show distinct identities
and require machine/issuer context.

## 8. Hierarchical browse

The target user path is:

```text
Manufacturer
→ Machine Type
→ Model
→ Variant / Serial Range when needed
→ Major System
→ Subsystem
→ Assembly / Component Group
→ Part occurrences
```

Browse queries use IDs at every step. Display strings may be identical without
causing the selection to drift.

An assembly page lists occurrences ordered by catalog/illustration order when
known. It may group repeated occurrences but must retain callout, position,
quantity, and serial distinctions.

## 9. Serial-specific behavior

- A known serial/PIN resolves to a model variant/range before part filtering.
- Parts excluded for that range are not presented as confirmed fits.
- Unknown/invalid serial input does not fall back silently to all-serial certainty.
- If a source provides only an unresolved serial note, display the limitation and
  do not parse/claim an exact range in the UI.
- Exact boundary tests are mandatory.

## 10. Cross-reference and supersession search

- Searching any resolved number may reach the associated master part and verified
  relationships.
- Clearly label `equivalent`, `supersedes`, `replaced by`, and `remanufactured`.
- Preserve direction and effective dates.
- Do not show a candidate relationship as interchangeable.
- A superseded number can remain searchable indefinitely while directing users to
  current evidence-backed options.

## 11. Search API boundary

Create one authoritative server-side search API before normalized UI cutover.
Avoid duplicating ranking logic in multiple screens.

The API contract should include:

```text
query
manufacturer_id?
machine_type_id?
model_id?
model_variant_id?
serial_range_id or serial input?
system_id?
subsystem_id?
assembly_id?
cursor?
limit
```

Response should include stable IDs, display fields, match reason, score bucket,
verification state, breadcrumbs, and a cursor. Do not expose internal secrets or
unbounded source payloads.

## 12. Performance

- Use database-side filtering and ranking candidate generation.
- Use bounded pages and cursor/keyset pagination.
- Avoid `%term%` scans on large unindexed tables as the primary design.
- Consider PostgreSQL full-text/trigram indexes only after query analysis.
- Maintain a denormalized search document/materialized view when necessary, with
  deterministic refresh and lineage to normalized IDs.
- Do not fetch all fitments to compute counts in a client.
- Cache controlled vocabulary and common hierarchy nodes with versioned
  invalidation.
- Measure p50/p95 latency and result quality on representative data.

## 13. Search quality evaluation

Maintain a versioned evaluation set containing expected result IDs and prohibited
false positives for:

- exact OEM number;
- formatted/spacing variant;
- same number across issuers;
- aftermarket number;
- superseded number;
- canonical name;
- abbreviation such as `hyd pump`;
- misspelling;
- machine-scoped term;
- system/subsystem/assembly browse;
- serial below/at/above a boundary;
- part reused across machines;
- category wording that should not contaminate part name;
- no-result query.

Metrics:

- exact-number top-1 accuracy;
- precision@k and recall@k;
- machine-scope false-positive rate;
- serial-scope false-positive rate;
- synonym precision;
- no-result correctness;
- latency and query cost.

Changes to ranking weights or normalization require before/after evaluation.

## 14. Search misses and analytics

The legacy `search_misses` table captures unanswered demand and optional contact
data. Future analytics should separate:

- normalized anonymous query aggregate;
- selected machine context;
- result count;
- abandonment/click signals;
- optional notification consent/contact.

Protect email and machine ownership data with least privilege and retention
rules. Do not use user-entered text as an automatic catalog import.

## 15. Error behavior

Distinguish:

- no matching catalog entity;
- selected machine has no matching fitment;
- selected serial is invalid/unresolved;
- search service/database unavailable;
- query rejected for validation/size;
- results exist but are unverified candidates.

Do not return an empty list for every failure and tell the user “no parts found.”

## 16. Cutover plan

1. Build normalized search views/API behind a feature flag.
2. Add evaluation fixtures and compare with legacy search.
3. Test identifier collisions and machine/serial scope.
4. Run shadow queries without changing user results.
5. Compare latency, top results, and no-result behavior.
6. Enable internal/staging users.
7. Roll out gradually with rollback to legacy reads.
8. Remove old search paths only after measured parity and migration approval.
