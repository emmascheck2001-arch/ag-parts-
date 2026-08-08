#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";


function parseArguments(argv) {
  const options = {
    allowRemote: false,
    bundlePath: null,
    databaseUrl: process.env.EZPARTS_STAGING_DATABASE_URL ?? null,
    dryRun: false,
    psqlBin: process.env.EZPARTS_PSQL_BIN ?? "psql",
    reportPath: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--allow-remote") options.allowRemote = true;
    else if (argument === "--bundle") options.bundlePath = argv[++index];
    else if (argument === "--database-url") options.databaseUrl = argv[++index];
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--psql-bin") options.psqlBin = argv[++index];
    else if (argument === "--report") options.reportPath = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.bundlePath) throw new Error("--bundle is required");
  return options;
}

function assertSafeTarget(databaseUrl, allowRemote) {
  if (!databaseUrl) throw new Error("EZPARTS_STAGING_DATABASE_URL or --database-url is required");
  const parsed = new URL(databaseUrl);
  const localHosts = new Set(["", "localhost", "127.0.0.1", "[::1]"]);
  if (!allowRemote && !localHosts.has(parsed.hostname)) {
    throw new Error(
      `Refusing non-local database host ${parsed.hostname}; --allow-remote requires an explicitly approved staging project`,
    );
  }
}

