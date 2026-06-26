// Loads the fitment index from Supabase into memory and shapes it like the
// in-app catalog. If Supabase is empty/unreachable, callers fall back to the
// demo.js seed — so the app never breaks during/after migration.
import { supabase } from "./supabase";
import { fitTier } from "./fit-confidence";

let indexParts = null; // null until a successful, non-empty load
let indexMachines = null; // machines from the index, shaped like the seed list

const ICONS = { Filters: "🔲", Hydraulic: "🔧", "Cab & Body": "🚪", Belts: "➰", Engine: "⚙️", Electrical: "⚡", Bearings: "⭕", Drivetrain: "🔩", Cooling: "❄️" };

// Ingested machines carry only make/model (no type/icon). Derive a display
// type + icon from the model designation. Conservative: only classify a
// non-tractor when the name clearly signals it, else default to Tractor.
function classifyMachine(make, model) {
  const s = `${make} ${model}`.toLowerCase();
  if (/forage|harvester/.test(s)) return { ty: "Forage Harvester", ic: "🌽" };
  if (/cotton|picker|\b76\d\d\b|\b99[789]\d\b/.test(s)) return { ty: "Cotton Picker", ic: "🧺" };
  if (/sprayer|spreader|\br4\d\d\b|\br41\d\b/.test(s)) return { ty: "Sprayer", ic: "💦" };
  if (/combine|\bsts\b|\bcts\b|maximizer|walker|sidehill|\bx9\b|\bs[5-7]\d0\b|\bcr\d|\bcx\d/.test(s)) return { ty: "Combine", ic: "🌾" };
  return { ty: "Tractor", ic: "🚜" };
}

export function getIndexMachines() {
  return indexMachines;
}

// Index holds fitment, not price/stock (that's dealer content). For the demo we
// attach a couple of sample sellers so the buy flow still works on ingested parts.
function sampleSuppliers(pn) {
  let h = 0;
  for (const c of pn) h = (h * 31 + c.charCodeAt(0)) % 9973;
  const base = 18 + (h % 70);
  return [
    { s: "Prairie Equipment", price: base, ship: 10, rating: 4.8, n: 120, days: 2, stock: 12 },
    { s: "Agri Parts Central", price: +(base * 1.08).toFixed(2), ship: 10, rating: 4.7, n: 90, days: 2, stock: 8 },
  ];
}

export function getIndexParts() {
  return indexParts;
}

// Supabase/PostgREST caps every response at 1000 rows. Our catalog is far
// bigger (10k+ parts, 30k+ fitments), so we page through in 1000-row chunks
// until a short page signals the end — otherwise most machines look empty.
async function fetchAll(table, columns) {
  const PAGE = 1000;
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || !data.length) break;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}

export async function loadIndex() {
  try {
    const [machinesData, parts, fitmentsData, crossData] = await Promise.all([
      fetchAll("machines", "id, make, model, type, year_from, year_to, hp, image_url"),
      fetchAll("parts", "id, part_number, name, category, brand, is_oem"),
      fetchAll("fitments", "part_id, machine_id, position, qty, verified, source, confidence"),
      fetchAll("crossrefs", "part_id, brand, equiv_number"),
    ]);
    if (!parts || !parts.length) return false; // empty → keep seed fallback
    const machinesRes = { data: machinesData };
    const fitmentsRes = { data: fitmentsData };
    const crossRes = { data: crossData };

    const machineName = {};
    const machinesList = [];
    (machinesRes.data || []).forEach((m) => {
      const nm = `${m.make} ${m.model}`.trim();
      machineName[m.id] = nm;
      const c = classifyMachine(m.make, m.model);
      machinesList.push({
        nm,
        make: m.make,
        model: m.model,
        ty: m.type || c.ty,
        ic: c.ic,
        hp: m.hp || "",
        img: m.image_url || "",
        year: m.year_from ? `${m.year_from}–${m.year_to || ""}` : "",
      });
    });
    machinesList.sort((a, b) => a.nm.localeCompare(b.nm));
    indexMachines = machinesList;
    const pnById = {};
    const built = {};
    parts.forEach((p) => {
      pnById[p.id] = p.part_number;
      built[p.part_number] = {
        name: p.name || p.part_number,
        cat: p.category || "Other",
        ic: ICONS[p.category] || "🧩",
        brand: p.brand || "",
        isOem: p.is_oem !== false, // default to OEM unless explicitly aftermarket
        fits: "",
        fitment: [],
        suppliers: [],
        cross: [],
      };
    });
    (fitmentsRes.data || []).forEach((f) => {
      const pn = pnById[f.part_id];
      const nm = machineName[f.machine_id];
      if (!pn || !nm || !built[pn]) return;
      built[pn].fitment.push({
        machine: nm, years: "", position: f.position, qty: f.qty || 1,
        verified: !!f.verified, tier: fitTier(f.source, !!f.verified),
      });
    });
    (crossRes.data || []).forEach((c) => {
      const pn = pnById[c.part_id];
      if (pn && built[pn]) built[pn].cross.push({ brand: c.brand, pn: c.equiv_number });
    });
    Object.entries(built).forEach(([pn, part]) => {
      part.fits = part.fitment.map((f) => f.machine).join(", ");
      if (!part.suppliers.length) part.suppliers = sampleSuppliers(pn);
    });

    indexParts = built;
    return true;
  } catch {
    return false; // any failure → seed fallback
  }
}

// Log a search the index couldn't answer — the ingestion queue + demand signal.
// Pass { email, machine } to capture a farmer asking to be notified, so unmet
// demand becomes a contactable lead instead of leaking off-platform.
export async function logMiss(query, meta = {}) {
  const qy = (query || "").trim();
  if (!qy) return;
  const row = { query: qy };
  if (meta.email) row.notify_email = meta.email.trim();
  if (meta.machine) row.machine = meta.machine;
  try {
    // With contact info, let the latest write win (update); a bare repeat miss
    // can be ignored if the query already exists.
    await supabase
      .from("search_misses")
      .upsert(row, { onConflict: "query", ignoreDuplicates: !meta.email });
  } catch {
    /* ignore */
  }
}
