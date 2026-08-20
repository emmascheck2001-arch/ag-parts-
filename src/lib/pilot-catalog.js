import { pickSourceDocument } from "./machine-manual.js";
import { sortMachinesForMarketFocus } from "./market-focus.js";

const MACHINE_INDEX_URL = "/catalog/verified-machine-index.json";
const MACHINE_CATALOG_DIR = "/catalog/verified-machines";
const SERIAL_INDEX_URL = "/catalog/verified-serial-index.json";

let machineIndexPromise;
let serialIndexPromise;
const machineCatalogPromises = new Map();

export function normalizePilotPartNumber(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function loadPilotMachineIndex() {
  if (!machineIndexPromise) {
    machineIndexPromise = fetch(MACHINE_INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Verified machine index failed to load (${response.status})`);
        return response.json();
      })
      .then((raw) => ({
        raw,
        machines: sortMachinesForMarketFocus(raw.machines || []),
      }))
      .catch((error) => {
        machineIndexPromise = undefined;
        throw error;
      });
  }
  return machineIndexPromise;
}

export function loadPilotCatalog(machineId) {
  if (!machineId) throw new Error("Verified machine ID is required");
  if (!machineCatalogPromises.has(machineId)) {
    machineCatalogPromises.set(
      machineId,
      fetch(`${MACHINE_CATALOG_DIR}/${encodeURIComponent(machineId)}.json`)
        .then((response) => {
          if (!response.ok) throw new Error(`Verified machine catalog failed to load (${response.status})`);
          return response.json();
        })
        .then(indexPilotCatalog)
        .catch((error) => {
          machineCatalogPromises.delete(machineId);
          throw error;
        }),
    );
  }
  return machineCatalogPromises.get(machineId);
}

export function loadPilotSerialIndex() {
  if (!serialIndexPromise) {
    serialIndexPromise = fetch(SERIAL_INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Verified serial index failed to load (${response.status})`);
        return response.json();
      })
      .catch((error) => {
        serialIndexPromise = undefined;
        throw error;
      });
  }
  return serialIndexPromise;
}

