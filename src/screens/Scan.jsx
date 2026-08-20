import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { estimateHardwareMeasurements, getHardwareMeasureCapabilities } from "../lib/hardware-measure";
import { isHarvestFocusMachine } from "../lib/market-focus";
import { machinePartsFor, searchParts } from "../lib/db";
import { netlifyFunctionUrl } from "../lib/netlify-functions";
import { getPilotScanMatches, loadPilotCatalog, normalizePilotPartNumber } from "../lib/pilot-catalog";
import { buildSearchTermGroups } from "../lib/search-language";

const MAX_PHOTO_EDGE = 1600;
const MAX_ORIGINAL_BYTES = 1_200_000;
const MAX_FALLBACK_READ_BYTES = 4_000_000;
const JPEG_QUALITY = 0.82;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_GUIDED_RESULTS = 12;
const DEFAULT_HINTS = ["Bolt", "Pin", "Nut", "Washer", "Bracket", "Hose"];
const HARDWARE_GUIDE_HINTS = new Set(["Bolt", "Pin", "Nut", "Washer"]);
const MEASUREMENT_REFERENCES = [
  {
    id: "card",
    label: "Card / tag",
    hint: "Best on iPhone. Keep a bank card, license, or calibration tag flat beside the part.",
  },
  {
    id: "ruler",
    label: "Ruler / tape",
    hint: "Best for diameter and length. Keep the ruler flat in the same plane as the part.",
  },
  {
    id: "socket",
    label: "Socket / wrench",
    hint: "Useful when you know the wrench size on the bolt head or nut.",
  },
  {
    id: "coin",
    label: "Coin",
    hint: "Only use for rough size comparison. Final confirmation still matters.",
  },
];
const HARDWARE_HINTS = [
  { label: "Bolt", match: /bolt|capscrew|cap screw|screw|fastener/i },
  { label: "Pin", match: /\bpin\b|roll pin|snap pin|cotter/i },
  { label: "Nut", match: /\bnut\b|locknut|jam nut/i },
  { label: "Washer", match: /washer|shim/i },
  { label: "Bracket", match: /bracket|support|mount|strap|clamp/i },
  { label: "Hose", match: /hose|tube|line|pipe|fitting|coupler|adapter/i },
  { label: "Bearing", match: /bearing|bushing/i },
  { label: "Filter", match: /filter|screen/i },
  { label: "Seal", match: /seal|gasket|o-?ring/i },
  { label: "Belt", match: /\bbelt\b|pulley|sheave/i },
  { label: "Blade", match: /blade|knife|cutter/i },
  { label: "Sensor", match: /sensor|switch|solenoid/i },
];
const HARDWARE_QUERY_HINTS = {
  bolt: "Bolt",
  screw: "Bolt",
  capscrew: "Bolt",
  fastener: "Bolt",
  pin: "Pin",
  cotter: "Pin",
  nut: "Nut",
  washer: "Washer",
  shim: "Washer",
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function tokenizeQuery(value) {
  return normalizeText(value).split(/\s+/).filter(Boolean);
}

function matchesTerms(searchText, query) {
  const groups = buildSearchTermGroups(query);
  if (!groups.length) return true;
  return groups.every((group) => group.some((term) => searchText.includes(term)));
}

function matchesHint(part, hint) {
  if (!hint) return true;
  const definition = HARDWARE_HINTS.find((item) => item.label === hint);
  return definition ? definition.match.test(part.searchText) : true;
}

function buildHintOptions(parts) {
  const ranked = HARDWARE_HINTS
    .map((hint) => ({
      label: hint.label,
      count: parts.reduce((total, part) => total + (hint.match.test(part.searchText) ? 1 : 0), 0),
    }))
    .filter((hint) => hint.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map((hint) => hint.label);
  const ordered = [...ranked, ...DEFAULT_HINTS.filter((label) => !ranked.includes(label))];
  return ordered.slice(0, 6);
}

function measurementReferenceHint(referenceId, hardwareFamily) {
  const reference = MEASUREMENT_REFERENCES.find((item) => item.id === referenceId);
  if (!reference) {
    return "If you can, retake the photo with a ruler, tape, socket, or card beside the part.";
  }
  if (referenceId === "ruler" && hardwareFamily === "Bolt") {
    return "Use the ruler to estimate shank diameter and full bolt length from under the head to the tip.";
  }
  if (referenceId === "socket") {
    return "If the socket or wrench fits the head, enter that size. It can narrow hardware fast.";
  }
  return reference.hint;
}

function detectHardwareFamily(text) {
  if (/\bbolt\b|capscrew|cap screw|\bscrew\b|fastener|rhsn|rhssn/i.test(text)) return "Bolt";
  if (/\bpin\b|roll pin|snap pin|cotter/i.test(text)) return "Pin";
  if (/\bnut\b|locknut|jam nut/i.test(text)) return "Nut";
  if (/washer|shim/i.test(text)) return "Washer";
  return "";
}

function detectHardwareDiameter(text) {
  const metric = text.match(/\bM\s?(\d{1,2})\b/i);
  if (metric) return `M${metric[1]}`;

  const fraction = text.match(/\b(1\/4|5\/16|3\/8|7\/16|1\/2|9\/16|5\/8|3\/4|7\/8|1)\b/);
  if (fraction) return fraction[1];

  const decimal = text.match(/\b(0\.\d{2,3})\s*(?:I\.D\.|ID|O\.D\.|OD|IN\b)/i);
  if (decimal) return decimal[1];
  return "";
}

function detectHardwareLength(text) {
  const match = text.match(/\bx\s*(\d+(?:-\d+\/\d+)?|\d+\/\d+|\d+\.\d+)\s*(in(?:\.|ch(?:es)?)?|mm)\b/i);
  if (!match) return "";
  const unit = /mm/i.test(match[2]) ? "mm" : "in";
  return `${match[1]} ${unit}`;
}

function detectHardwarePitch(text) {
  const metricPitch = text.match(/\bM\s?\d{1,2}\s*x\s*(\d+(?:\.\d+)?)\b/i);
  if (metricPitch) return `${metricPitch[1]} mm`;
  const tpi = text.match(/\b(\d{1,2})\s*TPI\b/i);
  if (tpi) return `${tpi[1]} TPI`;
  if (/\bNC\b|\bUNC\b|\bCOARSE\b/i.test(text)) return "Coarse";
  if (/\bNF\b|\bUNF\b|\bFINE\b/i.test(text)) return "Fine";
  if (/\bM\s?\d{1,2}\b|\bMETRIC\b/i.test(text)) return "Metric";
  return "";
}

function detectHardwareWrench(text) {
  const metric = text.match(/\b(?:AF|WRENCH(?: SIZE)?)\s*(\d{1,2}(?:\.\d+)?)\s*MM\b/i);
  if (metric) return `${metric[1]} mm`;
  const imperial = text.match(/\b(?:AF|WRENCH(?: SIZE)?)\s*(1\/4|5\/16|3\/8|7\/16|1\/2|9\/16|5\/8|11\/16|3\/4|7\/8|15\/16|1)\b/i);
  if (imperial) return imperial[1];
  return "";
}

function detectHardwareHead(text) {
  if (/rhssn|rhsn|carriage/i.test(text)) return "Carriage";
  if (/hex head|\bhex\b/i.test(text)) return "Hex";
  if (/socket|allen/i.test(text)) return "Socket";
  if (/flange/i.test(text)) return "Flange";
  if (/torx/i.test(text)) return "Torx";
  if (/flat head|countersunk|\bcsk\b/i.test(text)) return "Flat";
  if (/button/i.test(text)) return "Button";
  if (/pan head|\bpan\b/i.test(text)) return "Pan";
  if (/round head/i.test(text)) return "Round";
  return "";
}

function extractHardwareMeta(description) {
  const text = String(description || "");
  return {
    family: detectHardwareFamily(text),
    diameter: detectHardwareDiameter(text),
    length: detectHardwareLength(text),
    pitch: detectHardwarePitch(text),
    wrench: detectHardwareWrench(text),
    head: detectHardwareHead(text),
  };
}

function enrichGuidePart(part) {
  const hardwareMeta = extractHardwareMeta(part.description);
  return {
    ...part,
    hardwareMeta,
  };
}

function buildHardwareFieldOptions(parts, field, family) {
  const counts = new Map();
  for (const part of parts) {
    if (family && part.hardwareMeta?.family && part.hardwareMeta.family !== family) continue;
    const value = part.hardwareMeta?.[field];
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

function inferRequestedHardwareFamily(state, results) {
  if (HARDWARE_GUIDE_HINTS.has(state.hint)) return state.hint;
  for (const token of tokenizeQuery(state.query)) {
    if (HARDWARE_QUERY_HINTS[token]) return HARDWARE_QUERY_HINTS[token];
  }
  const families = uniqueBy(
    results.map((part) => part.hardwareMeta?.family).filter(Boolean),
    (family) => family
  );
  return families.length === 1 && HARDWARE_GUIDE_HINTS.has(families[0]) ? families[0] : "";
}

function matchesHardwareFilters(part, state) {
  if (state.hardwareFamily && part.hardwareMeta?.family !== state.hardwareFamily) return false;
  const requested = [
    ["diameter", state.hardwareDiameter],
    ["length", state.hardwareLength],
    ["pitch", state.hardwarePitch],
    ["wrench", state.hardwareWrench],
    ["head", state.hardwareHead],
  ];
  for (const [field, value] of requested) {
    if (!value) continue;
    const desired = normalizeText(value);
    const actual = normalizeText(part.hardwareMeta?.[field] || "");
    if (actual ? !actual.includes(desired) && !desired.includes(actual) : !part.searchText.includes(desired)) {
      return false;
    }
  }
  return true;
}

function aggregateLegacyParts(parts) {
  const map = new Map();
  for (const part of parts) {
    const key = normalizePilotPartNumber(part.pn);
    const current = map.get(key);
    if (current) continue;
    map.set(key, enrichGuidePart({
      part_number: part.pn,
      description: part.name || part.pn,
      category: part.cat || "Other",
      searchText: normalizeText(`${part.pn} ${part.name} ${part.cat}`),
    }));
  }
  return [...map.values()];
}

function buildLegacyGuide(parts) {
  const byCategory = new Map();
  const flatParts = aggregateLegacyParts(parts);
  for (const part of flatParts) {
    const key = part.category || "Other";
    const values = byCategory.get(key) || [];
    values.push(part);
    byCategory.set(key, values);
  }
  const areas = [...byCategory.entries()]
    .map(([id, areaParts]) => ({
      id,
      label: id,
      count: areaParts.length,
      parts: areaParts.sort((a, b) => a.description.localeCompare(b.description)),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return {
    mode: "legacy",
    parts: flatParts,
    areas,
    areaQuestion: "What area of the machine is this part from?",
    areaActionLabel: "machine parts",
  };
}

function buildPilotGuide(index, modelId) {
  const machine = index?.machineById?.get(modelId) || index?.machines.find((item) => item.id === modelId);
  if (!machine) return null;
  const sectionValues = index.sectionsByVariant.get(machine.variantId) || [];
  const systems = new Map();
  const flatParts = [];

  for (const section of sectionValues) {
    const assembly = index.assemblies.get(section.assemblyId);
    const subsystem = assembly ? index.subsystems.get(assembly.subsystemId) : null;
    const system = subsystem ? index.systems.get(subsystem.systemId) : null;
    if (!assembly || !subsystem || !system) continue;
    const systemKey = system.id;
    const assemblyKey = assembly.id;
    const systemEntry = systems.get(systemKey) || {
      id: systemKey,
      label: system.name,
      count: 0,
      parts: [],
      assemblies: new Map(),
    };
    const assemblyEntry = systemEntry.assemblies.get(assemblyKey) || {
      id: assemblyKey,
      label: assembly.name,
      count: 0,
      parts: [],
    };

    for (const occurrence of index.occurrencesBySection.get(section.id) || []) {
      const number = index.numbersByPart.get(occurrence.partId);
      const part = index.parts.get(occurrence.partId);
      if (!number || !part) continue;
      const entry = enrichGuidePart({
        part_number: number.number,
        description: part.canonicalName || number.number,
        category: system.name,
        systemName: system.name,
        subsystemName: subsystem.name,
        assemblyName: assembly.name,
        searchText: normalizeText(`${number.number} ${part.canonicalName} ${system.name} ${subsystem.name} ${assembly.name}`),
      });
      flatParts.push(entry);
      systemEntry.parts.push(entry);
      assemblyEntry.parts.push(entry);
    }

    systemEntry.assemblies.set(assemblyKey, assemblyEntry);
    systems.set(systemKey, systemEntry);
  }

  const areas = [...systems.values()]
    .map((system) => {
      const systemParts = uniqueBy(system.parts, (part) => `${normalizePilotPartNumber(part.part_number)}:${part.assemblyName}`);
      const assemblies = [...system.assemblies.values()]
        .map((assembly) => ({
          id: assembly.id,
          label: assembly.label,
          count: uniqueBy(assembly.parts, (part) => normalizePilotPartNumber(part.part_number)).length,
          parts: uniqueBy(assembly.parts, (part) => normalizePilotPartNumber(part.part_number))
            .sort((a, b) => a.description.localeCompare(b.description)),
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
      return {
        id: system.id,
        label: system.label,
        count: uniqueBy(systemParts, (part) => normalizePilotPartNumber(part.part_number)).length,
        parts: systemParts.sort((a, b) => a.description.localeCompare(b.description)),
        assemblies,
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    mode: "pilot",
    parts: uniqueBy(flatParts, (part) => `${normalizePilotPartNumber(part.part_number)}:${part.assemblyName}`),
    areas,
    areaQuestion: "Which system on the machine is this part from?",
    areaActionLabel: "machine catalog",
  };
}

function getAreaForGuide(guide, areaId) {
  return guide?.areas.find((area) => area.id === areaId) || null;
}

function getAssemblyForArea(area, assemblyId) {
  return area?.assemblies?.find((assembly) => assembly.id === assemblyId) || null;
}

function filterGuidedResults(guide, state) {
  const area = getAreaForGuide(guide, state.areaId);
  const assembly = getAssemblyForArea(area, state.assemblyId);
  const base = assembly?.parts || area?.parts || guide?.parts || [];
  return base.filter((part) =>
    matchesTerms(part.searchText, state.query) &&
    matchesHint(part, state.hint) &&
    matchesHardwareFilters(part, state)
  );
}

function nextGuidedStep(guide, state) {
  const area = getAreaForGuide(guide, state.areaId);
  const assembly = getAssemblyForArea(area, state.assemblyId);
  const results = filterGuidedResults(guide, state);
  const hardwareFamily = state.hardwareFamily || inferRequestedHardwareFamily(state, results);
  const diameterOptions = buildHardwareFieldOptions(results, "diameter", hardwareFamily);
  const lengthOptions = buildHardwareFieldOptions(results, "length", hardwareFamily);
  const pitchOptions = buildHardwareFieldOptions(results, "pitch", hardwareFamily);
  const wrenchOptions = buildHardwareFieldOptions(results, "wrench", hardwareFamily);
  const headOptions = buildHardwareFieldOptions(results, "head", hardwareFamily);

  if (!state.areaId) {
    return {
      kind: "area",
      title: "Start with machine location",
      body: guide.areaQuestion,
      options: guide.areas,
    };
  }

  if (
    guide.mode === "pilot" &&
    area &&
    area.assemblies?.length > 1 &&
    !state.assemblyId &&
    results.length > MAX_GUIDED_RESULTS
  ) {
    return {
      kind: "assembly",
      title: "Narrow to the assembly",
      body: `We still have a lot of parts in ${area.label}. Which assembly did it come from?`,
      options: area.assemblies,
    };
  }

  if (!state.query && !state.hint && results.length > MAX_GUIDED_RESULTS) {
    return {
      kind: "identify",
      title: "What kind of part is it?",
      body: `There are still ${results.length} parts in this ${assembly ? "assembly" : "area"}. Tell us what it looks like or choose the closest type.`,
      hintOptions: buildHintOptions(results),
      count: results.length,
    };
  }

  if (
    hardwareFamily &&
    results.length > 1 &&
    !state.hardwareStepSkipped &&
    (
      (!state.hardwareDiameter && diameterOptions.length > 1) ||
      (!state.hardwareLength && lengthOptions.length > 0) ||
      (!state.hardwarePitch && pitchOptions.length > 0) ||
      (!state.hardwareWrench && wrenchOptions.length > 0) ||
      (!state.hardwareHead && headOptions.length > 1)
    )
  ) {
    return {
      kind: "hardware",
      title: `${hardwareFamily} details`,
      body: `Use what you can see on the ${hardwareFamily.toLowerCase()} to narrow it down. Answer any detail you know.`,
      hardwareFamily,
      diameterOptions,
      lengthOptions,
      pitchOptions,
      wrenchOptions,
      headOptions,
      count: results.length,
    };
  }

  if (results.length > MAX_GUIDED_RESULTS) {
    return {
      kind: "more-detail",
      title: "Need one more detail",
      body: `We still have ${results.length} possible parts. Add one more word like bolt, bracket, hose, left, or lower.`,
      hintOptions: buildHintOptions(results),
      count: results.length,
    };
  }

  return {
    kind: "results",
    title: results.length ? "Closest matches on this machine" : "No catalog match yet",
    body: results.length
      ? "Pick the part that looks closest. If none fit, try another photo or go back to browse the machine."
      : "That combination still did not narrow to a match. Try a different area or add a different detail.",
    results,
  };
}

const HARDWARE_FIELD_CONFIG = [
  {
    stateKey: "hardwareDiameter",
    optionsKey: "diameterOptions",
    label: "Diameter",
    placeholder: "e.g. 3/8 or M10",
    showMeasurement: true,
    hint: "Best first detail for bolts, nuts, and washers.",
  },
  {
    stateKey: "hardwareLength",
    optionsKey: "lengthOptions",
    label: "Length",
    placeholder: "e.g. 2 in or 50 mm",
    showMeasurement: true,
    hint: "Use full bolt length from under the head to the tip when you can.",
  },
  {
    stateKey: "hardwarePitch",
    optionsKey: "pitchOptions",
    label: "Thread pitch",
    placeholder: "e.g. coarse, fine, 1.5 mm, 13 TPI",
    hint: "Use coarse/fine or exact pitch if you know it.",
  },
  {
    stateKey: "hardwareWrench",
    optionsKey: "wrenchOptions",
    label: "Wrench size",
    placeholder: "e.g. 3/4 or 19 mm",
    hint: "Useful if you know the socket or wrench that fits.",
  },
  {
    stateKey: "hardwareHead",
    optionsKey: "headOptions",
    label: "Head style",
    placeholder: "",
    chipsOnly: true,
    hint: "Pick the head style if it is obvious.",
  },
];

function getActiveHardwareField(step, state) {
  if (!step || step.kind !== "hardware") return null;
  for (const field of HARDWARE_FIELD_CONFIG) {
    const options = step[field.optionsKey] || [];
    const hasValue = Boolean(state[field.stateKey]);
    const shouldAsk = field.stateKey === "hardwareHead"
      ? !hasValue && options.length > 1
      : !hasValue && options.length > 0;
    if (shouldAsk) return { ...field, options };
  }
  return null;
}

function createEmptyGuidedState() {
  return {
    areaId: "",
    assemblyId: "",
    query: "",
    hint: "",
    hardwareFamily: "",
    hardwareDiameter: "",
    hardwareLength: "",
    hardwarePitch: "",
    hardwareWrench: "",
    hardwareHead: "",
    hardwareStepSkipped: false,
    measurementReference: "",
  };
}

function clearGuidedDetails(current) {
  return {
    ...current,
    query: "",
    hint: "",
    hardwareFamily: "",
    hardwareDiameter: "",
    hardwareLength: "",
    hardwarePitch: "",
    hardwareWrench: "",
    hardwareHead: "",
    hardwareStepSkipped: false,
  };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed"));
    image.src = url;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function scaleToFit(width, height, maxEdge) {
  if (!width || !height) return { width, height };
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function optimizePhoto(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const { width, height } = scaleToFit(sourceWidth, sourceHeight, MAX_PHOTO_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const preview = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const data = preview.split(",")[1] || "";
    if (!data) throw new Error("No optimized image data");
    return {
      data,
      mediaType: "image/jpeg",
      name: file.name,
      preview,
      optimized:
        file.size > MAX_ORIGINAL_BYTES ||
        width !== sourceWidth ||
        height !== sourceHeight ||
        !/^image\/jpe?g$/i.test(file.type || ""),
    };
  } catch (error) {
    console.warn("Photo optimization skipped", error);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  if (file.size > MAX_FALLBACK_READ_BYTES) {
    throw new Error("Image too large to process on this device");
  }

  const preview = await fileToDataUrl(file);
  const data = preview.split(",")[1] || "";
  if (!data) throw new Error("No image data");
  return {
    data,
    mediaType: file.type || "image/jpeg",
    name: file.name,
    preview,
    optimized: false,
  };
}

function dedupeCandidates(candidates = []) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = normalizePilotPartNumber(candidate?.part_number);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function candidateSummary(candidates = []) {
  return candidates.map((candidate) => candidate.part_number).filter(Boolean).slice(0, 3).join(", ");
}

function candidateContextLabel(candidate) {
  return [candidate.assemblyName, candidate.subsystemName, candidate.systemName, candidate.category]
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
}

async function matchLegacyCandidate(machineName, candidate) {
  const results = await searchParts(candidate.part_number, 20);
  const key = normalizePilotPartNumber(candidate.part_number);
  const exact = results.find((part) =>
    normalizePilotPartNumber(part.pn) === key &&
    (part.fitment || []).some((fitment) => fitment.machine === machineName)
  );
  if (!exact) return null;
  return {
    ...candidate,
    part_number: exact.pn,
    description: exact.name || candidate.part_description || exact.pn,
    category: exact.cat || "",
  };
}

// Snap (or upload) a photo of a part or its tag/label. Claude vision reads the
// part number off it, then we drop the farmer straight into search results.
// Uses the same extract-fitment function the dealer catalog importer uses.
export function Scan({ machineName, scanContext, onBack, onDetected }) {
  const [file, setFile] = useState(null); // { data, mediaType, name, preview }
  const [measurementPhoto, setMeasurementPhoto] = useState(null); // { data, mediaType, name, preview }
  const [preparing, setPreparing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [fallbackPrompt, setFallbackPrompt] = useState(null);
  const [guidedGuide, setGuidedGuide] = useState(null);
  const [guidedLoading, setGuidedLoading] = useState(false);
  const [measurementBusy, setMeasurementBusy] = useState(false);
  const [measurementNote, setMeasurementNote] = useState("");
  const [measureCapabilities, setMeasureCapabilities] = useState(null);
  const [guidedState, setGuidedState] = useState(createEmptyGuidedState);

  const loadGuidedGuide = async () => {
    if (guidedGuide) return guidedGuide;
    let nextGuide = null;
    if (scanContext?.type === "pilot" && scanContext?.modelId) {
      const index = await loadPilotCatalog(scanContext.modelId);
      nextGuide = buildPilotGuide(index, scanContext.modelId);
    } else {
      const machineParts = await machinePartsFor(machineName, 3000);
      nextGuide = buildLegacyGuide(machineParts);
    }
    setGuidedGuide(nextGuide);
    return nextGuide;
  };

  const loadMeasurementCapabilities = async () => {
    if (measureCapabilities) return measureCapabilities;
    const capabilities = await getHardwareMeasureCapabilities();
    setMeasureCapabilities(capabilities);
    return capabilities;
  };

  const openFallbackPrompt = async (prompt) => {
    setFallbackPrompt(prompt);
    setGuidedLoading(true);
    setMeasurementNote("");
    setGuidedState(createEmptyGuidedState());
    try {
      await loadGuidedGuide();
      await loadMeasurementCapabilities();
    } catch (reason) {
      console.error("Guided fallback failed to load", reason);
    } finally {
      setGuidedLoading(false);
    }
  };

  const closeFallbackPrompt = () => {
    setFallbackPrompt(null);
    setMeasurementNote("");
    setGuidedState(createEmptyGuidedState());
    setMeasurementPhoto(null);
  };

  const onFile = async (e) => {
    const input = e.target;
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setCandidates([]);
    closeFallbackPrompt();
    setPreparing(true);
    try {
      setFile(await optimizePhoto(f));
    } catch (reason) {
      console.error("Photo preparation failed", reason);
      setFile(null);
      setError("We couldn't prepare that photo. Try a clear JPG or PNG image instead.");
    } finally {
      setPreparing(false);
      input.value = "";
    }
  };

  const onMeasurementPhoto = async (e) => {
    const input = e.target;
    const f = e.target.files?.[0];
    if (!f) return;
    setPreparing(true);
    try {
      setMeasurementPhoto(await optimizePhoto(f));
    } catch (reason) {
      console.error("Reference photo preparation failed", reason);
      setMeasurementPhoto(null);
      setError("We couldn't prepare that reference photo. Try a clear JPG or PNG image instead.");
    } finally {
      setPreparing(false);
      input.value = "";
    }
  };

  const estimateFromReferencePhoto = async () => {
    if (!measurementPhoto?.data) {
      setMeasurementNote("Add a reference photo first.");
      return;
    }
    if (!guidedState.measurementReference) {
      setMeasurementNote("Choose the reference object you placed beside the part.");
      return;
    }

    setMeasurementBusy(true);
    setMeasurementNote("");
    try {
      const result = await estimateHardwareMeasurements({
        measurementPhoto,
        referenceType: guidedState.measurementReference,
        machineName,
        hardwareFamily: guidedState.hardwareFamily || guidedState.hint,
        areaLabel: guidedArea?.label,
        assemblyLabel: guidedAssembly?.label,
      });
      setMeasurementNote(result.notes || `Estimated from ${result.provider}. Confirm or adjust before picking the part.`);
      setGuidedState((current) => ({
        ...current,
        hardwareFamily: current.hardwareFamily || current.hint,
        hardwareDiameter: result.estimates?.diameter || current.hardwareDiameter,
        hardwareLength: result.estimates?.length || current.hardwareLength,
        hardwarePitch: result.estimates?.pitch || current.hardwarePitch,
        hardwareWrench: result.estimates?.wrench || current.hardwareWrench,
        hardwareHead: result.estimates?.head_style || current.hardwareHead,
        hardwareStepSkipped: false,
      }));
    } catch (reason) {
      console.error("Hardware measurement estimate failed", reason);
      setMeasurementNote(reason.message || "We couldn't estimate measurements from that photo.");
    } finally {
      setMeasurementBusy(false);
    }
  };

  const read = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setCandidates([]);
    closeFallbackPrompt();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(netlifyFunctionUrl("extract-fitment"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          data: file.data,
          mediaType: file.mediaType,
          mode: "part-photo",
          machineName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "HTTP " + res.status);
      if (json.configured === false) {
        setError("Photo recognition isn't switched on yet. Type the part number in the selected machine search instead.");
        return;
      }
      const readableCandidates = dedupeCandidates(
        (json.candidates || []).filter((candidate) => ["high", "medium"].includes(candidate.confidence))
      );
      if (!readableCandidates.length) {
        setError("We couldn't confidently read a part number. Move closer to the stamped number, wipe away dirt if possible, and try again.");
        await openFallbackPrompt({
          title: "Need more than the photo",
          body: `We couldn't read a usable part number from this ${machineName} photo. If this is unmarked hardware, use the machine catalog to narrow it down by location.`,
        });
        return;
      }
      let matchedCandidates = [];
      if (scanContext?.type === "pilot" && scanContext?.modelId) {
        const index = await loadPilotCatalog(scanContext.modelId);
        matchedCandidates = getPilotScanMatches(index, scanContext.modelId, readableCandidates);
      } else {
        matchedCandidates = (await Promise.all(
          readableCandidates.map((candidate) => matchLegacyCandidate(machineName, candidate))
        )).filter(Boolean);
      }
      if (!matchedCandidates.length) {
        const numbers = candidateSummary(readableCandidates);
        setError(
          numbers
            ? `We read ${numbers}, but none matched ${machineName}'s catalog. Try another photo or type the part number manually.`
            : `We couldn't match that photo to ${machineName}'s catalog. Try another photo or type the part number manually.`
        );
        await openFallbackPrompt({
          title: "Photo alone wasn't enough",
          body: `We need location context on ${machineName} to narrow this down. Open the machine catalog and browse the area or assembly this part came from.`,
        });
        return;
      }
      setCandidates(matchedCandidates);
    } catch (e) {
      console.error("Part photo scan failed", e);
      setError(
        e?.name === "AbortError"
          ? "Photo recognition timed out. Check your signal and try again."
          : "Photo recognition couldn't connect. Check your signal and try again."
      );
      await openFallbackPrompt({
        title: "Try the machine catalog instead",
        body: `If the photo still won't resolve, go back to ${machineName} and search or browse the part by where it sits on the machine.`,
      });
    } finally {
      window.clearTimeout(timeoutId);
      setBusy(false);
    }
  };

  const guidedStep = fallbackPrompt && guidedGuide
    ? nextGuidedStep(guidedGuide, guidedState)
    : null;

  const guidedArea = getAreaForGuide(guidedGuide, guidedState.areaId);
  const guidedAssembly = getAssemblyForArea(guidedArea, guidedState.assemblyId);
  const currentHardwareField = getActiveHardwareField(guidedStep, guidedState);
  const harvestFocus = isHarvestFocusMachine({ displayName: machineName, machineType: machineName, manufacturer: machineName });
  const resultIntro = candidates.length === 1
    ? `We found one verified match on ${machineName}. Open it if the part number matches your photo.`
    : `We matched this photo against ${machineName}. Pick the exact part number you photographed.`;

  return (
    <div className="screen active">
      <TopBar title="Find Part from Photo" onBack={onBack} />
      <div className="scroll">
        <div className="scan-screen">
          <div className="scan-machine-context">
            <span>Machine selected</span>
            <strong>{machineName}</strong>
            <small>Photo results stay limited to parts for this machine.</small>
          </div>
          <ScanCaptureCard
            busy={busy}
            candidates={candidates}
            error={error}
            file={file}
            harvestFocus={harvestFocus}
            onDetected={onDetected}
            onFile={onFile}
            onRead={read}
            preparing={preparing}
            resultIntro={resultIntro}
          />
          <div className="scan-tip">
            💡 <strong>Tip:</strong> the part number is usually stamped on the part or printed on a
            sticker like <span>RE509672</span>. If the photo fails, open the exact assembly first.
          </div>
        </div>
      </div>

      {fallbackPrompt && (
        <ScanFallbackModal
          closeFallbackPrompt={closeFallbackPrompt}
          currentHardwareField={currentHardwareField}
          fallbackPrompt={fallbackPrompt}
          guidedArea={guidedArea}
          guidedAssembly={guidedAssembly}
          guidedGuide={guidedGuide}
          guidedLoading={guidedLoading}
          guidedState={guidedState}
          guidedStep={guidedStep}
          machineName={machineName}
          measureCapabilities={measureCapabilities}
          measurementBusy={measurementBusy}
          measurementNote={measurementNote}
          measurementPhoto={measurementPhoto}
          onBack={onBack}
          onDetected={onDetected}
          onMeasurementPhoto={onMeasurementPhoto}
          onSetGuidedState={setGuidedState}
          estimateFromReferencePhoto={estimateFromReferencePhoto}
          measurementReferenceHint={measurementReferenceHint}
          preparing={preparing}
        />
      )}
    </div>
  );
}

function ScanCaptureCard({
  busy,
  candidates,
  error,
  file,
  harvestFocus,
  onDetected,
  onFile,
  onRead,
  preparing,
  resultIntro,
}) {
  return (
    <div className="card scan-card">
      <div className="scan-card__icon" aria-hidden="true">📷</div>
      <h3 className="scan-card__title">Photograph the part or its tag</h3>
      <p className="scan-card__copy">
        {harvestFocus
          ? "Take a clear photo of the stamped number or tag on the MacDon / header / draper part."
          : "Take a clear photo of the stamped number or tag on the part."}
        {" "}We&apos;ll keep the result inside the selected machine catalog.
      </p>

      <label
        className="btn-primary scan-card__upload"
        data-disabled={busy || preparing ? "true" : "false"}
      >
        {preparing ? "Preparing photo…" : file ? "Choose a different photo" : "Take / choose photo"}
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          disabled={busy || preparing}
          className="sr-only"
        />
      </label>

      {file?.preview && (
        <img
          src={file.preview}
          alt="Part to scan"
          className="scan-card__preview"
        />
      )}

      {file && (
        <button
          className="btn-primary scan-card__submit"
          onClick={onRead}
          disabled={busy || preparing}
        >
          {busy ? "Reading the photo…" : "Find this part"}
        </button>
      )}

      {candidates.length > 0 && (
        <ScanCandidatePanel
          candidates={candidates}
          onDetected={onDetected}
          resultIntro={resultIntro}
        />
      )}

      {error && <div className="scan-card__error">{error}</div>}
    </div>
  );
}

function ScanCandidatePanel({ candidates, onDetected, resultIntro }) {
  return (
    <div className="scan-match-panel">
      <div className="scan-match-panel__eyebrow">
        {candidates.length === 1 ? "Verified match" : "Confirm the part number"}
      </div>
      <div className="scan-match-panel__intro">{resultIntro}</div>
      <div className="scan-match-panel__list">
        {candidates.map((candidate) => (
          <button
            key={candidate.part_number}
            className="scan-match-card"
            onClick={() => onDetected && onDetected(candidate.part_number.trim())}
          >
            <div className="scan-match-card__head">
              <strong>{candidate.part_number}</strong>
              <span>{candidates.length === 1 ? "Open" : candidate.confidence}</span>
            </div>
            <div className="scan-match-card__body">
              {candidate.description || candidate.part_description || "Catalog match"}
            </div>
            {candidateContextLabel(candidate) && (
              <div className="scan-match-card__meta">{candidateContextLabel(candidate)}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScanFallbackModal({
  closeFallbackPrompt,
  currentHardwareField,
  estimateFromReferencePhoto,
  fallbackPrompt,
  guidedArea,
  guidedAssembly,
  guidedGuide,
  guidedLoading,
  guidedState,
  guidedStep,
  machineName,
  measureCapabilities,
  measurementBusy,
  measurementNote,
  measurementPhoto,
  measurementReferenceHint,
  onBack,
  onDetected,
  onMeasurementPhoto,
  onSetGuidedState,
  preparing,
}) {
  const detailSummary = [
    guidedArea?.label,
    guidedAssembly?.label,
    guidedState.hint,
    guidedState.hardwareDiameter,
    guidedState.hardwareLength,
    guidedState.hardwarePitch,
    guidedState.hardwareWrench,
    guidedState.hardwareHead,
    guidedState.query,
  ].filter(Boolean).join(" · ");
  const hasDetailSummary = Boolean(detailSummary);

  return (
    <div className="scan-sheet-backdrop">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={fallbackPrompt.title}
        className="scan-sheet"
      >
        <div className="scan-sheet__eyebrow">Scan fallback</div>
        <div className="scan-sheet__title">{fallbackPrompt.title}</div>
        <div className="scan-sheet__copy">{fallbackPrompt.body}</div>
        {guidedLoading && <div className="scan-sheet__loading">Loading parts from {machineName}…</div>}
        {!guidedLoading && guidedStep && (
          <div className="scan-sheet__body">
            <div className="scan-sheet__section-label">Guided fallback</div>
            <div className="scan-sheet__step-title">{guidedStep.title}</div>
            <div className="scan-sheet__step-copy">{guidedStep.body}</div>

            {hasDetailSummary && <div className="scan-sheet__summary">{detailSummary}</div>}

            {hasDetailSummary && (
              <div className="scan-sheet__chips">
                {guidedArea && (
                  <button
                    className="scan-chip scan-chip--ghost"
                    onClick={() => onSetGuidedState(createEmptyGuidedState())}
                  >
                    Change area
                  </button>
                )}
                {guidedAssembly && (
                  <button
                    className="scan-chip scan-chip--ghost"
                    onClick={() => onSetGuidedState((current) => ({
                      ...clearGuidedDetails(current),
                      assemblyId: "",
                      measurementReference: "",
                    }))}
                  >
                    Change assembly
                  </button>
                )}
                {(guidedState.query || guidedState.hint || guidedState.hardwareDiameter || guidedState.hardwareLength || guidedState.hardwarePitch || guidedState.hardwareWrench || guidedState.hardwareHead) && (
                  <button
                    className="scan-chip scan-chip--ghost"
                    onClick={() => onSetGuidedState((current) => ({
                      ...clearGuidedDetails(current),
                      measurementReference: current.measurementReference,
                    }))}
                  >
                    Clear detail
                  </button>
                )}
              </div>
            )}

            {guidedStep.kind === "area" && (
              <div className="scan-choice-list">
                {guidedStep.options.map((option) => (
                  <button
                    key={option.id}
                    className="scan-choice-card"
                    onClick={() => onSetGuidedState({
                      ...createEmptyGuidedState(),
                      areaId: option.id,
                    })}
                  >
                    <strong>{option.label}</strong>
                    <div>{option.count} catalogued parts</div>
                  </button>
                ))}
              </div>
            )}

            {guidedStep.kind === "assembly" && (
              <div className="scan-choice-list">
                {guidedStep.options.map((option) => (
                  <button
                    key={option.id}
                    className="scan-choice-card"
                    onClick={() => onSetGuidedState((current) => ({
                      ...clearGuidedDetails(current),
                      assemblyId: option.id,
                    }))}
                  >
                    <strong>{option.label}</strong>
                    <div>{option.count} likely parts</div>
                  </button>
                ))}
              </div>
            )}

            {(guidedStep.kind === "identify" || guidedStep.kind === "more-detail") && (
              <div className="scan-input-block">
                <input
                  value={guidedState.query}
                  onChange={(event) => onSetGuidedState((current) => ({
                    ...current,
                    query: event.target.value,
                    hardwareStepSkipped: false,
                  }))}
                  placeholder="Type a detail like bolt, bracket, hose, left, lower"
                  className="scan-text-input"
                />
                <div className="scan-sheet__chips">
                  {guidedStep.hintOptions.map((hint) => (
                    <button
                      key={hint}
                      className={`scan-chip${guidedState.hint === hint ? " is-active" : ""}`}
                      onClick={() => onSetGuidedState((current) => ({
                        ...clearGuidedDetails(current),
                        hint: current.hint === hint ? "" : hint,
                        hardwareFamily: current.hint === hint ? "" : hint,
                        measurementReference: current.measurementReference,
                      }))}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {guidedStep.kind === "hardware" && (
              <div className="scan-hardware-block">
                {currentHardwareField && (
                  <div className="scan-hardware-card">
                    <div className="scan-sheet__section-label scan-sheet__section-label--accent">One detail at a time</div>
                    <div className="scan-hardware-card__title">{currentHardwareField.label}</div>
                    <div className="scan-hardware-card__copy">{currentHardwareField.hint}</div>

                    {currentHardwareField.showMeasurement && (
                      <div className="scan-measure-card">
                        <div className="scan-sheet__section-label scan-sheet__section-label--accent">Need help sizing it?</div>
                        <div className="scan-hardware-card__copy">Add one more photo with a card, ruler, socket, or coin beside the part.</div>
                        {measureCapabilities && (
                          <div className="scan-measure-card__note">
                            {measureCapabilities.supportsOnDeviceSizing
                              ? "Card references try on-device sizing first on iPhone."
                              : "This build uses the server estimator for sizing right now."}
                          </div>
                        )}
                        <div className="scan-sheet__chips">
                          {MEASUREMENT_REFERENCES.map((reference) => (
                            <button
                              key={reference.id}
                              className={`scan-chip${guidedState.measurementReference === reference.id ? " is-active" : ""}`}
                              onClick={() => onSetGuidedState((current) => ({
                                ...current,
                                measurementReference: current.measurementReference === reference.id ? "" : reference.id,
                                hardwareStepSkipped: false,
                              }))}
                            >
                              {reference.label}
                            </button>
                          ))}
                        </div>
                        <label
                          className="btn-primary scan-card__upload"
                          data-disabled={preparing ? "true" : "false"}
                        >
                          {measurementPhoto ? "Replace reference photo" : "Take / choose reference photo"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={onMeasurementPhoto}
                            disabled={preparing}
                            className="sr-only"
                          />
                        </label>
                        {measurementPhoto?.preview && (
                          <img
                            src={measurementPhoto.preview}
                            alt="Reference photo for measuring hardware"
                            className="scan-card__preview scan-card__preview--small"
                          />
                        )}
                        <div className="scan-measure-card__note">
                          {measurementReferenceHint(guidedState.measurementReference, guidedStep.hardwareFamily)}
                        </div>
                        <button
                          className="btn-primary scan-card__submit"
                          onClick={estimateFromReferencePhoto}
                          disabled={measurementBusy || !measurementPhoto || !guidedState.measurementReference}
                        >
                          {measurementBusy ? "Estimating measurements…" : `Estimate ${currentHardwareField.label.toLowerCase()} from photo`}
                        </button>
                        {measurementNote && <div className="scan-measure-card__note">{measurementNote}</div>}
                      </div>
                    )}

                    {!currentHardwareField.chipsOnly && (
                      <input
                        value={guidedState[currentHardwareField.stateKey]}
                        onChange={(event) => onSetGuidedState((current) => ({
                          ...current,
                          hardwareFamily: guidedStep.hardwareFamily,
                          [currentHardwareField.stateKey]: event.target.value,
                          hardwareStepSkipped: false,
                        }))}
                        placeholder={currentHardwareField.placeholder}
                        className="scan-text-input"
                      />
                    )}

                    {currentHardwareField.options.length > 0 && (
                      <div className="scan-sheet__chips">
                        {currentHardwareField.options.map((option) => (
                          <button
                            key={option.label}
                            className={`scan-chip${guidedState[currentHardwareField.stateKey] === option.label ? " is-active" : ""}`}
                            onClick={() => onSetGuidedState((current) => ({
                              ...current,
                              hardwareFamily: guidedStep.hardwareFamily,
                              [currentHardwareField.stateKey]: current[currentHardwareField.stateKey] === option.label ? "" : option.label,
                              hardwareStepSkipped: false,
                            }))}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="scan-secondary-button"
                  onClick={() => onSetGuidedState((current) => ({ ...current, hardwareStepSkipped: true }))}
                >
                  Skip this detail
                </button>
              </div>
            )}

            {guidedStep.kind === "results" && guidedStep.results.length > 0 && (
              <div className="scan-choice-list">
                {guidedStep.results.map((result) => (
                  <button
                    key={`${result.part_number}:${result.assemblyName || result.category || "part"}`}
                    className="scan-choice-card"
                    onClick={() => onDetected && onDetected(result.part_number.trim())}
                  >
                    <strong>{result.part_number}</strong>
                    <div className="scan-choice-card__body">{result.description}</div>
                    <div>{[result.systemName, result.subsystemName, result.assemblyName, result.category].filter(Boolean).join(" · ")}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="scan-sheet__actions">
          <button
            className="btn-primary scan-sheet__primary"
            onClick={onBack}
          >
            Open {guidedGuide?.areaActionLabel || "machine catalog"}
          </button>
          <button
            className="scan-secondary-button"
            onClick={closeFallbackPrompt}
          >
            Try another photo
          </button>
        </div>
      </div>
    </div>
  );
}
