# Parts-Finder & Parts E-Commerce UX Research

Research to inform the redesign of **EzParts** (agricultural parts finder + marketplace). Focus: the "select my machine → find parts that fit" flow, fitment confidence, search/filtering/ranking, part card + detail page, scan/photo lookup, checkout, and trust for ordering the RIGHT part.

---

## 1. Best examples (name + 1-line why)

- **RockAuto** — gold standard for the collapsible category *tree* (system → subsystem → part), with explicit per-line fitment notes ("fits 2.0L only") so you never guess.
- **eBay Motors "My Garage" + "Guaranteed Fit"** — cleanest fitment-confidence UI: a green **"Fits"** checkmark on every listing + a money-back guarantee if a "fits"-marked part doesn't fit. Their own data: wrong-fit tire returns ~$50M/yr, so fitment accuracy is a real dollar lever.
- **Amazon Automotive ("Confirmed Fit" / Garage)** — lowest-friction entry: license-plate lookup → vehicle, plus a persistent garage and a "This fits your vehicle" banner at the top of the detail page.
- **PartsTech** — best *pro* multi-supplier model: one search across 30k+ supplier locations returns availability + price per seller side-by-side; interactive full-vehicle diagrams; cross-reference/interchange built in.
- **Parts Town / Documoto / VNTANA / Konfigr** — best-in-class **interactive exploded diagrams**: click a hotspot on the schematic → part number, price, stock, add-to-cart in place. This is the equipment-industry equivalent of RockAuto's category tree and is directly applicable to ag machines.
- **John Deere / Messicks / GreenPartStore** — the ag reference: lookup by **PIN/serial number → model → illustrated parts diagram**. Serial number is the ag analog of VIN and disambiguates configuration/serial-break variants.
- **O'Reilly / NAPA / AutoZone** — best **omnichannel** pattern: online search tied to "in stock at your store now," free next-day or same-day store pickup across ~6,000 locations, and a saved-vehicles list.

---

## 2. The "my machine → parts that fit" flow — best pattern, step by step

The winning pattern is a **persistent garage** built once, reused everywhere, with multiple low-friction ways to identify the machine.

1. **Identify the machine (offer 3+ on-ramps, low → high effort):**
   - **Serial/PIN (or VIN) entry** — the ag equivalent of eBay/Amazon license-plate lookup; auto-resolves make/model/year/config and, critically, the **serial-break** variant. Show *where to find the plate* (photo/diagram) inline — this is a known ag pain point.
   - **Cascading Make → Model → Year/Config** dropdowns as the fallback (RockAuto/NAPA). Each step filters the next; never show impossible combinations.
   - **Scan/photo** of the machine data plate (OCR the serial) — see §5.
2. **Confirm & save to garage.** Show a machine "card" (name, model, serial, an image). Let the user nickname it ("North-field 4020"). Persist across sessions and devices.
3. **Machine becomes the lens.** Once selected, the *entire* catalog filters to that machine. A persistent header chip shows the active machine ("Shopping for: JD 4020 #12345 — change"). One click to swap machines.
4. **Browse by system, not by SKU.** Land the user in a categorized tree (Engine → Fuel System → Filters) OR the interactive parts diagram for that machine.
5. **Every result is fitment-stamped** (green "Fits" / "Fits — verify serial break" / grey "Check fit"). See §3.
6. **Add to cart → checkout** with the machine attached to the line item (so re-orders and returns know exactly which machine it was for).

Design rules distilled: build the garage **once**; make identification **multi-modal** (serial, dropdown, scan); make the machine a **persistent global filter**; and **never show a part without a fitment verdict**.

---

## 3. Part card + part detail — what fields/layout to show

### Fitment confidence UI (the single most important element)
- **Green checkmark + "Fits your [machine]"** banner at the top of the detail page and a compact badge on every card (eBay/Amazon pattern). Make it unmissable.
- Three-state, never binary: **Fits** (green) / **May fit — confirm serial break/config** (amber, with the specific caveat) / **Doesn't fit / no data** (grey). Ambiguity is the #1 cause of wrong-part returns.
- Show the **fitment note verbatim** ("fits S/N 001000–015000; 2.0L only") — RockAuto's per-line notes are why users trust it.
- If no machine is selected, the card shows **"Select your machine to check fit"** instead of a false claim.

