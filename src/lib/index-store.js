// Loads the fitment index from Supabase into memory and shapes it like the
// in-app catalog. If Supabase is empty/unreachable, callers fall back to the
// demo.js seed — so the app never breaks during/after migration.
import { supabase } from "./supabase";

let indexParts = null; // null until a successful, non-empty load

const ICONS = { Filters: "🔲", Hydraulic: "🔧", "Cab & Body": "🚪", Belts: "➰", Engine: "⚙️", Electrical: "⚡", Bearings: "⭕", Drivetrain: "🔩", Cooling: "❄️" };

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

export async function loadIndex() {
  try {
    const [machinesRes, partsRes, fitmentsRes, crossRes] = await Promise.all([
      supabase.from("machines").select("id, make, model, year_from, year_to"),
      supabase.from("parts").select("id, part_number, name, category"),
      supabase.from("fitments").select("part_id, machine_id, position, qty, verified"),
      supabase.from("crossrefs").select("part_id, brand, equiv_number"),
    ]);
    const parts = partsRes.data;
    if (partsRes.error || !parts || !parts.length) return false; // empty → keep seed fallback

    const machineName = {};
    (machinesRes.data || []).forEach((m) => {
      machineName[m.id] = `${m.make} ${m.model}`.trim();
    });
    const pnById = {};
    const built = {};
    parts.forEach((p) => {
      pnById[p.id] = p.part_number;
      built[p.part_number] = {
        name: p.name || p.part_number,
        cat: p.category || "Other",
        ic: ICONS[p.category] || "🧩",
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
      built[pn].fitment.push({ machine: nm, years: "", position: f.position, qty: f.qty || 1, verified: !!f.verified });
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
export async function logMiss(query) {
  const qy = (query || "").trim();
  if (!qy) return;
  try {
    await supabase.from("search_misses").upsert({ query: qy }, { onConflict: "query", ignoreDuplicates: true });
  } catch {
    /* ignore */
  }
}