function assertBundle(bundle) {
  if (bundle.schema_version !== "ezparts.catalog-staging.bundle.v1") {
    throw new Error(`Unsupported bundle schema: ${bundle.schema_version}`);
  }
  if (bundle.status !== "needs_review" || bundle.import_job?.status !== "needs_review") {
    throw new Error("Manual bundle must remain needs_review");
  }
  if (bundle.promotion_attempted !== false || bundle.database_write_performed !== false) {
    throw new Error("Manual bundle safety flags are invalid");
  }
  if (!Array.isArray(bundle.promotion_batches) || bundle.promotion_batches.length !== 0) {
    throw new Error("Manual bundle must not contain promotion batches");
  }
  const arrays = ["import_files", "raw_records", "entity_candidates", "validation_issues"];
  for (const name of arrays) {
    if (!Array.isArray(bundle[name])) throw new Error(`${name} must be an array`);
  }
  if (bundle.validation_issues.some((issue) => issue.severity === "blocking")) {
    throw new Error("Refusing a bundle with blocking validation issues");
  }
  if (bundle.entity_candidates.some((candidate) =>
    ["approved", "promoted"].includes(candidate.resolution_status) || candidate.resolved_catalog_id)) {
    throw new Error("Refusing pre-approved, promoted, or resolved candidates");
  }
  const rawIds = new Set(bundle.raw_records.map((row) => row.id));
  if (rawIds.size !== bundle.raw_records.length) throw new Error("Duplicate raw-record IDs");
  if (bundle.entity_candidates.some((candidate) => !rawIds.has(candidate.raw_record_id))) {
    throw new Error("Candidate references an unknown raw record");
  }
  if (bundle.validation_issues.some((issue) => issue.raw_record_id && !rawIds.has(issue.raw_record_id))) {
    throw new Error("Validation issue references an unknown raw record");
  }
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonLiteral(value) {
  return `${sqlLiteral(JSON.stringify(value))}::jsonb`;
}

function buildSql(bundle) {
  const job = bundle.import_job;
  const statements = [
    "\\set ON_ERROR_STOP on",
    "begin;",
    `insert into catalog_staging.import_jobs (id, importer_name, source_label, status, started_at)
     values (${sqlLiteral(job.id)}::uuid, ${sqlLiteral(job.importer_name)}, ${sqlLiteral(job.source_label)}, 'parsing', now())
     on conflict (id) do update set importer_name = excluded.importer_name, source_label = excluded.source_label,
       status = 'parsing', started_at = coalesce(catalog_staging.import_jobs.started_at, now()), completed_at = null;`,
  ];
  for (const file of bundle.import_files) {
    statements.push(`insert into catalog_staging.import_files
      (id, import_job_id, file_name, media_type, storage_uri, content_sha256, byte_size)
      values (${sqlLiteral(file.id)}::uuid, ${sqlLiteral(job.id)}::uuid, ${sqlLiteral(file.file_name)},
        ${sqlLiteral(file.media_type)}, ${sqlLiteral(file.storage_uri)}, ${sqlLiteral(file.content_sha256)}, ${file.byte_size ?? "null"})
      on conflict (id) do update set file_name = excluded.file_name, media_type = excluded.media_type,
        storage_uri = excluded.storage_uri, byte_size = excluded.byte_size;`);
  }
  statements.push(
    `update catalog_staging.import_jobs set status = 'parsed' where id = ${sqlLiteral(job.id)}::uuid;`,
    `update catalog_staging.import_jobs set status = 'validating' where id = ${sqlLiteral(job.id)}::uuid;`,
  );
  for (const record of bundle.raw_records) {
    statements.push(`insert into catalog_staging.raw_records
      (id, import_job_id, import_file_id, source_record_key, page_number, row_number, raw_payload, raw_text, parse_status)
      values (${sqlLiteral(record.id)}::uuid, ${sqlLiteral(job.id)}::uuid, ${sqlLiteral(record.import_file_id)}::uuid,
        ${sqlLiteral(record.source_record_key)}, ${record.page_number ?? "null"}, ${record.row_number ?? "null"},
        ${jsonLiteral(record.raw_payload)}, ${sqlLiteral(record.raw_text)}, ${sqlLiteral(record.parse_status)})
      on conflict (id) do update set import_file_id = excluded.import_file_id, page_number = excluded.page_number,
        row_number = excluded.row_number, raw_payload = excluded.raw_payload, raw_text = excluded.raw_text,
        parse_status = excluded.parse_status;`);
  }
  for (const candidate of bundle.entity_candidates) {
    statements.push(`insert into catalog_staging.entity_candidates
      (id, import_job_id, raw_record_id, entity_type, candidate_key, canonical_payload, resolution_status, confidence)
      values (${sqlLiteral(candidate.id)}::uuid, ${sqlLiteral(job.id)}::uuid, ${sqlLiteral(candidate.raw_record_id)}::uuid,
        ${sqlLiteral(candidate.entity_type)}, ${sqlLiteral(candidate.candidate_key)}, ${jsonLiteral(candidate.canonical_payload)},
        ${sqlLiteral(candidate.resolution_status)}, ${candidate.confidence ?? "null"})
      on conflict (id) do update set canonical_payload = excluded.canonical_payload,
        resolution_status = excluded.resolution_status, confidence = excluded.confidence,
        resolved_catalog_id = null;`);
  }
  for (const issue of bundle.validation_issues) {
    statements.push(`insert into catalog_staging.validation_issues
      (id, import_job_id, raw_record_id, entity_candidate_id, issue_code, severity, field_name, message, details)
      values (${sqlLiteral(issue.id)}::uuid, ${sqlLiteral(job.id)}::uuid,
        ${issue.raw_record_id ? `${sqlLiteral(issue.raw_record_id)}::uuid` : "null"},
        ${issue.entity_candidate_id ? `${sqlLiteral(issue.entity_candidate_id)}::uuid` : "null"},
        ${sqlLiteral(issue.issue_code)}, ${sqlLiteral(issue.severity)}, ${sqlLiteral(issue.field_name)},
        ${sqlLiteral(issue.message)}, ${jsonLiteral(issue.details)})
      on conflict (id) do update set severity = excluded.severity, field_name = excluded.field_name,
        message = excluded.message, details = excluded.details, resolved_at = null, resolved_by = null;`);
  }
  statements.push(
    `update catalog_staging.import_jobs set status = 'needs_review', completed_at = now() where id = ${sqlLiteral(job.id)}::uuid;`,
    "commit;",
  );
  return statements.join("\n");
}

function validationSql(bundle) {
  const jobId = sqlLiteral(bundle.import_job.id);
  return `\\set ON_ERROR_STOP on
do $$
declare actual bigint;
begin
  select count(*) into actual from catalog_staging.import_files where import_job_id = ${jobId}::uuid;
  if actual <> ${bundle.import_files.length} then raise exception 'Import-file count mismatch: %', actual; end if;
  select count(*) into actual from catalog_staging.raw_records where import_job_id = ${jobId}::uuid;
  if actual <> ${bundle.raw_records.length} then raise exception 'Raw-record count mismatch: %', actual; end if;
  select count(*) into actual from catalog_staging.entity_candidates where import_job_id = ${jobId}::uuid;
  if actual <> ${bundle.entity_candidates.length} then raise exception 'Candidate count mismatch: %', actual; end if;
  select count(*) into actual from catalog_staging.validation_issues where import_job_id = ${jobId}::uuid;
  if actual <> ${bundle.validation_issues.length} then raise exception 'Issue count mismatch: %', actual; end if;
  if (select status from catalog_staging.import_jobs where id = ${jobId}::uuid) is distinct from 'needs_review'
    then raise exception 'Manual job did not remain needs_review'; end if;
  if exists (select 1 from catalog_staging.entity_candidates where import_job_id = ${jobId}::uuid
    and (resolution_status in ('approved', 'promoted') or resolved_catalog_id is not null))
    then raise exception 'Manual job contains approved/promoted/resolved candidates'; end if;
  if exists (select 1 from catalog_staging.promotion_batches where import_job_id = ${jobId}::uuid)
    then raise exception 'Manual job has a promotion batch'; end if;
  if exists (select 1 from catalog_staging.raw_records where import_job_id = ${jobId}::uuid
    and source_record_key like 'mention:%'
    and (raw_payload #>> '{provenance,source_sha256}') is null)
    then raise exception 'Mention provenance is incomplete'; end if;
end
$$;`;
}

function runPsql(options, input, maxBuffer) {
  const result = spawnSync(options.psqlBin, [options.databaseUrl, "--no-psqlrc", "--quiet"], {
    input,
    encoding: "utf8",
    maxBuffer,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

const options = parseArguments(process.argv.slice(2));
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..", "..");
const absoluteBundlePath = path.resolve(projectRoot, options.bundlePath);
const bundle = JSON.parse(readFileSync(absoluteBundlePath, "utf8"));
assertBundle(bundle);

const report = {
  bundle: path.relative(projectRoot, absoluteBundlePath),
  import_job_id: bundle.import_job.id,
  status: "needs_review",
  promotion_attempted: false,
  database_write: options.dryRun ? "none (dry run)" : "catalog_staging only",
  summary: bundle.summary,
};
if (!options.dryRun) {
  assertSafeTarget(options.databaseUrl, options.allowRemote);
  runPsql(options, buildSql(bundle), 128 * 1024 * 1024);
  runPsql(options, validationSql(bundle), 4 * 1024 * 1024);
  report.database_validation = "passed";
}
if (options.reportPath) {
  const absoluteReportPath = path.resolve(projectRoot, options.reportPath);
  mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
  writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
