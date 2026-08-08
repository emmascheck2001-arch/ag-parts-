# EzParts Redesign Proposal — structure + visuals

Synthesis of ag-tech + parts-commerce research (see agtech.md, parts_commerce.md) into a concrete
plan. Design track only — apply after the schema rebuild lands so it maps to the new tables
(machines → models → variants → serial_ranges → systems → subsystems → parts → fitments).

## 1. Design principles (non-negotiable for farmers)
1. Lead with the ANSWER, not the catalog: "✓ Fits your JD 5075E · In stock · $42" first, specs later.
2. Never show a part without a fitment verdict (Fits / May fit–confirm serial / No data).
3. My Machines (garage) is the backbone — build once, filter everything through it.
4. Reduce typing: serial/PIN + scan + dropdown; typing is the fallback.
5. Glove-friendly: 48–56px touch targets, full-row taps, bottom-zone CTAs.
6. High contrast for sunlight; color always paired with icon + word.
7. Speed is a feature: instant search, skeleton loaders, cached garage.
8. Real machine/part photos, never clip-art — trust.

## 2. Visual system
- **Theme:** light-first, very high contrast (near-black text on white/#F7F8F6, 7:1) as default —
  product photos + prices read best on light and feel like a real marketplace. Add a **"Field Mode"**
  toggle = true dark high-contrast for in-cab/direct sun (reuse today's dark palette there).
- **Brand green:** keep, but deepen/saturate (#1F9E37-ish) so it survives glare. Green = brand + "Fits".
- **CTA accent:** one high-visibility accent for the primary action only — safety amber/orange
  (#F5820A) reads in sun and stands apart from status green. Green CTA is fine too; pick one.
- **Status:** green ✓ Fits · amber ▲ Check fit/serial · grey ● No data · red ✕ Won't fit — icon+word always.
- **Type:** bold clean sans (Inter/SF). Body 17–18px min; part numbers, prices, CTAs larger/heavier.
- **Components:** rounded cards, thick enough dividers to survive sun, big pill filters, full-width rows.

## 3. Information architecture / navigation
Bottom tabs (thumb zone): **Home · Search · My Machines · Orders · Account**
Persistent "Shopping for: [machine] ▾" chip in the header once a machine is selected — one tap to swap.

## 4. Key screens
### Home (redesigned)
- Header: logo + Field Mode toggle.
- HERO = the garage. If no machine: big "Add your machine" (serial scan / dropdown). If machines
  saved: horizontal cards of their machines, tap → that machine's parts.
- Big search bar (part #, name, OR cross-ref number) + Scan button.
- Three on-ramps: Scan part · Search by machine · Enter part number.
- "Popular for your equipment" / recent searches. Trust strip: right-part guarantee, dealers, returns.

### My Machines (garage) + Add flow
- Cards: machine photo, nickname ("North-field 5075E"), model, serial. Add via **serial/PIN** (hero,
  with an inline "where's my serial plate?" photo), **Make→Model→Year** dropdown, or **scan plate**.

### Machine detail = the parts browser
- Machine header (photo, model, serial chip).
- Two browse modes: **Category tree** (System → Subsystem → Part — maps to our taxonomy) AND
  (phase 2) **interactive exploded diagram** with tappable hotspots.
- Every row: thumb, name, part #, OEM/aftermarket badge, **fitment verdict**, price-from, in-stock.

### Search results
- Fitment filter default-ON ("Fits my machine"). Group by system. Rank: confirmed-fit → in-stock →
  relevance → price. Cross-ref numbers resolve to our SKU. Each card fitment-stamped.

### Part detail
- Big "✓ Fits your [machine]" banner. Multi-angle photos. Part #s: OEM + our SKU + **cross-reference
  list**. OEM vs aftermarket toggle with price delta. **Multi-seller compare** (price/stock/distance/
  rating — cheapest vs fastest). Fitment note verbatim + serial-break coverage. "Also needed" (gaskets/
  filters/fluids). Right-part guarantee + free-return line by the buy button.

## 5. Signature features (differentiators, tied to the new data model)
- Three-state fitment verdict everywhere (needs serial_ranges + fitments — Codex's schema enables it).
- Cross-reference/interchange search (part_relationships) — type any number, get the right part.
- Multi-seller price/availability compare (dealer_inventory).
- Scan: part-number OCR (primary) → AI photo-ID (secondary, confirm against machine) → manual fallback.
- Right-part guarantee + machine attached to every order (re-orders, returns, maintenance history).

## 6. Rollout (after rebuild)
1. Visual system + Field Mode + tokens. 2. Home + garage. 3. Machine detail category tree + fitment
badges. 4. Part detail (cross-refs, multi-seller, OEM/aftermarket). 5. Scan. 6. Interactive diagrams.
