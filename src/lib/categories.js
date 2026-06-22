// The 9 clean browse categories the storefront uses, mapped from the messy raw
// categories/names in the index (e.g. "Filter", "Air Filter", "Hose", "Hardware"
// all collapse into the right bucket). Order matters: first match wins, so
// "Engine Oil Filter" lands in Filters, not Engine or Fluids.

export const CATEGORIES = [
  { key: "Filters", ic: "🧫", match: /filter|filtration|element/i },
  { key: "Belts", ic: "➰", match: /\bbelt|v-belt|serpentine|pulley/i },
  { key: "Bearings", ic: "⭕", match: /bearing|bushing|race|seal kit/i },
  { key: "Blades", ic: "🔪", match: /blade|knife|knives|cutting|sickle|guard|mower deck|mulch/i },
  { key: "Hydraulic", ic: "🔧", match: /hydraulic|hydro|hose|fitting|coupler|cylinder|\bvalve\b|spool|manifold/i },
  { key: "Electrical", ic: "⚡", match: /electric|sensor|switch|harness|wire|lamp|light|bulb|battery|fuse|relay|solenoid|alternator|starter|gauge/i },
  { key: "Engine", ic: "⚙️", match: /engine|piston|gasket|injector|turbo|crank|cam|cylinder head|manifold|water pump|fuel pump|thermostat|radiator|cooling|exhaust|muffler/i },
  { key: "Fluids", ic: "🛢️", match: /\boil\b|fluid|grease|lubric|coolant|antifreeze|\bdef\b|hydraulic oil|gear oil/i },
  { key: "Other", ic: "🧩", match: /.*/ },
];

const ICON_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.ic]));

// Resolve one part to its clean category key. Looks at raw category + name.
export function categoryOf(part) {
  const hay = `${part.cat || part.category || ""} ${part.name || ""}`;
  for (const c of CATEGORIES) {
    if (c.key === "Other") continue;
    if (c.match.test(hay)) return c.key;
  }
  return "Other";
}

export const categoryIcon = (key) => ICON_BY_KEY[key] || "🧩";
