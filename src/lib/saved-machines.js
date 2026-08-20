// One shape for a saved machine, whichever catalog it came from.
//
// The app has two machine sources: the verified catalog (stable model IDs,
// source-backed part counts) and the older browse index (display-name identity).
// Before this module every screen branched on which one it was holding, using
// different field names for the same idea. Screens should use SavedMachine and
// never branch again.
//
// SavedMachine:
//   key         stable React key, unique across both sources
//   kind        'verified' | 'legacy'      (routing only — never for labels)
//   ref         what onSelect needs: model ID (verified) or machine name (legacy)
//   name        the line a farmer reads first (nickname when they set one)
//   subtitle    the model name, only when `name` is a nickname
//   meta        machine type, plus location when known
//   detail      the part-count line
//   machineType for the type filter
//   searchText  pre-lowercased haystack for the search box
//   sortKey     recency for verified machines, empty for legacy
import { isHarvestFocusMachine } from "./market-focus";

function verifiedSavedMachine(saved, machine) {
  const nickname = saved.nickname?.trim();
  const focusNote = isHarvestFocusMachine(machine) ? " · harvest focus" : "";
  return {
    key: `verified:${machine.id}`,
    kind: "verified",
    ref: machine.id,
    name: nickname || machine.displayName,
    subtitle: nickname ? machine.displayName : "",
    meta: `${machine.machineType}${saved.location ? ` · ${saved.location}` : ""}`,
    detail: `${machine.partCount.toLocaleString()} verified parts · ${machine.assemblyCount} assemblies${focusNote}`,
    machineType: machine.machineType,
    searchText: [nickname, saved.location, machine.displayName, machine.manufacturer, machine.machineType]
      .filter(Boolean).join(" ").toLowerCase(),
    sortKey: String(saved.lastUsedAt || ""),
  };
}

function legacySavedMachine(machine) {
  const machineType = machine.ty || "Machine";
  return {
    key: `legacy:${machine.nm}`,
    kind: "legacy",
    ref: machine.nm,
    name: machine.nm,
    subtitle: "",
    meta: machineType,
    detail: `${(machine.count || 0).toLocaleString()} catalogued parts · legacy index`,
    machineType,
    searchText: [machine.nm, machine.make, machine.model, machine.ty]
      .filter(Boolean).join(" ").toLowerCase(),
    sortKey: "",
  };
}

/**
 * Build the saved-machine list. Verified machines sort first (most recently used
 * first), then legacy machines alphabetically. The active machine leads.
 *
 * @param verifiedFleet saved rows from lib/fleet getVerifiedFleet()
 * @param legacyFleet   machine names from lib/fleet getFleet()
 * @param catalogMachines verified catalog machines (may be empty while loading)
 * @param lookupLegacy  name -> legacy machine record
 * @param activeRef     the machine currently in use, if any
 */
export function buildSavedMachines({
  verifiedFleet = [],
  legacyFleet = [],
  catalogMachines = [],
  lookupLegacy = () => null,
  activeRef = null,
}) {
  const byId = new Map(catalogMachines.map((machine) => [machine.id, machine]));

  const verified = verifiedFleet
    .map((saved) => {
      const machine = byId.get(saved.modelId);
      return machine ? verifiedSavedMachine(saved, machine) : null;
    })
    .filter(Boolean);

  const legacy = legacyFleet
    .map((name) => lookupLegacy(name))
    .filter(Boolean)
    .map(legacySavedMachine);

  return [...verified, ...legacy].sort((a, b) => {
    if (a.ref === activeRef && a.kind === "verified") return -1;
    if (b.ref === activeRef && b.kind === "verified") return 1;
    if (a.kind !== b.kind) return a.kind === "verified" ? -1 : 1;
    if (a.kind === "verified") return b.sortKey.localeCompare(a.sortKey);
    return a.name.localeCompare(b.name);
  });
}

export function machineTypesOf(savedMachines) {
  return [...new Set(savedMachines.map((saved) => saved.machineType).filter(Boolean))].sort();
}

function normalizeLabel(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Machines saved before the verified catalog existed are stored by display name.
 * When one of those names now matches a verified machine, open the verified
 * catalog instead — it has diagrams and source-backed part numbers.
 *
 * @returns the verified machine ID, or null when there is no match.
 */
export function findVerifiedMatch(machineName, catalogMachines = []) {
  const target = normalizeLabel(machineName);
  if (!target) return null;

  for (const machine of catalogMachines) {
    const labels = [
      machine.displayName,
      machine.modelCode,
      `${machine.manufacturer} ${machine.displayName}`,
      `${machine.manufacturer} ${machine.modelCode}`,
      ...(machine.legacyIds || []),
    ];
    if (labels.some((label) => normalizeLabel(label) === target)) return machine.id;
  }
  return null;
}
