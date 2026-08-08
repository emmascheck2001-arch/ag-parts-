import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export const IMPORTER_NAME = "ezparts-research-json-stager";
export const PARSER_VERSION = "1.0.0";

const CATEGORY_MAP = {
  "Augers/Elevators": "Augers & Elevators",
  Bearings: "Bearings",
  Belts: "Belts",
  Brakes: "Brake Components",
  "Cab & Body": "Cab & Body Components",
  Chains: "Chains",
  "Concave/Threshing": "Concaves & Threshing Components",
  Cooling: "Cooling Components",
  "Cutting/Blades": "Blades & Cutting Components",
  Drivetrain: "Drivetrain Components",
  Electrical: "Electrical Components",
  Engine: "Engine Components",
  Filters: "Filters",
  "Fuel System": "Fuel System Components",
  Hardware: "Hardware & Fasteners",
  Hydraulics: "Hydraulic Components",
  Lighting: "Lighting Components",
  PTO: "Power Take-Off Components",
  "Seals & Gaskets": "Seals & Gaskets",
  Steering: "Steering Components",
  "Tires & Wheels": "Wheels & Tires",
};

// Source-scoped aliases must point to an exact entry in machines_research.json.
// Do not generalize these into punctuation/prefix stripping rules.
const MODEL_ALIASES = {
  "massey ferguson|4710": "MF 4710",
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

export function stableUuid(value) {
  const hex = sha256(value).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

export function normalizeIdentifier(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

export function normalizeLabel(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(value) {
  return normalizeLabel(value).replace(/\s+/g, "-");
}

function readJsonFile(filePath) {
  const bytes = readFileSync(filePath);
  return {
    byteSize: bytes.byteLength,
    contentSha256: sha256(bytes),
    rows: JSON.parse(bytes.toString("utf8")),
  };
}

function splitReferences(value) {
  return String(value ?? "")
    .split(/[,/;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function scopedNumberKey(issuerSlug, number) {
  return `${issuerSlug}:${normalizeIdentifier(number)}`;
}

function modelKey(manufacturerSlug, machineTypeSlug, modelCode) {
  return `${manufacturerSlug}:${machineTypeSlug}:${normalizeIdentifier(modelCode)}`;
}

function isCompositeIssuer(value) {
  return /[/()]|\s+or\s+/i.test(String(value ?? ""));
}

function addCandidate(record, candidate) {
  const identity = `${candidate.entityType}|${candidate.candidateKey}`;
  if (record.candidateIdentities.has(identity)) return;
  record.candidateIdentities.add(identity);
  record.candidates.push(candidate);
}

function addIssue(record, issue) {
  const identity = [
    issue.issueCode,
    issue.entityType ?? "record",
    issue.candidateKey ?? "record",
    issue.fieldName ?? "",
  ].join("|");
  if (record.issueIdentities.has(identity)) return;
  record.issueIdentities.add(identity);
  record.issues.push({ ...issue, issueKey: identity });
}

function collectSourceFiles(projectRoot) {
  const machinesDir = path.join(projectRoot, "catalogs", "machines");
  const deepDir = path.join(machinesDir, "deep");
  const contributingPaths = readdirSync(deepDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(deepDir, name));
  contributingPaths.push(path.join(machinesDir, "parts_pilot.json"));

  const aggregatePath = path.join(machinesDir, "parts_load.json");
  const machineCatalogPath = path.join(machinesDir, "machines_research.json");
  const allPaths = [aggregatePath, machineCatalogPath, ...contributingPaths];
  const files = new Map();

  for (const filePath of allPaths) {
    const file = readJsonFile(filePath);
    const relativePath = path.relative(projectRoot, filePath);
    files.set(relativePath, {
      ...file,
      fileName: path.basename(filePath),
      relativePath,
      mediaType: "application/json",
      storageUri: `repo://${relativePath}`,
      modifiedAt: statSync(filePath).mtime.toISOString(),
    });
  }

  return {
    aggregate: files.get(path.relative(projectRoot, aggregatePath)),
    machineCatalog: files.get(path.relative(projectRoot, machineCatalogPath)),
    contributors: contributingPaths.map((filePath) =>
      files.get(path.relative(projectRoot, filePath)),
    ),
    files: [...files.values()],
  };
}

function buildMachineTypeIndex(machineRows) {
  const index = new Map();
  for (const row of machineRows) {
    const key = `${normalizeLabel(row.make)}|${normalizeIdentifier(row.model)}`;
    const values = index.get(key) ?? new Set();
    if (row.type) values.add(String(row.type).trim());
    index.set(key, values);
  }
  return index;
}

function resolveMachineCatalogModel(machineTypeIndex, make, rawModel) {
  const makeKey = normalizeLabel(make);
  const aliasKey = `${makeKey}|${normalizeLabel(rawModel)}`;
  const resolvedModelCode = MODEL_ALIASES[aliasKey] ?? String(rawModel ?? "").trim();
  const lookupKey = `${makeKey}|${normalizeIdentifier(resolvedModelCode)}`;
  return {
    machineTypes: [...(machineTypeIndex.get(lookupKey) ?? [])],
    rawModelCode: String(rawModel ?? "").trim(),
    resolvedModelCode,
    resolutionMethod: MODEL_ALIASES[aliasKey]
      ? "approved_source_alias"
      : "exact_make_model",
  };
}

function sourceOccurrences(contributors) {
  const index = new Map();
  for (const file of contributors) {
    if (!Array.isArray(file.rows)) {
      throw new Error(`${file.relativePath} must contain a JSON array`);
    }
    file.rows.forEach((row, position) => {
      const key = stableJson(row);
      const matches = index.get(key) ?? [];
      matches.push({
        fileName: file.fileName,
        relativePath: file.relativePath,
        contentSha256: file.contentSha256,
        rowNumber: position + 1,
      });
      index.set(key, matches);
    });
  }
  for (const matches of index.values()) {
    matches.sort((a, b) =>
      a.relativePath.localeCompare(b.relativePath) || a.rowNumber - b.rowNumber,
    );
  }
  return index;
}

function buildIdentityGroups(rows) {
  const groups = new Map();
  for (const row of rows) {
    const issuerName = row.is_oem === false
      ? row.brand || "Unresolved aftermarket issuer"
      : row.brand || row.machine_make;
    const key = scopedNumberKey(slugify(issuerName), row.part_number);
    const group = groups.get(key) ?? {
      categories: new Set(),
      machineModels: new Set(),
      names: new Set(),
      rows: 0,
    };
    if (row.category) group.categories.add(String(row.category).trim());
    if (row.name) group.names.add(String(row.name).trim());
    group.machineModels.add(`${row.machine_make}|${row.machine_model}`);
    group.rows += 1;
    groups.set(key, group);
  }
  return groups;
}

function buildRelationshipCounts(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (row.is_oem !== false || !row.oem_crossref) continue;
    const issuerName = row.brand || "Unresolved aftermarket issuer";
    const fromKey = scopedNumberKey(slugify(issuerName), row.part_number);
    const targetIssuerSlug = slugify(row.machine_make);
    for (const reference of splitReferences(row.oem_crossref)) {
      const targetKey = scopedNumberKey(targetIssuerSlug, reference);
      if (targetKey === fromKey) continue;
      const key = `${fromKey}|${targetKey}|equivalent_to`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

export function buildResearchStagingBundle({ projectRoot }) {
  const sourceSet = collectSourceFiles(projectRoot);
  if (!Array.isArray(sourceSet.aggregate.rows)) {
    throw new Error(`${sourceSet.aggregate.relativePath} must contain a JSON array`);
  }
  if (!Array.isArray(sourceSet.machineCatalog.rows)) {
    throw new Error(`${sourceSet.machineCatalog.relativePath} must contain a JSON array`);
  }

  const rawRows = sourceSet.aggregate.rows;
  const occurrenceIndex = sourceOccurrences(sourceSet.contributors);
  const machineTypeIndex = buildMachineTypeIndex(sourceSet.machineCatalog.rows);
  const identityGroups = buildIdentityGroups(rawRows);
  const relationshipCounts = buildRelationshipCounts(rawRows);
  const allNumberKeys = new Set(
    rawRows.map((row) => {
      const issuerName = row.is_oem === false
        ? row.brand || "Unresolved aftermarket issuer"
        : row.brand || row.machine_make;
      return scopedNumberKey(slugify(issuerName), row.part_number);
    }),
  );

  const fingerprintInput = sourceSet.files
    .map((file) => `${file.relativePath}:${file.contentSha256}`)
    .sort()
    .join("\n");
  const sourceFingerprint = sha256(
    `${IMPORTER_NAME}@${PARSER_VERSION}\n${fingerprintInput}`,
  );
  const jobId = stableUuid(`import-job:${sourceFingerprint}`);
  const filesByPath = new Map(
    sourceSet.files.map((file) => [
      file.relativePath,
      {
        ...file,
        id: stableUuid(`import-file:${jobId}:${file.contentSha256}:${file.relativePath}`),
      },
    ]),
  );

  const rawRecordKeys = new Set();
  const records = rawRows.map((row, aggregatePosition) => {
    const matches = occurrenceIndex.get(stableJson(row)) ?? [];
    if (matches.length === 0) {
      throw new Error(
        `Aggregate row ${aggregatePosition + 1} has no deep/pilot source match`,
      );
    }

    const rawHash = sha256(stableJson(row));
    const sourceRecordKey = `${sourceSet.aggregate.contentSha256}:${rawHash}`;
    if (rawRecordKeys.has(sourceRecordKey)) {
      throw new Error(
        `Duplicate stable source record key at aggregate row ${aggregatePosition + 1}`,
      );
    }
    rawRecordKeys.add(sourceRecordKey);

    const primarySource = matches[0];
    const primaryFile = filesByPath.get(primarySource.relativePath);
    const record = {
      id: stableUuid(`raw-record:${jobId}:${sourceRecordKey}`),
      importFileId: primaryFile.id,
      sourceRecordKey,
      rowNumber: primarySource.rowNumber,
      rawText: [row.part_number, row.name, row.machine_make, row.machine_model]
        .filter(Boolean)
        .join(" | "),
      parseStatus: "parsed",
      rawPayload: {
        ...row,
        _ezparts_provenance: {
          aggregate: {
            file: sourceSet.aggregate.relativePath,
            row_number: aggregatePosition + 1,
            content_sha256: sourceSet.aggregate.contentSha256,
          },
          contributing_sources: matches.map((match) => ({
            file: match.relativePath,
            row_number: match.rowNumber,
            content_sha256: match.contentSha256,
          })),
          evidence_class: "compiled_research_candidate",
          authoritative_source: false,
          importer: IMPORTER_NAME,
          parser_version: PARSER_VERSION,
        },
      },
      candidates: [],
      issues: [],
      candidateIdentities: new Set(),
      issueIdentities: new Set(),
    };

    const machineManufacturerName = String(row.machine_make ?? "").trim();
    const machineManufacturerSlug = slugify(machineManufacturerName);
    const issuerName = String(
      row.is_oem === false
        ? row.brand || "Unresolved aftermarket issuer"
        : row.brand || row.machine_make,
    ).trim();
    const issuerSlug = slugify(issuerName);
    const normalizedNumber = normalizeIdentifier(row.part_number);
    const partKey = scopedNumberKey(issuerSlug, normalizedNumber);
    const identityGroup = identityGroups.get(partKey);
    const hasIdentityConflict =
      identityGroup.names.size > 1 || identityGroup.categories.size > 1;

    const modelResolution = resolveMachineCatalogModel(
      machineTypeIndex,
      machineManufacturerName,
      row.machine_model,
    );
    const machineTypes = modelResolution.machineTypes;
    const machineType = machineTypes.length === 1 ? machineTypes[0] : null;
    const machineTypeSlug = machineType ? slugify(machineType) : "unresolved";
    const scopedModelKey = modelKey(
      machineManufacturerSlug,
      machineTypeSlug,
      modelResolution.resolvedModelCode,
    );

    addCandidate(record, {
      entityType: "manufacturer",
      candidateKey: `manufacturer:${machineManufacturerSlug}`,
      resolutionStatus: "unresolved",
      confidence: 0.95,
      canonicalPayload: {
        canonical_name: machineManufacturerName,
        slug: machineManufacturerSlug,
        role: "machine_manufacturer",
      },
    });

    addCandidate(record, {
      entityType: "manufacturer",
      candidateKey: `manufacturer:${issuerSlug}`,
      resolutionStatus: isCompositeIssuer(issuerName) ? "ambiguous" : "unresolved",
      confidence: isCompositeIssuer(issuerName) ? 0.4 : 0.75,
      canonicalPayload: {
        canonical_name: issuerName,
        slug: issuerSlug,
        role: "part_number_issuer",
        machine_manufacturer_slug: machineManufacturerSlug,
      },
    });

    if (machineType) {
      addCandidate(record, {
        entityType: "machine_type",
        candidateKey: `machine-type:${machineTypeSlug}`,
        resolutionStatus: "unresolved",
        confidence: 0.95,
        canonicalPayload: {
          canonical_name: machineType,
          slug: machineTypeSlug,
          resolution_source: sourceSet.machineCatalog.relativePath,
          resolution_method: modelResolution.resolutionMethod,
        },
      });
    } else {
      addIssue(record, {
        issueCode: machineTypes.length > 1 ? "AMBIGUOUS_MACHINE_TYPE" : "UNKNOWN_MACHINE_TYPE",
        severity: "error",
        fieldName: "machine_type",
        message: "Machine type could not be uniquely resolved from the machine research catalog.",
        details: { machine_types: machineTypes },
      });
    }

    addCandidate(record, {
      entityType: "model",
      candidateKey: `model:${scopedModelKey}`,
      resolutionStatus: machineType ? "unresolved" : "ambiguous",
      confidence: machineType ? 0.9 : 0.4,
      canonicalPayload: {
        manufacturer_slug: machineManufacturerSlug,
        machine_type_slug: machineType ? machineTypeSlug : null,
        model_code: modelResolution.resolvedModelCode,
        raw_model_code: modelResolution.rawModelCode,
        normalized_model_code: normalizeIdentifier(modelResolution.resolvedModelCode),
        display_name: `${machineManufacturerName} ${modelResolution.resolvedModelCode}`.trim(),
        resolution_method: modelResolution.resolutionMethod,
      },
    });

    addCandidate(record, {
      entityType: "variant",
      candidateKey: `variant:${scopedModelKey}:base`,
      resolutionStatus: "unresolved",
      confidence: 0.25,
      canonicalPayload: {
        model_key: scopedModelKey,
        variant_code: "base",
        normalized_variant_code: "BASE",
        display_name: `${machineManufacturerName} ${modelResolution.resolvedModelCode}`.trim(),
        is_default: true,
        provisional: true,
        configuration: {},
      },
    });

    addCandidate(record, {
      entityType: "part",
      candidateKey: `part:${partKey}`,
      resolutionStatus: hasIdentityConflict ? "ambiguous" : "unresolved",
      confidence: hasIdentityConflict ? 0.45 : 0.7,
      canonicalPayload: {
        scoped_number_key: partKey,
        canonical_name_proposal: hasIdentityConflict ? null : row.name,
        name_options: [...identityGroup.names].sort(),
        raw_category_options: [...identityGroup.categories].sort(),
        part_kind: "component",
        lifecycle_status: "active",
      },
    });

    addCandidate(record, {
      entityType: "part_number",
      candidateKey: `part-number:${partKey}`,
      resolutionStatus: isCompositeIssuer(issuerName) || hasIdentityConflict
        ? "ambiguous"
        : "unresolved",
      confidence: isCompositeIssuer(issuerName) ? 0.4 : 0.75,
      canonicalPayload: {
        part_key: partKey,
        issuer_manufacturer_slug: issuerSlug,
        number: String(row.part_number ?? "").trim(),
        normalized_number: normalizedNumber,
        number_type: row.is_oem === false ? "aftermarket" : "oem",
        is_primary: true,
      },
    });

    const mappedCategory = CATEGORY_MAP[row.category] ?? null;
    addCandidate(record, {
      entityType: "taxonomy_alias",
      candidateKey: `taxonomy-alias:ezparts-research:${normalizeLabel(row.category) || "missing"}`,
      resolutionStatus: mappedCategory ? "unresolved" : "ambiguous",
      confidence: mappedCategory ? 0.8 : 0.2,
      canonicalPayload: {
        source_scope: "ezparts-research",
        raw_value: row.category ?? null,
        normalized_value: normalizeLabel(row.category),
        proposed_node: mappedCategory
          ? {
              canonical_name: mappedCategory,
              node_type: "part_category",
              slug: slugify(mappedCategory),
            }
          : null,
        mapping_status: "proposed",
      },
    });

    addCandidate(record, {
      entityType: "fitment",
      candidateKey: `fitment:${partKey}:${scopedModelKey}:base:fits`,
      resolutionStatus: "unresolved",
      confidence: 0.5,
      canonicalPayload: {
        part_key: partKey,
        model_key: scopedModelKey,
        variant_code: "base",
        serial_range_key: null,
        applicability_type: "fits",
        verification_status: "candidate",
        assembly_resolution_status: "unresolved",
        authoritative_source_present: false,
      },
    });

    addIssue(record, {
      issueCode: "MISSING_AUTHORITATIVE_PROVENANCE",
      severity: "error",
      fieldName: "provenance",
      message: "The repository research row is traceable, but no authoritative document/page or external record is attached.",
      details: {
        evidence_class: "compiled_research_candidate",
        contributing_source_count: matches.length,
      },
    });
    addIssue(record, {
      issueCode: "UNRESOLVED_ASSEMBLY",
      severity: "warning",
      fieldName: "assembly_id",
      message: "Assembly placement is intentionally unresolved; no occurrence candidate was created.",
      details: { occurrence_created: false },
    });
    addIssue(record, {
      issueCode: "PROVISIONAL_MODEL_VARIANT",
      severity: "warning",
      fieldName: "variant_code",
      message: "The base model variant is provisional until a source establishes configuration or serial scope.",
      details: { variant_code: "base" },
    });

    if (!mappedCategory) {
      addIssue(record, {
        issueCode: "UNRESOLVED_TAXONOMY",
        severity: "error",
        entityType: "taxonomy_alias",
        candidateKey: `taxonomy-alias:ezparts-research:${normalizeLabel(row.category) || "missing"}`,
        fieldName: "category",
        message: "The raw category has no controlled EZPARTS part-category proposal.",
        details: { raw_category: row.category ?? null },
      });
    }

    if (hasIdentityConflict) {
      addIssue(record, {
        issueCode: "SCOPED_PART_NUMBER_COLLISION",
        severity: "error",
        entityType: "part",
        candidateKey: `part:${partKey}`,
        fieldName: "canonical_name",
        message: "The same issuer-scoped number has conflicting source names or categories and requires review.",
        details: {
          names: [...identityGroup.names].sort(),
          categories: [...identityGroup.categories].sort(),
          machine_models: [...identityGroup.machineModels].sort(),
          source_row_count: identityGroup.rows,
        },
      });
    }

    if (issuerName !== machineManufacturerName) {
      addIssue(record, {
        issueCode: isCompositeIssuer(issuerName)
          ? "AMBIGUOUS_PART_NUMBER_ISSUER"
          : "PART_NUMBER_ISSUER_REQUIRES_REVIEW",
        severity: isCompositeIssuer(issuerName) ? "error" : "warning",
        entityType: "part_number",
        candidateKey: `part-number:${partKey}`,
        fieldName: "issuer_manufacturer_slug",
        message: "The proposed part-number issuer differs from the machine manufacturer and must be confirmed.",
        details: {
          proposed_issuer: issuerName,
          machine_manufacturer: machineManufacturerName,
          is_oem: row.is_oem !== false,
        },
      });
    }

    if (row.is_oem === false && row.oem_crossref) {
      const targetIssuerSlug = machineManufacturerSlug;
      for (const reference of splitReferences(row.oem_crossref)) {
        const targetNormalizedNumber = normalizeIdentifier(reference);
        if (!targetNormalizedNumber) continue;
        const targetKey = scopedNumberKey(targetIssuerSlug, targetNormalizedNumber);
        if (targetKey === partKey) continue;
        const relationshipIdentity = `${partKey}|${targetKey}|equivalent_to`;
        const targetExists = allNumberKeys.has(targetKey);
        const candidateKey = `relationship:${relationshipIdentity}`;
        addCandidate(record, {
          entityType: "part_relationship",
          candidateKey,
          resolutionStatus: "unresolved",
          confidence: targetExists ? 0.65 : 0.35,
          canonicalPayload: {
            from_part_number_key: partKey,
            to_part_number_key: targetKey,
            raw_target_number: reference,
            relationship_type: "equivalent_to",
            status: "candidate",
            endpoint_resolution: targetExists ? "matched_batch_candidate" : "unresolved",
            direction_review_required: true,
          },
        });

        addIssue(record, {
          issueCode: "RELATIONSHIP_TYPE_REQUIRES_REVIEW",
          severity: "warning",
          entityType: "part_relationship",
          candidateKey,
          fieldName: "relationship_type",
          message: "The raw OEM cross-reference was normalized to equivalent_to as a candidate and requires source review.",
          details: { raw_field: "oem_crossref", raw_target_number: reference },
        });

        if (!targetExists) {
          addIssue(record, {
            issueCode: "UNRESOLVED_RELATIONSHIP_ENDPOINT",
            severity: "error",
            entityType: "part_relationship",
            candidateKey,
            fieldName: "to_part_number_id",
            message: "The target issuer-scoped part number is not present in this import batch or the resolved catalog.",
            details: {
              target_issuer_slug: targetIssuerSlug,
              target_normalized_number: targetNormalizedNumber,
            },
          });
        }

        if ((relationshipCounts.get(relationshipIdentity) ?? 0) > 1) {
          addIssue(record, {
            issueCode: "DUPLICATE_RELATIONSHIP_ASSERTION",
            severity: "info",
            entityType: "part_relationship",
            candidateKey,
            fieldName: "relationship_type",
            message: "The same scoped relationship is asserted by more than one research row.",
            details: { assertion_count: relationshipCounts.get(relationshipIdentity) },
          });
        }
      }
    }

    delete record.candidateIdentities;
    delete record.issueIdentities;
    return record;
  });

  const candidates = records.reduce((sum, record) => sum + record.candidates.length, 0);
  const issues = records.flatMap((record) => record.issues);
  const issueCounts = Object.fromEntries(
    [...new Set(issues.map((issue) => issue.issueCode))]
      .sort()
      .map((code) => [code, issues.filter((issue) => issue.issueCode === code).length]),
  );
  const relationshipCandidates = records.flatMap((record) =>
    record.candidates.filter((candidate) => candidate.entityType === "part_relationship"),
  );

  return {
    importerName: IMPORTER_NAME,
    parserVersion: PARSER_VERSION,
    sourceFingerprint,
    jobId,
    sourceLabel: `EZPARTS research candidates ${sourceFingerprint.slice(0, 12)}`,
    files: [...filesByPath.values()].map(({ rows, ...file }) => file),
    records,
    summary: {
      rawRecords: records.length,
      importFiles: filesByPath.size,
      entityCandidates: candidates,
      validationIssues: issues.length,
      issueCounts,
      masterPartIdentityCandidates: identityGroups.size,
      scopedNumberIdentityCandidates: allNumberKeys.size,
      identityConflictGroups: [...identityGroups.values()].filter(
        (group) => group.names.size > 1 || group.categories.size > 1,
      ).length,
      relationshipCandidates: relationshipCandidates.length,
      relationshipTargetsMatchedInBatch: relationshipCandidates.filter(
        (candidate) => candidate.canonicalPayload.endpoint_resolution === "matched_batch_candidate",
      ).length,
      relationshipTargetsUnresolved: relationshipCandidates.filter(
        (candidate) => candidate.canonicalPayload.endpoint_resolution === "unresolved",
      ).length,
      recordsWithMultipleContributingSources: records.filter(
        (record) => record.rawPayload._ezparts_provenance.contributing_sources.length > 1,
      ).length,
      occurrenceCandidates: records.reduce(
        (sum, record) => sum + record.candidates.filter(
          (candidate) => candidate.entityType === "part_occurrence",
        ).length,
        0,
      ),
    },
  };
}
