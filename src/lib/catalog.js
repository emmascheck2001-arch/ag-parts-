// The catalog the farmer searches = demo/seed data + live dealer listings.
// Dealer listings add new parts, or add their supplier + machines to an
// existing part. This is the Uber Eats model: dealers bring the "menu".
import { PARTS as SEED_PARTS, MACHINES as SEED_MACHINES } from "../data/demo";
import { getIndexParts, getIndexMachines } from "./index-store";
import { listingParts } from "./listings";
import { getInventorySuppliers } from "./inventory";
import { categoryOf } from "./categories";

const pnNorm = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

// Every machine the farmer can browse = curated seed machines (with images)
// + machines ingested into the Supabase index. Seed entries win on name so
// their images/specs are preserved.
export function getMachines() {
  // The live Supabase index is the source of truth (the curated 15). Seed
  // machines are only a fallback when the index hasn't loaded (offline/empty),
  // so the storefront never shows machines outside the real catalog.
  const idx = getIndexMachines();
  if (idx && idx.length) return [...idx].sort((a, b) => a.nm.localeCompare(b.nm));
  return [...SEED_MACHINES].sort((a, b) => a.nm.localeCompare(b.nm));
}

export function getParts() {
  const merged = { ...SEED_PARTS };

  // Supabase fitment index (once loaded): add any parts the seed doesn't have.
  const idx = getIndexParts();
  if (idx) {
    for (const [pn, p] of Object.entries(idx)) {
      if (!merged[pn]) merged[pn] = p;
    }
  }

  for (const [pn, listed] of Object.entries(listingParts())) {
    const existing = merged[pn];
    if (existing) {
      const haveMachines = new Set((existing.fitment || []).map((f) => f.machine));
      const newFit = (listed.fitment || []).filter((f) => !haveMachines.has(f.machine));
      merged[pn] = {
        ...existing,
        suppliers: [...existing.suppliers, ...listed.suppliers],
        fitment: [...(existing.fitment || []), ...newFit],
      };
    } else {
      merged[pn] = listed;
    }
  }

  // Real dealer inventory (Supabase): the true sellers. Each carries its
  // dealer's Stripe account, so these are the suppliers checkout routes payment
  // to. Real dealers are listed FIRST (ahead of any demo/sample sellers).
  const inv = getInventorySuppliers();
  if (inv) {
    for (const [pn, part] of Object.entries(merged)) {
      const real = inv[pnNorm(pn)];
      if (real && real.length) {
        const demo = (part.suppliers || []).filter((s) => !s.dealerAccountId);
        merged[pn] = { ...part, suppliers: [...real, ...demo], hasRealDealer: true };
      }
    }
  }
  return merged;
}

// Part count per machine, computed in ONE pass over the catalog (instead of
// scanning every part once per machine). Used by the browse list to show counts
// and to hide machines that have nothing catalogued yet.
export function machinePartCounts() {
  const counts = {};
  for (const part of Object.values(getParts())) {
    for (const f of part.fitment || []) {
      if (f.machine) counts[f.machine] = (counts[f.machine] || 0) + 1;
    }
  }
  return counts;
}

// Full, card-ready parts for a machine: every field a part card needs (clean
// category, OEM/aftermarket, suppliers, cross-refs, fitment confidence, price).
// Only parts with a confirmed fitment to THIS machine are returned — that's the
// "never show a part that doesn't fit" guarantee.
export function machineParts(machineName) {
  const out = [];
  for (const [pn, part] of Object.entries(getParts())) {
    const fit = (part.fitment || []).find((f) => f.machine === machineName);
    if (!fit) continue;
    const suppliers = part.suppliers || [];
    let best = Infinity, bestSup = null;
    for (const s of suppliers) {
      const t = (s.price || 0) + (s.ship || 0);
      if (t < best) { best = t; bestSup = s; }
    }
    out.push({
      pn,
      name: part.name,
      ic: part.ic,
      cat: categoryOf(part),
      rawCat: part.cat,
      brand: part.brand || "",
      isOem: part.isOem !== false,
      image: part.image || "",
      suppliers,
      bestSupplier: bestSup,
      cross: part.cross || [],
      oemNumber: (part.cross || []).find((c) => /oem|deere|case|hagie|claas|new holland|caterpillar/i.test(c.brand))?.pn || "",
      fit: { position: fit.position, qty: fit.qty, years: fit.years, verified: fit.verified, tier: fit.tier },
      from: isFinite(best) ? best : null,
      inStock: suppliers.some((s) => (s.stock || 0) > 0),
      fastestDays: suppliers.reduce((m, s) => Math.min(m, s.days || 99), 99),
      hasRealDealer: !!part.hasRealDealer,
    });
  }
  return out;
}

// A machine's service/maintenance kit = its routine wear/consumable parts
// (filters, belts, fluids, blades), so a farmer can one-click order a whole
// service interval instead of hunting each part. Grouped by category, then name.
const SERVICE_CATEGORIES = ["Filters", "Belts", "Fluids", "Blades"];
export function serviceKit(machineName) {
  const order = Object.fromEntries(SERVICE_CATEGORIES.map((c, i) => [c, i]));
  return machineParts(machineName)
    .filter((p) => SERVICE_CATEGORIES.includes(p.cat))
    .sort((a, b) => (order[a.cat] - order[b.cat]) || a.name.localeCompare(b.name));
}

// Every part that fits a given machine (seed + dealer-listed), with the "how".
export function partsForMachine(machineName) {
  const out = [];
  for (const [pn, part] of Object.entries(getParts())) {
    const fit = (part.fitment || []).find((f) => f.machine === machineName);
    if (!fit) continue;
    out.push({
      pn,
      name: part.name,
      ic: part.ic,
      cat: part.cat,
      position: fit.position,
      qty: fit.qty,
      years: fit.years,
      verified: fit.verified,
      from: (part.suppliers && part.suppliers.length) ? Math.min(...part.suppliers.map((s) => s.price)) : null,
    });
  }
  return out;
}
