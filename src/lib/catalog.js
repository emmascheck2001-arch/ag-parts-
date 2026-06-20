// The catalog the farmer searches = demo/seed data + live dealer listings.
// Dealer listings add new parts, or add their supplier + machines to an
// existing part. This is the Uber Eats model: dealers bring the "menu".
import { PARTS as SEED_PARTS, MACHINES as SEED_MACHINES } from "../data/demo";
import { getIndexParts, getIndexMachines } from "./index-store";
import { listingParts } from "./listings";
import { getInventorySuppliers } from "./inventory";

const pnNorm = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

// Every machine the farmer can browse = curated seed machines (with images)
// + machines ingested into the Supabase index. Seed entries win on name so
// their images/specs are preserved.
export function getMachines() {
  const byName = {};
  for (const m of getIndexMachines() || []) byName[m.nm] = m;
  for (const m of SEED_MACHINES) byName[m.nm] = m; // seed overrides index
  return Object.values(byName).sort((a, b) => a.nm.localeCompare(b.nm));
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
      from: Math.min(...part.suppliers.map((s) => s.price)),
    });
  }
  return out;
}
