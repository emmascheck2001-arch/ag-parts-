// ─────────────────────────────────────────────────────────────────────────────
// LIVE PARTS-DATA CONNECTOR
//
// This file is INACTIVE until you add an API key to your .env file.
// With no key, the app uses the demo catalog (src/data/demo.js).
// The day you get a real feed (TecDoc via RapidAPI, John Deere developer
// portal, or a distributor), paste the key into .env and live data flows in —
// no other code changes needed.
//
// To turn it on:
//   1. Get an API key from a provider (see notes at the bottom of this file).
//   2. Open .env and set:
//        VITE_PARTS_API_URL=...   (the provider's base URL)
//        VITE_PARTS_API_KEY=...   (your secret key)
//   3. Adjust fetchLiveCatalog() below to match that provider's endpoints.
//   4. Restart the dev server.
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_PARTS_API_URL || ''
const API_KEY = import.meta.env.VITE_PARTS_API_KEY || ''

// True only when BOTH a URL and a key are present. The rest of the app reads
// this to decide whether to show "LIVE DATA" or "DEMO DATA".
export const HAS_LIVE_KEY = Boolean(API_URL && API_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// normalizePart — turn ONE raw record from the provider into the exact shape
// the app's screens expect. Every provider names fields differently, so this is
// the one spot you tune when you wire up a specific feed. The target shape is:
//
//   { id, part_number, name, category, description, fits_text,
//     fits_machines: [machineId...], tint,
//     prices: [{ supplier_id, price, in_stock_qty, is_oem }] }
// ─────────────────────────────────────────────────────────────────────────────
export function normalizePart(raw, index) {
  return {
    id: raw.id ?? index + 1,
    part_number: raw.part_number ?? raw.partNumber ?? raw.articleNumber ?? '',
    name: raw.name ?? raw.description ?? raw.genericArticleName ?? 'Part',
    category: raw.category ?? raw.assemblyGroup ?? 'Other',
    description: raw.description ?? '',
    fits_text: raw.fits_text ?? raw.compatibility ?? '',
    // Map the provider's compatible-machine list onto our local machine ids.
    fits_machines: raw.fits_machines ?? [],
    tint: raw.tint ?? '#2a2e33',
    prices: (raw.prices ?? raw.offers ?? []).map(o => ({
      supplier_id: o.supplier_id ?? o.supplierId ?? 0,
      price: Number(o.price ?? o.amount ?? 0),
      in_stock_qty: o.in_stock_qty ?? o.stock ?? o.quantity ?? 0,
      is_oem: Boolean(o.is_oem ?? o.oem ?? false),
    })),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchLiveCatalog — pull the catalog from the live provider.
// Returns { parts, suppliers, machines }. Throws on any failure so the caller
// can safely fall back to demo data.
//
// The fetch below is a GENERIC template. Swap the path/headers to match your
// provider once you have a key (provider-specific notes at the bottom).
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLiveCatalog() {
  if (!HAS_LIVE_KEY) throw new Error('No live parts API key configured')

  const res = await fetch(`${API_URL}/parts`, {
    headers: {
      // RapidAPI uses these two; a direct provider may use Authorization instead.
      'X-RapidAPI-Key': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
    },
  })

  if (!res.ok) throw new Error(`Parts API responded ${res.status}`)

  const data = await res.json()
  const rawParts = Array.isArray(data) ? data : (data.parts ?? data.articles ?? [])

  return {
    parts: rawParts.map(normalizePart),
    suppliers: data.suppliers ?? [],
    machines: data.machines ?? [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER NOTES — where to get a key, and what to change above.
//
// • TecDoc via RapidAPI (cheapest way in; mostly automotive)
//     URL:  https://tecdoc-catalog.p.rapidapi.com
//     Key:  RapidAPI dashboard → subscribe → copy "X-RapidAPI-Key"
//     Also send header:  'X-RapidAPI-Host': 'tecdoc-catalog.p.rapidapi.com'
//
// • John Deere (best for agriculture; requires dealer/partner access)
//     Portal: https://developer.deere.com  →  create app  →  OAuth key
//     Parts + pricing endpoints are gated behind an authorized dealer link.
//
// • Distributor feed (you have a business/reseller account)
//     Ask the distributor for their API base URL + key, then map their JSON
//     in normalizePart() above.
// ─────────────────────────────────────────────────────────────────────────────
