// The 9 clean browse categories, mapped from the messy raw categories/names in
// the index. Two concerns are kept separate:
//   • CATEGORIES   = DISPLAY order for the grid (what the user sees)
//   • MATCH        = PRIORITY order for classification (resolves overlaps, e.g.
//                    Engine is checked before Hydraulic so "EXHAUST MANIFOLD"
//                    and "CYLINDER HEAD" land in Engine, not Hydraulic)

// Display order + icon key (icons come from CatIcon by the same key).
export const CATEGORIES = [
  { key: "Filters", ic: "🧫" },
  { key: "Belts", ic: "➰" },
  { key: "Bearings", ic: "⭕" },
  { key: "Blades", ic: "🔪" },
  { key: "Hydraulic", ic: "🔧" },
  { key: "Electrical", ic: "⚡" },
  { key: "Engine", ic: "⚙️" },
  { key: "Fluids", ic: "🛢️" },
  { key: "Other", ic: "🧩" },
];

// Classification rules in PRIORITY order (first match wins). Electrical + Engine
// are checked BEFORE Blades so "BLADE TYPE FUSE" → Electrical and "FAN, 6 BLADE"
// → Engine instead of Blades; Engine before Hydraulic so "EXHAUST"/"CYLINDER
// HEAD" win over Hydraulic's "cylinder".
const MATCH = [
  ["Filters", /filter|filtration|air cleaner element/i],
  ["Belts", /\bbelt|v-belt|serpentine|\bpulley|sheave/i],
  ["Bearings", /bearing|bushing|\brace\b|seal kit/i],
  // electrical incl. gauge-wire entries like "16GA RED-…" and blade-type fuses
  ["Electrical", /electric|sensor|switch|harness|\bwire|\b\d{1,2}\s?ga\b|lamp|\blight|bulb|battery|fuse|relay|solenoid|alternator|starter|gauge|terminal|connector/i],
  // engine incl. cooling fans
  ["Engine", /engine|piston|crankshaft|camshaft|cylinder head|head gasket|gasket|injector|turbo|\bexhaust|muffler|water pump|fuel pump|thermostat|radiator|intercooler|\bfan\b|flywheel|oil pan|valve cover/i],
  // cutting parts only — exclude wiper blades / decals; "guard"/"fuse"/"fan" handled above
  ["Blades", /^(?!.*\b(?:wiper|decal)\b).*(?:\bblade|knife|knives|sickle|\bmulch|mower deck|cutterbar|cutter bar|gator)/i],
  // hydraulics + plumbing fittings
  ["Hydraulic", /hydraulic|hydro|hydrostatic|\bhose\b|fitting|coupler|coupling|\belbow\b|\btee\b|adapter|nipple|\bunion\b|cylinder|\bvalve\b|spool|manifold|orifice/i],
  ["Fluids", /\boil\b|fluid|grease|lubric|coolant|antifreeze|\bdef\b|gear lube/i],
];

const ICON_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.ic]));

// Resolve one part to its clean category key (raw category + name).
export function categoryOf(part) {
  const hay = `${part.cat || part.category || ""} ${part.name || ""}`;
  for (const [key, re] of MATCH) if (re.test(hay)) return key;
  return "Other";
}

export const categoryIcon = (key) => ICON_BY_KEY[key] || "🧩";
