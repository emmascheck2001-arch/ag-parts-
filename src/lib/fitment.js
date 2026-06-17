// ─────────────────────────────────────────────────────────────────────────────
// FITMENT ENGINE — the "never the wrong part" logic.
//
//  • fitsMachine(part, machine)  → is this part verified to fit that machine?
//  • partsForMachine(machine)    → only the parts that fit (used when a farmer
//                                  picks their machine).
//  • crossRefsFor(part)          → interchangeable equivalents across brands,
//                                  so a compatible part doesn't have to be the
//                                  same brand — just a verified fit.
//
// Today this runs against the local catalog + interchange map. When a licensed
// fitment feed is connected, swap the data source and the same functions return
// verified real-world results — no UI changes needed.
// ─────────────────────────────────────────────────────────────────────────────
import { PARTS } from '../data/catalog'
import { INTERCHANGE } from '../data/crossref'

const eq = (a, b) => String(a ?? '').toLowerCase().trim() === String(b ?? '').toLowerCase().trim()

function yearInRange(fit, year) {
  if (!year) return true
  if (fit.year_from && year < fit.year_from) return false
  if (fit.year_to && year > fit.year_to) return false
  return true
}

// Verified fit check. Prefers structured fits[] (make / model / year) when a
// part carries it; otherwise falls back to the explicit machine-id list.
export function fitsMachine(part, machine) {
  if (!part || !machine) return false
  if (Array.isArray(part.fits_machines) && part.fits_machines.includes(machine.id)) return true
  if (Array.isArray(part.fits)) {
    return part.fits.some(f =>
      eq(f.make, machine.make) &&
      (f.models === 'all' || (Array.isArray(f.models) && f.models.some(m => eq(m, machine.model)))) &&
      yearInRange(f, machine.year)
    )
  }
  return false
}

// Every catalog part that is a verified fit for this machine.
export function partsForMachine(machine, parts = PARTS) {
  if (!machine) return parts
  return parts.filter(p => fitsMachine(p, machine))
}

// Cross-reference: interchangeable part numbers (incl. other brands) for a part.
// Returns [] when no verified interchange data exists yet.
export function crossRefsFor(part) {
  if (!part) return []
  const group = INTERCHANGE[part.id]
  if (!group) return []
  // Don't list the part's own number back to the user.
  return group.filter(x => !eq(x.part_number, part.part_number))
}
