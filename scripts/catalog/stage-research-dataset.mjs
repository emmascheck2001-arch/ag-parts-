#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildResearchStagingBundle,
  stableUuid,
} from "./lib/research-staging.mjs";

function parseArguments(argv) {
  const options = {
    allowRemote: false,
    databaseUrl: process.env.EZPARTS_STAGING_DATABASE_URL ?? null,
    dryRun: false,
    psqlBin: process.env.EZPARTS_PSQL_BIN ?? "psql",
    reportPath: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--allow-remote") options.allowRemote = true;
    else if (argument === "--database-url") options.databaseUrl = argv[++index];
    else if (argument === "--psql-bin") options.psqlBin = argv[++index];
    else if (argument === "--report") options.reportPath = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function assertSafeTarget(databaseUrl, allowRemote) {
  if (!databaseUrl) throw new Error("EZPARTS_STAGING_DATABASE_URL or --database-url is required");
  const parsed = new URL(databaseUrl);
  const localHosts = new Set(["", "localhost", "127.0.0.1", "[::1]"]);
  if (!allowRemote && !localHosts.has(parsed.hostname)) {
    throw new Error(
      `Refusing non-local database host ${parsed.hostname}; use --allow-remote only for an explicitly approved staging project`,
    );
  }
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonLiteral(value) {
  return `${sqlLiteral(JSON.stringify(value))}::jsonb`;
}

function candidateId(recordId, candidate) {
  return stableUuid(
    `candidate:${recordId}:${candidate.entityType}:${candidate.candidateKey}`,
  );
}

function issueId(jobId, recordId, issue) {
  return stableUuid(`issue:${jobId}:${recordId}:${issue.issueKey}`);
}

function buildSql(bundle) {
  const statements = [
    "\\set ON_ERROR_STOP on",
    "begin;",
    `insert into catalog_staging.import_jobs (id, importer_name, source_label, status, started_at)
     values (${sqlLiteral(bundle.jobId)}::uuid, ${sqlLiteral(`${bundle.importerName}@${bundle.parserVersion}`)}, ${sqlLiteral(bundle.sourceLabel)}, 'parsing', now())
     on conflict (id) do update set importer_name = excluded.importer_name, source_label = excluded.source_label, status = 'parsing', started_at = coalesce(catalog_staging.import_jobs.started_at, now()), completed_at = null;`,
  ];

  for (const file of bundle.files) {
    statements.push(
      `insert into catalog_staging.import_files
         (id, import_job_id, file_name, media_type, storage_uri, content_sha256, byte_size)
       values
         (${sqlLiteral(file.id)}::uuid, ${sqlLiteral(bundle.jobId)}::uuid, ${sqlLiteral(file.relativePath)}, ${sqlLiteral(file.mediaType)}, ${sqlLiteral(file.storageUri)}, ${sqlLiteral(file.contentSha256)}, ${file.byteSize})
       on conflict (id) do update set file_name = excluded.file_name, media_type = excluded.media_type, storage_uri = excluded.storage_uri, byte_size = excluded.byte_size;`,
    );
  }

  statements.push(
    `update catalog_staging.import_jobs set status = 'parsed' where id = ${sqlLiteral(bundle.jobId)}::uuid;`,
    `update catalog_staging.import_jobs set status = 'validating' where id = ${sqlLiteral(bundle.jobId)}::uuid;`,
  );

  for (const record of bundle.records) {
    statements.push(
      `insert into catalog_staging.raw_records
         (id, import_job_id, import_file_id, source_record_key, row_number, raw_payload, raw_text, parse_status)
       values
         (${sqlLiteral(record.id)}::uuid, ${sqlLiteral(bundle.jobId)}::uuid, ${sqlLiteral(record.importFileId)}::uuid, ${sqlLiteral(record.sourceRecordKey)}, ${record.rowNumber}, ${jsonLiteral(record.rawPayload)}, ${sqlLiteral(record.rawText)}, ${sqlLiteral(record.parseStatus)})
       on conflict (id) do update set import_file_id = excluded.import_file_id, row_number = excluded.row_number, raw_payload = excluded.raw_payload, raw_text = excluded.raw_text, parse_status = excluded.parse_status;`,
    );

    const candidateIds = new Map();
    for (const candidate of record.candidates) {
      const id = candidateId(record.id, candidate);
      candidateIds.set(`${candidate.entityType}|${candidate.candidateKey}`, id);
      statements.push(
        `insert into catalog_staging.entity_candidates
           (id, import_job_id, raw_record_id, entity_type, candidate_key, canonical_payload, resolution_status, confidence)
         values
           (${sqlLiteral(id)}::uuid, ${sqlLiteral(bundle.jobId)}::uuid, ${sqlLiteral(record.id)}::uuid, ${sqlLiteral(candidate.entityType)}, ${sqlLiteral(candidate.candidateKey)}, ${jsonLiteral(candidate.canonicalPayload)}, ${sqlLiteral(candidate.resolutionStatus)}, ${candidate.confidence ?? "null"})
         on conflict (id) do update set canonical_payload = excluded.canonical_payload, resolution_status = excluded.resolution_status, confidence = excluded.confidence;`,
      );
    }

    for (const issue of record.issues) {
      const linkedCandidateId = issue.entityType && issue.candidateKey
        ? candidateIds.get(`${issue.entityType}|${issue.candidateKey}`) ?? null
        : null;
      const id = issueId(bundle.jobId, record.id, issue);
      statements.push(
        `insert into catalog_staging.validation_issues
           (id, import_job_id, raw_record_id, entity_candidate_id, issue_code, severity, field_name, message, details)
         values
           (${sqlLiteral(id)}::uuid, ${sqlLiteral(bundle.jobId)}::uuid, ${sqlLiteral(record.id)}::uuid, ${linkedCandidateId ? `${sqlLiteral(linkedCandidateId)}::uuid` : "null"}, ${sqlLiteral(issue.issueCode)}, ${sqlLiteral(issue.severity)}, ${sqlLiteral(issue.fieldName)}, ${sqlLiteral(issue.message)}, ${jsonLiteral(issue.details ?? {})})
         on conflict (id) do update set entity_candidate_id = excluded.entity_candidate_id, severity = excluded.severity, field_name = excluded.field_name, message = excluded.message, details = excluded.details, resolved_at = null, resolved_by = null;`,
      );
    }
  }

  statements.push(
    `update catalog_staging.import_jobs set status = 'needs_review', completed_at = now() where id = ${sqlLiteral(bundle.jobId)}::uuid;`,
    "commit;",
  );
  return statements.join("\n");
}

function buildValidationSql(bundle) {
  return `\\set ON_ERROR_STOP on
do $$
declare
  actual bigint;
begin
  select count(*) into actual from catalog_staging.import_files where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid;
  if actual <> ${bundle.summary.importFiles} then raise exception 'Expected ${bundle.summary.importFiles} import files, found %', actual; end if;

  select count(*) into actual from catalog_staging.raw_records where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid;
  if actual <> ${bundle.summary.rawRecords} then raise exception 'Expected ${bundle.summary.rawRecords} raw records, found %', actual; end if;

  select count(*) into actual from catalog_staging.entity_candidates where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid;
  if actual <> ${bundle.summary.entityCandidates} then raise exception 'Expected ${bundle.summary.entityCandidates} candidates, found %', actual; end if;

  select count(*) into actual from catalog_staging.validation_issues where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid;
  if actual <> ${bundle.summary.validationIssues} then raise exception 'Expected ${bundle.summary.validationIssues} issues, found %', actual; end if;

  if (select status from catalog_staging.import_jobs where id = ${sqlLiteral(bundle.jobId)}::uuid) is distinct from 'needs_review' then
    raise exception 'Staged research job must remain needs_review';
  end if;

  if exists (
    select 1 from catalog_staging.raw_records
    where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid
      and (
        raw_payload #>> '{_ezparts_provenance,authoritative_source}' is distinct from 'false'
        or jsonb_array_length(raw_payload #> '{_ezparts_provenance,contributing_sources}') < 1
      )
  ) then raise exception 'Every raw record must preserve non-authoritative source provenance'; end if;

  if exists (
    select 1 from catalog_staging.entity_candidates
    where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid
      and entity_type = 'part_number'
      and (
        canonical_payload->>'number_type' not in ('oem', 'aftermarket')
        or canonical_payload->>'normalized_number' <> catalog.normalize_identifier(canonical_payload->>'number')
      )
  ) then raise exception 'Part-number vocabulary or normalization mismatch'; end if;

  if exists (
    select 1 from catalog_staging.entity_candidates
    where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid
      and entity_type = 'fitment'
      and (
        canonical_payload->>'verification_status' <> 'candidate'
        or canonical_payload->>'assembly_resolution_status' <> 'unresolved'
      )
  ) then raise exception 'Fitment verification or assembly status mismatch'; end if;

  if exists (
    select 1 from catalog_staging.entity_candidates
    where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid
      and entity_type = 'part_relationship'
      and canonical_payload->>'relationship_type' <> 'equivalent_to'
  ) then raise exception 'Relationship vocabulary mismatch'; end if;

  if exists (
    select 1 from catalog_staging.entity_candidates
    where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid
      and (entity_type = 'part_occurrence' or resolution_status = 'promoted' or resolved_catalog_id is not null)
  ) then raise exception 'Research staging must not create/promote occurrences or resolve catalog IDs'; end if;

  if exists (
    select 1 from catalog_staging.promotion_batches where import_job_id = ${sqlLiteral(bundle.jobId)}::uuid
  ) then raise exception 'Research staging must not create a promotion batch'; end if;
end
$$;`;
}

function reportFor(bundle) {
  return {
    importer_name: bundle.importerName,
    parser_version: bundle.parserVersion,
    source_fingerprint: bundle.sourceFingerprint,
    import_job_id: bundle.jobId,
    status: "needs_review",
    promotion_attempted: false,
    generated_at: new Date().toISOString(),
    summary: bundle.summary,
  };
}

const options = parseArguments(process.argv.slice(2));
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..", "..");
const bundle = buildResearchStagingBundle({ projectRoot });
const report = reportFor(bundle);

if (!options.dryRun) {
  assertSafeTarget(options.databaseUrl, options.allowRemote);
  const result = spawnSync(
    options.psqlBin,
    [options.databaseUrl, "--no-psqlrc", "--quiet"],
    {
      input: buildSql(bundle),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  report.database_write = "catalog_staging only";
  const validation = spawnSync(
    options.psqlBin,
    [options.databaseUrl, "--no-psqlrc", "--quiet"],
    {
      input: buildValidationSql(bundle),
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (validation.error) throw validation.error;
  if (validation.status !== 0) {
    if (validation.stdout) process.stderr.write(validation.stdout);
    if (validation.stderr) process.stderr.write(validation.stderr);
    process.exit(validation.status ?? 1);
  }
  report.database_validation = "passed";
}

if (options.reportPath) {
  const absoluteReportPath = path.resolve(projectRoot, options.reportPath);
  mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
  writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
