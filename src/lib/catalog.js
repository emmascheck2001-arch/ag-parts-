// The catalog the farmer searches = demo/seed data + live dealer listings.
// Dealer listings add new parts, or add their supplier + machines to an
// existing part. This is the Uber Eats model: dealers bring the "menu".
import { PARTS as SEED_PARTS } from "../data/demo";
import { listingParts } from "./listings";

export function getParts() {
  const merged = { ...SEED_PARTS };
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
