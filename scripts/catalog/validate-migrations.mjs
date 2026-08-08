#!/usr/bin/env node

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(root).filter((name) => name.endsWith(".sql")).sort();
const errors = [];
const tables = new Map();
const foreignKeys = [];
const uniques = [];

const expected = [
  "catalog.manufacturers", "catalog.manufacturer_aliases", "catalog.machine_types",
  "catalog.machine_models", "catalog.model_variants", "catalog.serial_ranges",
  "catalog.systems", "catalog.subsystems", "catalog.assemblies",
  "catalog.source_organizations", "catalog.source_documents", "catalog.source_locations",
  "catalog.catalog_sections", "catalog.parts", "catalog.part_numbers",
  "catalog.part_name_aliases", "catalog.part_number_relationships", "catalog.taxonomy_nodes",
  "catalog.taxonomy_aliases", "catalog.part_taxonomy_assignments", "catalog.fitments",
  "catalog.part_occurrences", "catalog.part_sources", "catalog.part_number_sources",
  "catalog.fitment_sources", "catalog.occurrence_sources", "catalog.relationship_sources",
  "catalog.dealer_inventory_resolutions", "catalog_staging.import_jobs",
  "catalog_staging.import_files", "catalog_staging.raw_records",
  "catalog_staging.entity_candidates", "catalog_staging.validation_issues",
  "catalog_staging.promotion_batches",
];

for (const file of files) {
  const sql = readFileSync(resolve(root, file), "utf8");
  const withoutComments = sql.replace(/--.*$/gm, "");

  if (!/^begin;/im.test(withoutComments) || !/commit;\s*$/i.test(withoutComments)) {
    errors.push(`${file}: migration must be transaction-wrapped`);
  }
  if (/\b(drop|truncate)\s+(table|schema)\b/i.test(withoutComments)) {
    errors.push(`${file}: destructive DDL is forbidden`);
  }
  if (/\b(delete\s+from|update|insert\s+into)\s+public\./i.test(withoutComments)) {
    errors.push(`${file}: legacy public-table data mutation is forbidden`);
  }
  if (/\balter\s+table\s+public\./i.test(withoutComments)) {
    errors.push(`${file}: legacy public-table schema mutation is forbidden`);
  }

  for (const match of withoutComments.matchAll(/create\s+table\s+([a-z_][\w]*\.[a-z_][\w]*)\s*\(/gi)) {
    const table = match[1].toLowerCase();
    if (tables.has(table)) errors.push(`${file}: duplicate table definition for ${table}`);
    tables.set(table, file);
  }
  for (const match of withoutComments.matchAll(/references\s+([a-z_][\w]*\.[a-z_][\w]*)\s*\(([^)]+)\)/gi)) {
    foreignKeys.push({ file, table: match[1].toLowerCase(), columns: match[2].trim() });
  }
  for (const match of withoutComments.matchAll(/constraint\s+([a-z_][\w]*)\s+unique\s*(?:nulls\s+not\s+distinct\s*)?\(([^)]+)\)/gi)) {
    uniques.push({ file, name: match[1], columns: match[2].replace(/\s+/g, " ").trim() });
  }
  for (const match of withoutComments.matchAll(/create\s+unique\s+index\s+([a-z_][\w]*)/gi)) {
    uniques.push({ file, name: match[1], columns: "partial/index expression" });
  }
}

for (const table of expected) {
  if (!tables.has(table)) errors.push(`missing expected table ${table}`);
}
for (const { file, table } of foreignKeys) {
  if (!tables.has(table) && table !== "public.inventory") {
    errors.push(`${file}: foreign key targets undefined table ${table}`);
  }
}

if (tables.size !== expected.length) {
  errors.push(`expected ${expected.length} new tables, found ${tables.size}`);
}

console.log(`Migrations: ${files.length}`);
console.log(`New tables: ${tables.size}`);
console.log(`Foreign keys: ${foreignKeys.length}`);
console.log(`Named unique constraints/indexes: ${uniques.length}`);
console.log(`Legacy table altered: no`);
console.log(`Destructive DDL: no`);

if (errors.length) {
  console.error("\nVALIDATION FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("VALIDATION PASSED");