### Part card (list/grid)
- Thumbnail, part name, **primary part number (SKU/OEM)**, brand, **fitment badge**, price, **availability** (in stock / ships in X / in stock at [Store] N mi away), quick "add to cart," and OEM-vs-aftermarket tag.

### Part detail page — field checklist
- **Multi-angle imagery** + dimensions/mounting points; where possible the **exploded-diagram context** (which assembly it belongs to).
- **Part number(s):** manufacturer P/N, your SKU, **OEM number**, and a **cross-reference / interchange list** (equivalent OEM + competitor part numbers) — this is a top-3 trust driver and search entry point.
- **OEM vs. aftermarket** clearly labeled, with a short "what's the difference" explainer and price delta.
- **Price compare across sellers** (PartsTech model): a table of sellers with price, availability, distance/ETA, and seller rating — let the buyer choose cheapest vs. fastest.
- **Availability & fulfillment:** in-stock count, ships-by date, **nearest store with stock + pickup ETA** (O'Reilly/NAPA pattern).
- **Fitment note + serial-break coverage** for the selected machine.
- Specs table, warranty terms, return policy, **installation difficulty rating** (RockAuto does this — valuable for DIY ag customers).
- Reviews/Q&A, and **"frequently bought together / also needed for this job"** (gaskets, filters, fluids).
- A clear **"Wrong part? Free return"** / guarantee statement near the buy button.

---

## 4. Search & results structure (grouping, filters, ranking)

- **Omnichannel search box:** accept part name, your SKU, **OEM/interchange part number**, and free text. Part-number search must hit the cross-reference index so a competitor/OEM number resolves to your equivalent.
- **Two primary browse modes, both machine-scoped:**
  1. **Category tree** — group results by **system → subsystem → part type** (RockAuto). Collapsible, familiar to techs.
  2. **Interactive exploded diagram** — clickable hotspots on the machine schematic reveal P/N, price, stock, add-to-cart in place (Parts Town / Documoto / PartsTech). This is the strongest fit for ag equipment and reduces wrong-part orders by showing parts *in context*.
- **Filters:** system/category, brand, OEM vs aftermarket, price, availability (in stock / store pickup / ships today), and **fitment (Fits only)** as a default-on toggle.
- **Ranking:** (1) **confirmed fit first**, (2) in-stock / fastest fulfillment, (3) relevance to part-number query, (4) price / seller rating. Never let a non-fitting part outrank a fitting one on price.
- **Grouping in results:** cluster by part type and collapse OEM/aftermarket variants of the same function so the buyer compares within a group rather than scrolling duplicates.

---

## 5. Scan / photo-to-part & part-number lookup

- **OCR the data plate / serial number** to identify the *machine* (Mercedes PartScan pattern: barcode + QR + OCR + manual fallback). This is the highest-value scan use for ag — serial resolves config.
- **OCR a part number** off the old/broken part → resolve to your SKU + cross-references. This is more reliable than visual part recognition and should be the primary "scan" path.
- **AI photo-to-part** (Gear Snap / PartSnap / Car Part Identifier pattern) as a secondary aid when the user doesn't know the name — return a *ranked candidate list*, then confirm against the selected machine's diagram rather than auto-adding. Always let the user correct.
- Always provide **manual entry as a fallback** and show a confidence indicator on any scanned/AI result.

---

## 6. Concrete recommendations for EzParts (8–12)

1. **Build "My Machines" (garage) as the core primitive.** Persistent across sessions/devices, nicknamable, with machine image, model, and **serial number** on each card. Everything else filters through it.
2. **Make serial/PIN lookup the hero on-ramp**, with a dropdown fallback and a scan option. Show an inline "where's my serial plate?" photo/diagram — this is the #1 ag identification friction point.
3. **Never render a part without a fitment verdict.** Ship the three-state badge (Fits / May fit–confirm serial break / No data) on every card and a big "Fits your [machine]" banner on detail pages.
4. **Treat serial breaks as first-class.** Ag parts change by serial range far more than cars by trim. When a part is serial-dependent, show the covered range and require serial confirmation before "Fits" turns green.
5. **Offer both a category tree AND interactive exploded diagrams** per machine. The diagram (clickable hotspots → P/N, price, stock, add-to-cart) is the ag killer feature and slashes wrong-part orders.
6. **Cross-reference / interchange is table stakes.** Index OEM + competitor part numbers so any number a farmer reads off an old part resolves to your SKU. Expose the interchange list on the detail page.
7. **Show OEM vs. aftermarket side-by-side with a price delta** and a one-line "what's the difference." Farmers actively want the choice.
8. **Multi-seller price + availability compare** (PartsTech model): one part, a table of sellers with price, stock, distance/ETA, rating — let the buyer optimize for cheapest vs. fastest, critical during a harvest-season breakdown.
9. **Surface fulfillment urgency.** "In stock — ships today," "at [Dealer] 12 mi away — pickup today." Downtime cost is huge in ag; speed-to-part is a core value prop, not a footnote.
10. **Attach the machine to every cart line and order.** Enables trivial re-orders, accurate returns, and a per-machine maintenance/parts history.
11. **Add a guarantee + easy returns statement** ("Right-part guarantee — free return if a 'Fits' part doesn't fit"). eBay proved fit-confidence + guarantee directly reduces costly wrong-fit returns.
12. **Scan-the-part-number as primary scan path** (OCR), AI photo-ID as secondary with a confirm-against-diagram step and manual fallback. Never auto-add an AI guess to the cart.

---

## Sources

- [RockAuto catalog/vehicle selector overview](https://manuals.plus/m/5c3791ab15d197c68320fb354e1798fcfa26a5a02c36afaf68fae98bcd46a7b2)
- [eBay Motors new parts shopping tools](https://www.ebayinc.com/stories/news/ebay-motors-launches-new-tools-to-simplify-online-auto-parts-shopping/)
- [eBay "Fits Your Vehicle"](https://pages.ebay.ca/motors/fits-your-vehicle/) · [eBay Guaranteed Fit](https://pages.ebay.com/motors/ebay-guaranteed-fit)
- [Amazon takes on eBay Motors with fit assurance](https://chainstoreage.com/amazon-takes-ebay-motors-new-auto-parts-fit-assurance) · [Amazon Automotive fit finder](https://www.amazon.com/b?ie=UTF8&node=118598328011)
- [PartsTech wholesale lookup](https://partstech.com/software/wholesale-auto-parts/) · [PartsTech visual search / diagrams](https://partstech.com/resource/blog/revolutionizing-auto-parts-ordering-with-visual-tools-discover-the-partstech-visual-search-suite/)
- [NAPA auto parts / shop by make](https://www.napaonline.com/en/auto-parts) · [O'Reilly Auto Parts](https://www.oreillyauto.com/)
- [John Deere serial number lookup guide](https://blog.koenigequipment.com/john-deere-serial-number-lookup-complete-guide) · [Taylor & Messick JD parts search](https://www.taylormessick.com/parts/john-deere-parts-search/) · [GreenPartStore JD catalog](https://www.greenpartstore.com/John-Deere-Parts-Catalog.html)
- [Interactive parts diagrams on Shopify (Konfigr)](https://konfigr.com.au/articles/how-to-create-interactive-parts-diagrams-on-shopify-the-complete-guide) · [Parts Town interactive diagrams](https://www.partstown.com/interactive-diagrams) · [Documoto interactive catalogs](https://www.documoto.com/create-digital-parts-catalogs) · [Sana exploded-view](https://www.sana-commerce.com/blog/exploded-view/)
- [Mercedes-Benz PartScan (OCR/barcode/QR)](https://play.google.com/store/apps/details?id=com.daimler.partscan.android&hl=en_US) · [Gear Snap AI parts scanner](https://apps.apple.com/us/app/gear-snap-car-parts-ai-scanner/id6754518676) · [PartSnap](https://partsnapapp.com/)
- [Auto parts eCommerce best practices (Web Shop Manager)](https://webshopmanager.com/automotive-ecommerce/) · [I analyzed 100+ auto parts sites (Scube)](https://www.scubemarketing.com/blog/analyzing-automotive-parts-ecommerce-strategies-that-work) · [Cross-reference part numbers guide (Hedges)](https://hedgescompany.com/blog/2025/09/automotive-part-number-interchanges/)
