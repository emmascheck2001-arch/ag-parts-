// ─────────────────────────────────────────────────────────────────────────────
// CATALOG — the single source the screens read from.
//
// By default these hold the DEMO data. If a live API key is configured,
// hydrateCatalog() (called once at startup in main.jsx) replaces the contents
// in place with live data. Screens import PARTS / SUPPLIERS / MACHINES from
// here and never need to know which source they're getting.
// ─────────────────────────────────────────────────────────────────────────────
import { DEMO_PARTS, DEMO_SUPPLIERS, DEMO_MACHINES } from './demo'
import { HAS_LIVE_KEY, fetchLiveCatalog } from '../lib/partsApi'

// Mutable arrays seeded with demo data. We mutate them IN PLACE on hydration so
// every screen that imported the reference sees the live data automatically.
export const PARTS     = [...DEMO_PARTS]
export const SUPPLIERS = [...DEMO_SUPPLIERS]
export const MACHINES  = [...DEMO_MACHINES]

// Read by the banner to show "LIVE DATA" vs "DEMO DATA".
export const dataStatus = { isLive: false }

export async function hydrateCatalog() {
  if (!HAS_LIVE_KEY) return // No key → stay on demo data.
  try {
    const live = await fetchLiveCatalog()
    if (live.parts?.length)     PARTS.splice(0, PARTS.length, ...live.parts)
    if (live.suppliers?.length) SUPPLIERS.splice(0, SUPPLIERS.length, ...live.suppliers)
    if (live.machines?.length)  MACHINES.splice(0, MACHINES.length, ...live.machines)
    dataStatus.isLive = true
    console.info('[catalog] Live parts feed loaded.')
  } catch (err) {
    // Any failure (bad key, network, rate limit) → keep the demo catalog.
    console.warn('[catalog] Live feed unavailable, using demo data:', err.message)
  }
}
