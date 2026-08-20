// Server-side search layer. Instead of loading the whole catalog into the
// browser, we query Supabase per search — so it scales to millions of parts.
// Only the (small) machine list is cached in memory.
import { supabase } from "./supabase";
import { fitTier } from "./fit-confidence";
import { buildSearchQueryText, buildSearchTermGroups, normalizeSearchText } from "./search-language";
import { categoryOf } from "./categories";

const CAT_ICON = {
  Filters: "🔲", Hydraulics: "🔧", Hydraulic: "🔧", Belts: "➰", Blades: "🔪",
  Electrical: "⚡", Bearings: "⭕", Seals: "⚙️", Hardware: "🔩", Drive: "🔗",
  "Chopper Body": "🌾", "Frame/Shields": "🛡️", "Knife/Cutting": "🔪",
  "Draper/Belt": "➰", Reel: "🎡", Cooling: "❄️", Engine: "⚙️",
};
const partIcon = (cat) => CAT_ICON[cat] || "🧩";

function typeIcon(type, s) {
  const t = (type || "").toLowerCase(); s = (s || "").toLowerCase();
  if (t.includes("combine") || /combine/.test(s)) return { ty: type || "Combine", ic: "🌾" };
  if (t.includes("header") || t.includes("draper") || /header|draper/.test(s)) return { ty: type || "Header", ic: "🌾" };
  if (t.includes("sprayer") || /sprayer/.test(s)) return { ty: type || "Sprayer", ic: "💦" };
  return { ty: type || "Tractor", ic: "🚜" };
}

// ---- machine list (small — cached) --------------------------------------
let _machines = [];          // [{id, nm, make, model, ty, ic, img, year, count}]
let _idByName = {};

export async function loadMachines() {
  const { data: ms } = await supabase
    .from("machines")
    .select("id, make, model, type, year_from, year_to, hp, image_url")
    .limit(10000);
  if (!ms) return [];
  // per-machine part counts — page through fitments (the API caps each call at
  // 1000 rows, so we must paginate or most machines look empty).
  const counts = {};
  for (let from = 0; from < 500000; from += 1000) {
    const { data: fits } = await supabase.from("fitments").select("machine_id").range(from, from + 999);
    if (!fits || !fits.length) break;
    fits.forEach((f) => { counts[f.machine_id] = (counts[f.machine_id] || 0) + 1; });
    if (fits.length < 1000) break;
  }

  _idByName = {};
  _machines = ms.map((m) => {
    const nm = `${m.make} ${m.model}`.trim();
    const { ty, ic } = typeIcon(m.type, nm);
    _idByName[nm] = m.id;
    return {
      id: m.id, nm, make: m.make, model: m.model, ty, ic,
      hp: m.hp || "", img: m.image_url || "",
      year: m.year_from ? `${m.year_from}–${m.year_to || ""}` : "",
      count: counts[m.id] || 0,
    };
  }).sort((a, b) => a.nm.localeCompare(b.nm));
  return _machines;
}

export function machines() { return _machines; }
export function machinesWithParts() { return _machines.filter((m) => m.count > 0); }
export function machineByName(nm) { return _machines.find((m) => m.nm === nm) || null; }
export function machineNames() { return new Set(_machines.map((m) => m.nm)); }

// ---- part shaping --------------------------------------------------------
const PART_SEL =
  "part_number,name,category,brand,is_oem," +
  "fitments(verified,source,position,qty,machine:machines(make,model))," +
  "crossrefs(brand,equiv_number)";

function shapePart(p) {
  const fitment = (p.fitments || [])
    .map((f) => ({
      machine: f.machine ? `${f.machine.make} ${f.machine.model}`.trim() : "",
      verified: !!f.verified, tier: fitTier(f.source, !!f.verified),
      position: f.position, qty: f.qty || 1, years: "",
    }))
    .filter((f) => f.machine);
  // manufacturer(s) this part belongs to — the make of the machines it fits
  // (or the explicit brand). Used to flag the same number across manufacturers.
  const makes = [...new Set((p.fitments || []).map((f) => f.machine && f.machine.make).filter(Boolean))];
  if (p.brand && !makes.includes(p.brand)) makes.push(p.brand);
  return {
    pn: p.part_number, name: p.name || p.part_number, cat: p.category || "Other",
    ic: partIcon(p.category), brand: p.brand || "", isOem: p.is_oem !== false,
    makes, manufacturer: makes[0] || p.brand || "",
    fits: fitment.map((f) => f.machine).join(", "), fitment,
    cross: (p.crossrefs || []).map((c) => ({ brand: c.brand, pn: c.equiv_number })),
    suppliers: [],
  };
}

