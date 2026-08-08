# EZPARTS Engineering Roadmap

This roadmap sequences the transition from the current flat legacy catalog to a
normalized, provenance-backed agricultural parts platform. It is intentionally
gated: later phases do not begin merely because code exists.

## Guiding constraints

- Preserve all legacy production tables until an explicit retirement phase.
- Do not restore the historical 22,000-part backup without explicit approval.
- Do not mix catalog rebuild work with Stripe, payments, authentication, or dealer
  account redesign.
- Do not change the UI to read normalized tables before safe read APIs and pilot
  data exist.
- Never invent OEM/machine/serial/assembly data to make a demo look complete.
- Every phase has measurable exit criteria and rollback.

## Current baseline — August 2026

Completed or present:

- React/Vite mobile-first search application;
- Netlify deployment/functions;
- Supabase legacy catalog and supply schemas;
- Capacitor/Xcode iOS wrapper;
- active legacy server-side-ish Supabase search through `src/lib/db.js`;
- machine selection and flat category browsing;
- diagram/static manual support for limited machines;
- historical import/OCR/manual loaders;
- immutable backups of previous catalog data;
- committed additive normalized migrations under `supabase/migrations`;
- structural migration validator;
- candidate normalized JSON under ignored `catalogs/rebuild`.

Known gaps:

- normalized migrations not proven applied to a shared environment;
- no PostgreSQL-engine migration test in the repository;
- app still reads legacy flat tables;
- direct legacy importers bypass staging;
- no promotion implementation;
- no authoritative normalized search API/index;
- no automated unit/integration/e2e test suite;
- root README and historical SQL/docs are stale/conflicting;
- UI has no full manufacturer-to-assembly browse path;
- dealer inventory still resolves by text `pn_norm`;
- significant inactive/overlapping demo and marketplace code remains;
- working tree contains uncommitted application/iOS/catalog tooling changes that
  must be reviewed independently.

## Phase 0 — Standards and repository control

Deliverables:

- `AGENTS.md` and specialized engineering standards;
- identify authoritative versus historical files;
- document environment/deployment matrix;
- preserve clean commits scoped by concern;
- add decision-record convention for major architecture changes.

Exit criteria:

- future agents can identify active catalog/search paths;
- no new standalone root schema files;
- destructive/import rules are explicit;
- repository status and ownership of existing uncommitted changes are understood.

## Phase 1 — Database validation foundation

Deliverables:

- provision disposable PostgreSQL 15+ or Supabase development branch;
- execute all normalized migrations in order;
- add catalog schema integration tests;
- inspect constraints, indexes, triggers, grants, and role behavior;
- test representative invalid inserts and transaction rollback;
- document production migration procedure and recovery plan.

Exit criteria:

- migrations execute from start to finish on a clean compatible environment;
- 34 normalized/staging tables and expected constraints are verified by engine;
- browser/importer roles cannot directly mutate `catalog`;
- cross-variant serial and verified-assembly triggers are tested;
- no production tables have been altered.

## Phase 2 — Safe additive deployment

Deliverables:

- apply normalized schemas alongside legacy tables in a controlled shared
  staging environment, then production only with approval;
- record migration history;
- add monitoring for schema/promotion failures;
- expose no normalized write surface to the current UI.

Exit criteria:

- normalized empty schema exists alongside legacy production data;
- legacy application behavior is unchanged;
- backup and rollback evidence is current;
- no old catalog data has been restored or promoted.

## Phase 3 — Import platform

Deliverables:

- shared importer SDK/library;
- staging writer and immutable source registration;
- pure adapters for CSV/XLSX, structured JSON/API, text PDF, OCR PDF/image;
- controlled manufacturer/model/taxonomy resolution;
- stable issue codes and review workflow;
- transactional promotion routines guarded by approval;
- complete provenance writes;
- fixture-based importer tests and duplicate-rerun tests.

Exit criteria:

- new adapters cannot directly write approved master tables;
- a failed promotion leaves zero partial master rows;
- rerun is idempotent;
- ambiguous issuer/model/category/assembly remains staged;
- source document/page/record is traceable from promoted entities.

## Phase 4 — Small verified pilot catalog

Scope:

- select one small, legally usable, source-backed machine/catalog pilot;
- use only facts present in authoritative source material;
- do not use the 22,000-part backup;
- do not manufacture missing assembly or serial information.

Deliverables:

- manufacturer/type/model/default or sourced variants;
- controlled system/subsystem/assembly hierarchy;
- catalog sections and repeated part occurrences;
- scoped part numbers;
- verified fitments/relationships where evidence supports them;
- provenance coverage report.

Exit criteria:

- every displayed occurrence traces to a source location;
- repeated parts use one master part with multiple occurrences;
- same number across issuers remains distinct;
- assembly browser queries return deterministic verified results;
- human review signs off sample pages against source.

## Phase 5 — Normalized read APIs and search engine

Deliverables:

- authoritative hierarchy API;
- authoritative part detail API using stable IDs;
- normalized search document/view/index;
- exact scoped number, alias, relationship, name, taxonomy, hierarchy, and
  synonym retrieval;
