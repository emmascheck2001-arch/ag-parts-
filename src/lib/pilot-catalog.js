const PILOT_URL = "/catalog/three-machine-pilot.json";

let catalogPromise;

export function loadPilotCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch(PILOT_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Pilot catalog failed to load (${response.status})`);
        return response.json();
      })
      .then(indexPilotCatalog);
  }
  return catalogPromise;
}

function byId(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

function indexPilotCatalog(raw) {
  const index = {
    raw,
    manufacturers: byId(raw.manufacturers),
    machineTypes: byId(raw.machineTypes),
    variants: byId(raw.modelVariants),
    systems: byId(raw.systems),
    subsystems: byId(raw.subsystems),
    assemblies: byId(raw.assemblies),
    sections: byId(raw.catalogSections),
    parts: byId(raw.parts),
    partNumbers: byId(raw.partNumbers),
    sourceLocations: byId(raw.sourceLocations),
    numbersByPart: new Map(),
    aliasesByPart: new Map(),
    sectionsByVariant: new Map(),
    occurrencesBySection: new Map(),
  };

  for (const number of raw.partNumbers) index.numbersByPart.set(number.partId, number);
  for (const alias of raw.partNameAliases) {
    const values = index.aliasesByPart.get(alias.partId) || [];
    values.push(alias.alias);
    index.aliasesByPart.set(alias.partId, values);
  }
  for (const section of raw.catalogSections) {
    const values = index.sectionsByVariant.get(section.modelVariantId) || [];
    values.push(section);
    index.sectionsByVariant.set(section.modelVariantId, values);
  }
  for (const occurrence of raw.partOccurrences) {
    const values = index.occurrencesBySection.get(occurrence.catalogSectionId) || [];
    values.push(occurrence);
    index.occurrencesBySection.set(occurrence.catalogSectionId, values);
  }

  index.machines = raw.models.map((model) => {
    const variant = raw.modelVariants.find((value) => value.modelId === model.id);
    const sections = index.sectionsByVariant.get(variant.id) || [];
    const sectionIds = new Set(sections.map((section) => section.id));
    const occurrences = raw.partOccurrences.filter((occurrence) => sectionIds.has(occurrence.catalogSectionId));
    return {
      ...model,
      variantId: variant.id,
      manufacturer: index.manufacturers.get(model.manufacturerId)?.name,
      machineType: index.machineTypes.get(model.machineTypeId)?.name,
      assemblyCount: new Set(sections.map((section) => section.assemblyId)).size,
      occurrenceCount: occurrences.length,
      partCount: new Set(occurrences.map((occurrence) => occurrence.partId)).size,
    };
  });
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