// Relevance score for a shaped part against the query. Higher = better match.
// Exact/leading part-number and name matches win; category matches count so
// "engine"/"filter"/"belt" searches surface the right parts; verified parts
// break ties upward. This is what stops results from coming back jumbled.
const norm = (s) => String(s || "").toLowerCase().replace(/[\s-]/g, "");
const esc = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function scorePart(p, queryText, groups) {
  const pn = norm(p.pn);
  const name = normalizeSearchText(p.name);
  const cat = normalizeSearchText(p.cat);
  let s = 0;
  const queryNorm = norm(queryText);
  if (queryNorm) {
    if (pn === queryNorm) s += 1000;
    else if (pn.startsWith(queryNorm)) s += 600;
    else if (pn.includes(queryNorm)) s += 280;
    if (name === queryText) s += 520;
    else if (name.startsWith(queryText)) s += 260;
    else if (new RegExp(`\\b${esc(queryText)}`).test(name)) s += 150;
    else if (name.includes(queryText)) s += 70;
    if (cat === queryText) s += 220;
    else if (cat.includes(queryText) || queryText.includes(cat)) s += 90;
  }

  let matchedGroups = 0;
  for (const group of groups) {
    let groupScore = 0;
    let groupMatched = false;
    for (const term of group) {
      const termNorm = norm(term);
      if (!termNorm) continue;
      if (pn === termNorm) groupScore = Math.max(groupScore, 800);
      else if (pn.startsWith(termNorm)) groupScore = Math.max(groupScore, 420);
      else if (pn.includes(termNorm)) groupScore = Math.max(groupScore, 190);
      if (name === term) groupScore = Math.max(groupScore, 420);
      else if (name.startsWith(term)) groupScore = Math.max(groupScore, 220);
      else if (new RegExp(`\\b${esc(term)}`).test(name)) groupScore = Math.max(groupScore, 170);
      else if (name.includes(term)) groupScore = Math.max(groupScore, 85);
      if (cat === term) groupScore = Math.max(groupScore, 160);
      else if (cat.includes(term) || term.includes(cat)) groupScore = Math.max(groupScore, 75);
      if (groupScore > 0) groupMatched = true;
    }
    if (!groupMatched) return -1;
    matchedGroups += 1;
    s += groupScore;
  }

  s += matchedGroups * 25;
  if ((p.fitment || []).some((f) => f.verified)) s += 25;
  return s;
}

// ---- server-side queries -------------------------------------------------
export async function searchParts(q, limit = 60) {
  q = (q || "").trim();
  if (!q) return [];
  const groups = buildSearchTermGroups(q);
  const queryText = buildSearchQueryText(q);
  const variants = [...new Set(groups.flat().map((value) => value.replace(/[%,]/g, "").trim()).filter(Boolean))];
  if (!variants.length) return [];
  // Fetch a wider candidate pool (part number, name, OR category), then rank
  // client-side and return the best `limit`. Matching category too means a
  // search like "filter" or "engine" finds parts by their category, not just
  // parts with that word in the name.
  const orFilters = variants.flatMap((value) => {
    const like = `%${value}%`;
    return [`part_number.ilike.${like}`, `name.ilike.${like}`, `category.ilike.${like}`];
  }).join(",");
  const { data } = await supabase
    .from("parts")
    .select(PART_SEL)
    .or(orFilters)
    .limit(Math.max(240, limit * 3));
  return (data || [])
    .map(shapePart)
    .map((p) => ({ p, s: scorePart(p, queryText, groups) }))
    .filter((value) => value.s >= 0)
    .sort((a, b) => b.s - a.s || (b.p.fitment.length - a.p.fitment.length) || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}

export async function getPartByNumber(pn) {
  const { data } = await supabase.from("parts").select(PART_SEL).eq("part_number", pn).limit(1);
  return data && data[0] ? shapePart(data[0]) : null;
}

// Every part that fits a machine (by name), for the machine page.
export async function machinePartsFor(machineName, limit = 3000) {
  const id = _idByName[machineName];
  if (!id) return [];
  const { data } = await supabase
    .from("fitments")
    .select("verified,source,position,qty,part:parts(part_number,name,category)")
    .eq("machine_id", id)
    .limit(limit);
  return (data || [])
    .filter((f) => f.part)
    .map((f) => {
      const cat = categoryOf({ category: f.part.category, name: f.part.name || f.part.part_number });
      return {
      pn: f.part.part_number, name: f.part.name || f.part.part_number,
      cat, ic: partIcon(cat),
      fit: { position: f.position, qty: f.qty, verified: f.verified, tier: fitTier(f.source, !!f.verified) },
      cross: [],
      };
    });
}