- database-side machine/variant/serial/assembly scoping;
- deterministic ranking with match explanations;
- search evaluation corpus and quality metrics;
- shadow comparison with legacy search.

Exit criteria:

- exact-number top-1 and collision tests pass;
- `hydraulic pump` and approved abbreviation behavior meet evaluation targets;
- no out-of-scope machine/serial results are labeled verified;
- p95 latency and query cost are acceptable at representative volume;
- API distinguishes empty results from service failure.

## Phase 6 — Hierarchical user experience

Deliverables:

- Manufacturer selector;
- Machine Type selector;
- Model selector;
- Variant/Serial selection when required;
- Major System → Subsystem → Assembly navigation;
- assembly occurrence list with callout/quantity/position/source;
- normalized part detail with issuer-scoped numbers and relationships;
- accessible loading/empty/error states;
- feature flag and legacy rollback.

Exit criteria:

- a farmer can traverse the complete target hierarchy using IDs;
- assembly page lists only verified/source-appropriate occurrences;
- long names, mobile layout, accessibility, and iOS safe areas pass tests;
- no UI claim exceeds stored verification state;
- current legacy search remains available during rollout.

## Phase 7 — Dealer inventory resolution

Deliverables:

- resolver from each `public.inventory.id` to `catalog.part_numbers.id`;
- issuer identification and ambiguity review;
- candidate/verified/rejected/stale lifecycle;
- normalized inventory read adapter;
- reconciliation report for unmatched/ambiguous listings.

Exit criteria:

- verified listings resolve to exactly one scoped number identity;
- unresolved inventory does not create master parts automatically;
- price/stock remain outside master catalog;
- Stripe/payment/dealer account behavior is unchanged unless separately scoped;
- rollback can return to legacy inventory lookup.

## Phase 8 — Historical data reconciliation

This phase requires explicit user authorization before touching the old backup.

Deliverables after authorization:

- immutable backup verification;
- load backup only into a dedicated staging job/environment;
- collision/duplicate/category/model/source audit;
- source-quality tiers;
- automated candidate creation without automatic approval;
- human review prioritization;
- controlled promotion batches;
- reconciliation counts and reject archive.

Exit criteria:

- no backup file modified;
- every promoted row has identity and provenance policy outcome;
- collisions and synthetic legacy suffixes are resolved, not copied blindly;
- useful data preserved; uncertain data remains staged/rejected;
- production promotion is separately approved.

## Phase 9 — Legacy cutover and retirement

Deliverables:

- measured normalized parity for supported workflows;
- dual-read/shadow period;
- final reconciliation;
- compatibility plan for orders/inventory/history;
- rollback window;
- explicit deprecation notices and removal plan.

Exit criteria before any destructive action:

- user explicitly approves exact tables/data to retire;
- current verified backup and restore drill exist;
- normalized reads meet correctness/performance targets;
- no active code/function/script depends on retired tables;
- rollback deadline and owner are documented.

Only then may a separate destructive migration be proposed. Never bundle it with
feature work.

## Phase 10 — Scale and operations

Deliverables:

- catalog/search SLOs and dashboards;
- import queue observability and retries;
- data-quality dashboards;
- provenance/verification recertification;
- search evaluation in CI;
- pagination/query-plan regression tests;
- retention/privacy policy for search leads and operational records;
- disaster recovery drills;
- manufacturer/source onboarding playbook.

Exit criteria:

- measured operational targets and alert ownership;
- repeatable onboarding without schema redesign;
- recovery procedures tested;
- no single importer or source can bypass quality gates.

## Cross-cutting engineering backlog

### Testing

- add unit test runner;
- add database integration tests;
- add Netlify Function tests;
- add importer fixtures;
- add search evaluation suite;
- add browser/iOS smoke tests;
- add accessibility checks.

### Repository cleanup

- reconcile stale README/setup instructions;
- classify or archive incompatible root SQL files;
- choose one authoritative catalog client path;
- remove unused code only after dependency analysis;
- review ignored `catalogs/rebuild` artifacts and generator reproducibility;
- review generated/duplicate iOS configuration files;
- add CI build and migration validation.

### Security

- verify all dealer functions authenticate and authorize ownership;
- restrict arbitrary account IDs/URLs at server boundaries;
- test role grants/RLS;
- define search-lead data retention;
- centralize safe structured error responses;
- rotate secrets if exposure is ever suspected.

### Performance

- replace client-side full fitment counting;
- move machine scoping into search query;
- define pagination everywhere;
- establish query-plan fixtures and representative datasets;
- track web bundle and mobile launch performance.

## Roadmap governance

- Each phase is a project with an owner, scope, risks, tests, metrics, and rollback.
- A later phase may prototype behind flags but cannot bypass earlier safety gates.
- Update this roadmap when facts change; include date and reason in the commit.
- Do not mark a phase complete because files exist. Mark it complete only when its
  exit criteria are verified in the intended environment.