function byId(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

function readCatalogArray(raw, field, missingFields) {
  if (Array.isArray(raw?.[field])) return raw[field];
  missingFields.push(field);
  return [];
}

function indexPilotCatalog(raw) {
  const missingFields = [];
  const manufacturers = readCatalogArray(raw, "manufacturers", missingFields);
  const machineTypes = readCatalogArray(raw, "machineTypes", missingFields);
  const modelVariants = readCatalogArray(raw, "modelVariants", missingFields);
  const systems = readCatalogArray(raw, "systems", missingFields);
  const subsystems = readCatalogArray(raw, "subsystems", missingFields);
  const assemblies = readCatalogArray(raw, "assemblies", missingFields);
  const catalogSections = readCatalogArray(raw, "catalogSections", missingFields);
  const parts = readCatalogArray(raw, "parts", missingFields);
  const partNumbers = readCatalogArray(raw, "partNumbers", missingFields);
  const sourceLocations = readCatalogArray(raw, "sourceLocations", missingFields);
  const partNameAliases = readCatalogArray(raw, "partNameAliases", missingFields);
  const partOccurrences = readCatalogArray(raw, "partOccurrences", missingFields);
  const models = readCatalogArray(raw, "models", missingFields);
  const machineRows = Array.isArray(raw?.machineEntries)
    ? raw.machineEntries
    : Array.isArray(raw?.machines)
      ? raw.machines
      : [];

  if (missingFields.length > 0) {
    throw new Error(`Verified machine catalog is missing required array fields: ${missingFields.join(", ")}`);
  }

  const index = {
    raw,
    manufacturers: byId(manufacturers),
    machineTypes: byId(machineTypes),
    variants: byId(modelVariants),
    systems: byId(systems),
    subsystems: byId(subsystems),
    assemblies: byId(assemblies),
    sections: byId(catalogSections),
    parts: byId(parts),
    partNumbers: byId(partNumbers),
    sourceLocations: byId(sourceLocations),
    numbersByPart: new Map(),
    aliasesByPart: new Map(),
    sectionsByVariant: new Map(),
    occurrencesBySection: new Map(),
    machineById: new Map(),
    machineByVariantId: new Map(),
  };

  for (const number of partNumbers) index.numbersByPart.set(number.partId, number);
  for (const alias of partNameAliases) {
    const values = index.aliasesByPart.get(alias.partId) || [];
    values.push(alias.alias);
    index.aliasesByPart.set(alias.partId, values);
  }
  for (const section of catalogSections) {
    const values = index.sectionsByVariant.get(section.modelVariantId) || [];
    values.push(section);
    index.sectionsByVariant.set(section.modelVariantId, values);
  }
  for (const occurrence of partOccurrences) {
    const values = index.occurrencesBySection.get(occurrence.catalogSectionId) || [];
    values.push(occurrence);
    index.occurrencesBySection.set(occurrence.catalogSectionId, values);
  }

  index.machines = machineRows.length
    ? machineRows.map((machine) => {
      const variant = index.variants.get(machine.variantId);
      const model = variant ? models.find((value) => value.id === variant.modelId) : null;
      const derivedManufacturer = machine.manufacturer || index.manufacturers.get(machine.manufacturerId)?.name || "";
      const derivedMachineType = machine.machineType || index.machineTypes.get(machine.machineTypeId)?.name || "";
      const sections = index.sectionsByVariant.get(machine.variantId) || [];
      const sectionIds = new Set(sections.map((section) => section.id));
      const occurrences = partOccurrences.filter((occurrence) => sectionIds.has(occurrence.catalogSectionId));
      const entry = {
        ...machine,
        modelId: machine.modelId || model?.id || null,
        variantId: machine.variantId,
        modelCode: machine.modelCode || model?.modelCode || "",
        displayName: machine.displayName || model?.displayName || "",
        manufacturer: derivedManufacturer,
        machineType: derivedMachineType,
        assemblyCount: machine.assemblyCount ?? new Set(sections.map((section) => section.assemblyId)).size,
        occurrenceCount: machine.occurrenceCount ?? occurrences.length,
        partCount: machine.partCount ?? new Set(occurrences.map((occurrence) => occurrence.partId)).size,
        legacyIds: machine.legacyIds || [],
        // Snapshots exported before the index carried sourceDocument still list
        // the documents at the top level — derive it so the manual link is
        // correct without regenerating every catalog.
        sourceDocument: machine.sourceDocument || pickSourceDocument(raw.sourceDocuments),
      };
      index.machineById.set(entry.id, entry);
      index.machineByVariantId.set(entry.variantId, entry);
      for (const legacyId of entry.legacyIds || []) index.machineById.set(legacyId, entry);
      return entry;
    })
    : models.map((model) => {
      const variant = modelVariants.find((value) => value.modelId === model.id);
      if (!variant) return null;
      const sections = index.sectionsByVariant.get(variant.id) || [];
      const sectionIds = new Set(sections.map((section) => section.id));
      const occurrences = partOccurrences.filter((occurrence) => sectionIds.has(occurrence.catalogSectionId));
      const entry = {
        ...model,
        variantId: variant.id,
        manufacturer: index.manufacturers.get(model.manufacturerId)?.name,
        machineType: index.machineTypes.get(model.machineTypeId)?.name,
        assemblyCount: new Set(sections.map((section) => section.assemblyId)).size,
        occurrenceCount: occurrences.length,
        partCount: new Set(occurrences.map((occurrence) => occurrence.partId)).size,
        legacyIds: [],
      };
      index.machineById.set(entry.id, entry);
      index.machineByVariantId.set(entry.variantId, entry);
      return entry;
    }).filter(Boolean);
  return index;
}

export function expandPilotQuery(value) {
  const aliases = {
    hyd: "hydraulic",
    hydr: "hydraulic",
    assy: "assembly",
    brg: "bearing",
    cyl: "cylinder",
    filt: "filter",
    mtr: "motor",
    pnl: "panel",
    sol: "solenoid",
    strg: "steering",
    whl: "wheel",
  };
  return String(value || "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => aliases[term] || term);
}

export function getPilotScanMatches(index, modelId, scanCandidates = []) {
  if (!index || !modelId || !scanCandidates.length) return [];
  const machine = index.machineById.get(modelId) || index.machines.find((item) => item.id === modelId);
  if (!machine) return [];

  const matchesByNumber = new Map();
  const sections = index.sectionsByVariant.get(machine.variantId) || [];
  for (const section of sections) {
    const assembly = index.assemblies.get(section.assemblyId);
    const subsystem = assembly ? index.subsystems.get(assembly.subsystemId) : null;
    const system = subsystem ? index.systems.get(subsystem.systemId) : null;
    for (const occurrence of index.occurrencesBySection.get(section.id) || []) {
      const part = index.parts.get(occurrence.partId);
      const number = index.numbersByPart.get(occurrence.partId);
      const key = normalizePilotPartNumber(number?.number);
      if (!part || !number || !key || matchesByNumber.has(key)) continue;
      matchesByNumber.set(key, {
        partNumber: number.number,
        description: part.canonicalName || number.number,
        assemblyName: assembly?.name || "",
        subsystemName: subsystem?.name || "",
        systemName: system?.name || "",
      });
    }
  }

  const seen = new Set();
  return scanCandidates.flatMap((candidate) => {
    const key = normalizePilotPartNumber(candidate.part_number);
    const match = matchesByNumber.get(key);
    if (!key || seen.has(key) || !match) return [];
    seen.add(key);
    return [{
      ...candidate,
      part_number: match.partNumber,
      description: match.description,
      assemblyName: match.assemblyName,
      subsystemName: match.subsystemName,
      systemName: match.systemName,
    }];
  });
}
