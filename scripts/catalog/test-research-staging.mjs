#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildResearchStagingBundle,
  normalizeIdentifier,
} from "./lib/research-staging.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..", "..");
const bundle = buildResearchStagingBundle({ projectRoot });

assert.equal(bundle.records.length, 1958, "all aggregate rows must be staged");
assert.equal(bundle.summary.masterPartIdentityCandidates, 1929);
assert.equal(bundle.summary.scopedNumberIdentityCandidates, 1929);
assert.equal(bundle.summary.identityConflictGroups, 27);
assert.equal(bundle.summary.recordsWithMultipleContributingSources, 15);
assert.equal(bundle.summary.occurrenceCandidates, 0, "unresolved assemblies must not create occurrences");
assert.equal(bundle.summary.relationshipCandidates, 1177);
assert.equal(bundle.summary.relationshipTargetsMatchedInBatch, 236);
assert.equal(bundle.summary.relationshipTargetsUnresolved, 941);
assert.equal(bundle.summary.issueCounts.UNKNOWN_MACHINE_TYPE ?? 0, 0);

assert.equal(normalizeIdentifier(" RE-504.836 "), "RE504836");
assert.equal(normalizeIdentifier("S.150-764"), "S150764");

for (const record of bundle.records) {
  assert.ok(record.importFileId, "raw record must reference an import file");
  assert.ok(record.rowNumber > 0, "raw record must preserve a source row");
  assert.ok(
    record.rawPayload._ezparts_provenance.contributing_sources.length > 0,
    "raw record must preserve at least one contributing source",
  );
  assert.equal(
    record.rawPayload._ezparts_provenance.authoritative_source,
    false,
    "research compilation must not be mislabeled authoritative",
  );
  assert.ok(
    record.issues.some((issue) => issue.issueCode === "MISSING_AUTHORITATIVE_PROVENANCE"),
  );
  assert.ok(record.issues.some((issue) => issue.issueCode === "UNRESOLVED_ASSEMBLY"));
  assert.ok(record.issues.some((issue) => issue.issueCode === "PROVISIONAL_MODEL_VARIANT"));
  assert.equal(
    record.candidates.filter((candidate) => candidate.entityType === "part_occurrence").length,
    0,
  );

  for (const candidate of record.candidates) {
    if (candidate.entityType === "part_number") {
      assert.ok(["oem", "aftermarket"].includes(candidate.canonicalPayload.number_type));
      assert.equal(
        candidate.canonicalPayload.normalized_number,
        normalizeIdentifier(candidate.canonicalPayload.number),
      );
    }
    if (candidate.entityType === "fitment") {
      assert.equal(candidate.canonicalPayload.verification_status, "candidate");
      assert.equal(candidate.canonicalPayload.assembly_resolution_status, "unresolved");
    }
    if (candidate.entityType === "part_relationship") {
      assert.equal(candidate.canonicalPayload.relationship_type, "equivalent_to");
      assert.equal(candidate.canonicalPayload.status, "candidate");
    }
    if (candidate.entityType === "taxonomy_alias") {
      assert.equal(candidate.canonicalPayload.mapping_status, "proposed");
      if (candidate.canonicalPayload.proposed_node) {
        assert.equal(candidate.canonicalPayload.proposed_node.node_type, "part_category");
      }
    }
  }
}

const combineModels = new Set(["Axial-Flow 8250", "S680"]);
const modelCandidates = bundle.records.flatMap((record) =>
  record.candidates.filter((candidate) => candidate.entityType === "model"),
);
for (const model of modelCandidates) {
  if (combineModels.has(model.canonicalPayload.model_code)) {
    assert.equal(model.canonicalPayload.machine_type_slug, "combine");
  }
}

process.stdout.write(`${JSON.stringify(bundle.summary, null, 2)}\n`);
process.stdout.write("Research staging transformation tests passed.\n");
