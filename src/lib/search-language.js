const SEARCH_STOP_WORDS = new Set([
  "a",
  "all",
  "an",
  "any",
  "are",
  "at",
  "from",
  "for",
  "find",
  "get",
  "have",
  "help",
  "i",
  "im",
  "i'm",
  "in",
  "it",
  "just",
  "like",
  "looking",
  "me",
  "my",
  "need",
  "on",
  "of",
  "one",
  "part",
  "parts",
  "please",
  "some",
  "show",
  "that",
  "the",
  "this",
  "to",
  "with",
  "want",
  "what",
]);

const SYNONYM_SETS = [
  ["blade", "blades", "knife", "knives", "sickle", "section", "sections", "segment", "segmented", "cutter", "cutterbar"],
  ["bolt", "bolts", "capscrew", "capscrews", "screw", "screws", "fastener", "fasteners", "rhsn", "rhssn"],
  ["pin", "pins", "cotter", "cotterpin", "snap", "rollpin", "linchpin", "clevispin"],
  ["nut", "nuts", "locknut", "locknuts", "jamnut", "jamnuts", "jam"],
  ["washer", "washers", "shim", "shims"],
  ["guard", "guards", "ledger", "ledgers"],
  ["holddown", "holddowns", "clip", "clips", "keeper", "keepers"],
  ["belt", "belts", "draper", "drapers", "canvas", "canvases"],
  ["hose", "hoses", "line", "lines", "tube", "tubes", "pipe", "pipes"],
  ["fitting", "fittings", "adapter", "adapters", "coupler", "couplers", "connector", "connectors"],
  ["filter", "filters", "screen", "screens"],
  ["bearing", "bearings", "bushing", "bushings"],
  ["seal", "seals", "gasket", "gaskets", "oring", "orings"],
  ["sensor", "sensors", "switch", "switches", "solenoid", "solenoids"],
  ["pickup", "pickups", "reel", "reels"],
  ["finger", "fingers", "tine", "tines", "tooth", "teeth"],
  ["auger", "augers", "flighting", "flight"],
  ["roller", "rollers", "idler", "idlers", "tensioner", "tensioners"],
  ["chain", "chains", "rollerchain", "conveyorchain"],
  ["gear", "gears", "sprocket", "sprockets", "pulley", "pulleys", "sheave", "sheaves"],
  ["shoe", "shoes", "skidshoe", "skidshoes", "wearshoe", "wearshoes", "runner", "runners"],
  ["divider", "dividers", "point", "points", "snout", "snouts"],
  ["spring", "springs"],
  ["pickupreel", "pickup", "reel", "finger", "tine"],
  ["knifehead", "sicklehead", "knifedrive", "wobblebox", "knifebox"],
  ["knifedrive", "knifehead", "sicklehead", "wobblebox", "knifebox"],
  ["rocktrap", "stonetrap"],
  ["feederhouse", "feeder", "house"],
  ["slipclutch", "clutch"],
  ["header", "headers", "draper", "drapers"],
  ["hyd", "hydr", "hydraulic", "hydraulics"],
  ["assy", "assembly", "assemblies"],
  ["brg", "bearing", "bearings"],
  ["cyl", "cylinder", "cylinders"],
  ["filt", "filter", "filters"],
  ["mtr", "motor", "motors"],
  ["pnl", "panel", "panels"],
  ["sol", "solenoid", "solenoids"],
  ["strg", "steering"],
  ["whl", "wheel", "wheels"],
];

const PHRASE_NORMALIZATIONS = [
  ["o ring", "oring"],
  ["o rings", "orings"],
  ["hold down", "holddown"],
  ["hold downs", "holddowns"],
  ["cutter bar", "cutterbar"],
  ["knife head", "knifehead"],
  ["sickle head", "sicklehead"],
  ["knife drive", "knifedrive"],
  ["knife box", "knifebox"],
  ["wobble box", "wobblebox"],
  ["pickup reel", "pickupreel"],
  ["rock trap", "rocktrap"],
  ["stone trap", "stonetrap"],
  ["feeder house", "feederhouse"],
  ["slip clutch", "slipclutch"],
  ["roller chain", "rollerchain"],
  ["conveyor chain", "conveyorchain"],
  ["skid shoe", "skidshoe"],
  ["wear shoe", "wearshoe"],
  ["cotter pin", "cotterpin"],
  ["clevis pin", "clevispin"],
  ["roll pin", "rollpin"],
  ["jam nut", "jamnut"],
  ["lock nut", "locknut"],
];

const TOKEN_SYNONYMS = new Map();
for (const set of SYNONYM_SETS) {
  const unique = [...new Set(set.map((value) => normalizeSearchText(value)).filter(Boolean))];
  for (const value of unique) TOKEN_SYNONYMS.set(value, unique);
}

export function normalizeSearchText(value) {
  let normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  for (const [phrase, replacement] of PHRASE_NORMALIZATIONS) {
    normalized = normalized.replace(new RegExp(`\\b${phrase}\\b`, "g"), replacement);
  }
  return normalized;
}

function singularizeToken(token) {
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ves") && token.length > 4) return `${token.slice(0, -3)}f`;
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) return token.slice(0, -1);
  return token;
}

function tokenize(value) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function meaningfulTokens(tokens) {
  const filtered = tokens.filter((token) => !SEARCH_STOP_WORDS.has(token));
  return filtered.length ? filtered : tokens;
}

export function buildSearchTermGroups(value) {
  const tokens = meaningfulTokens(tokenize(value));
  const groups = [];
  const seen = new Set();
  for (const token of tokens) {
    const base = singularizeToken(token);
    const values = new Set([token, base]);
    for (const candidate of [...values]) {
      for (const synonym of TOKEN_SYNONYMS.get(candidate) || []) values.add(synonym);
    }
    const group = [...values].filter(Boolean);
    const key = group.slice().sort().join("|");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    groups.push(group);
  }
  return groups;
}

export function buildSearchQueryText(value) {
  return buildSearchTermGroups(value).map((group) => group[0]).join(" ");
}

export function textMatchesSearchGroups(value, groups) {
  const haystack = normalizeSearchText(value);
  if (!groups.length) return !haystack ? false : true;
  return groups.every((group) => group.some((term) => haystack.includes(term)));
}
