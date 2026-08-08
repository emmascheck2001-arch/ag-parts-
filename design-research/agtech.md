# Ag-Tech & Farm App Design Research — for EzParts Redesign

Research on best-in-class ag/equipment mobile apps to inform the EzParts (ag parts finder + marketplace) redesign. Focus: what actually works for farmers on phones in the field.

---

## 1. Best examples (name + why it's good)

- **John Deere Operations Center + JD App** — Turns raw data into *decisions*: color-coded field maps and plain-language alerts instead of spreadsheets. Modular tiles, quick access to critical data on mobile. The gold standard for "reduce cognitive load."
- **Climate FieldView** — Real-time maps that build "as you drive the field." Designed around actual in-cab/in-field usage, not a desk. Strong at visualizing spatial data simply.
- **Tractor Zoom** — Best-in-class equipment *marketplace* UX: search by make/model or browse by category, side-by-side compare, favorites, saved searches, price-drop/new-listing alerts, ~20+ data fields and multiple photos per machine. Closest analog to EzParts.
- **Case IH AFS Connect** — Clean switching between map / field-list / vehicle-list views; equipment status data reachable in "a few taps." Good model for machine-centric navigation.
- **FBN (Farmers Business Network)** — Strong trust model (price transparency from 100k+ member farms, "Farmers First" branding); redesigned Market home into tappable tiles. *Cautionary note:* widely reviewed as slow/laggy — performance is a UX feature, not a nice-to-have.
- **Bushel / Bushel Farm** — Excellent at killing manual data entry (auto-populated data, digital tickets, integrations). Reinforces: farmers use data only when it shows up without typing.

---

## 2. Key visual/UX patterns that work for farmers (specific)

- **Design for midday sun in an open field, not a demo.** Test every screen in direct sunlight before shipping; consumer 400–600 nit screens are near-unreadable at ~80,000 lux, so contrast must compensate in software.
- **Large, glove-friendly touch targets.** Exceed the 48×48dp baseline. Combat/work gloves drop precision to ~20–25mm — aim for ~48–56px tappable, generous padding, no tiny "X" close buttons, inline text links, or map-pin handles as primary controls.
- **High contrast, never color-only status.** Minimum 4.5:1 body text; push critical text/status toward 7:1 (WCAG AAA). Pair color with an icon + label (e.g., a red X *and* the word "Out of stock").
- **Thumb-zone layout.** Put primary actions (search, buy, call dealer) in the bottom ~40% of the screen. Bottom tab bar beats a top hamburger menu.
- **Progressive disclosure / lead with the decision.** Show "This part fits your machine — in stock, ships today" first; let users drill into specs. Don't dump 20 spec fields up front.
- **Machine-centric organization.** Farmers think in *their equipment*. Let them save their machines (make/model/year/serial) and filter every part to "fits my equipment." Mirror Tractor Zoom's rich listing (multiple photos + structured spec fields).
- **Reduce typing hard.** VIN/serial/QR scan, voice search, smart defaults, saved searches, quick-select filters. Typing a part number in a dusty cab with gloves is the failure case.
- **Offline-first / graceful connectivity.** Rural dead zones are normal. Cache saved machines, recent searches, and cart; show connection status calmly; resync automatically.
- **Real photography > illustration for trust.** Farmers want to see the actual part and the actual land/machine. Stock/clip-art imagery reads as fake and kills credibility.
- **Explicit trust signals.** Fitment guarantee ("verified fits your model"), OEM vs aftermarket labeling, dealer name/location/ratings, in-stock counts, real prices, return policy, plain-English data/privacy language.
- **Performance is UX.** FBN's biggest complaint is slowness. Fast load and instant search results matter more than polish.

---

## 3. Color & typography recommendations (sunlight tradeoff)

**Light vs dark — the real answer:**
- For *pure direct-sunlight readability*, a **dark, high-saturation high-contrast theme** (white/near-white text on near-black, saturated status colors) is what ruggedized/tactical field apps recommend. Dark reduces glare wash-out and screen-vs-surroundings brightness mismatch.
- BUT the mainstream ag apps (JD, FieldView, FBN) ship **light UIs**, because on modern phones with auto-brightness a *very high-contrast light theme* (near-black text on white, ~7:1) is also readable and feels more trustworthy/commercial for a marketplace where product photos dominate.
- **Recommendation for EzParts:** ship a **light-first, extremely high-contrast** default (product photos and prices read best on light), and offer a **true dark/high-contrast "field mode" toggle** for in-cab/bright-sun use. Do not rely on mid-grays for text or borders in either mode.

**Color system:**
- **Anchor: agricultural green** (trust + category recognition) as brand, but keep it saturated/deep, not pastel, so it survives glare.
- **Accent: a confident blue or safety-orange/yellow** for primary actions and tech credibility (blue signals reliability/innovation; orange/yellow is high-visibility and reads in sun). Reserve one accent for the primary CTA only.
- **Status colors:** green = in stock / fits, amber = limited / check fitment, red = out of stock / won't fit — always paired with icon + text, never color alone.
- Avoid low-contrast tints, thin light-gray dividers, and subtle "elegant" grays — they vanish outdoors.

**Typography:**
- **Bold, clean sans-serif** for the whole UI (skip decorative serifs — this is a utility tool). System fonts (SF/Roboto) render sharp and load instantly.
- **Large base size:** body ~17–18pt minimum, prices/part numbers/CTAs larger and heavier. Readable at arm's length on a bright screen.
- Generous line height and spacing; short line lengths; left-aligned. Weight (semibold/bold) does more for sun readability than size alone.

---

## 4. Concrete recommendations for EzParts' redesign

1. **"My Equipment" as the backbone.** Onboarding = add your machines (make/model/year, VIN/serial scan). Every search/browse defaults to "fits my equipment," with a one-tap toggle to show all.
2. **Scan-first part finding.** Big camera/scan button for VIN, part number, or QR; add voice search. Make typing the fallback, not the default.
3. **Rich part listings (Tractor Zoom-style).** Multiple real photos, structured spec fields, OEM/aftermarket badge, fitment-verified badge, in-stock count, price, and dealer. No stock imagery.
4. **Fitment guarantee front and center.** Show "✓ Verified fits your [model]" (icon + text + color) as the top trust signal on every result and product page.
5. **Bottom tab nav + thumb-zone CTAs.** Tabs: Home / Search / My Equipment / Orders (or Saved) / Account. Primary buttons (Add to cart, Call dealer, Buy) pinned in the bottom 40%.
6. **Big glove targets everywhere.** ~48–56px minimum tappable, wide padding, full-width row taps in lists; no critical action smaller than a fingertip-with-glove.
7. **Field Mode toggle.** True dark, high-contrast, high-saturation theme for in-cab/direct-sun use, alongside a high-contrast light default.
8. **Offline resilience.** Cache saved machines, recent/saved searches, and cart; calm connection-status indicator; auto-resync. Never block browsing on connectivity.
9. **Decision-first cards.** Lead each result with the answer ("Fits • In stock • Ships today • $X"), specs collapsed below via progressive disclosure.
10. **Trust panel per dealer/seller.** Name, location, rating/reviews, response time, return policy — visible before purchase. Show real prices, no "call for pricing" dead ends.
11. **Speed as a hard requirement.** Instant search-as-you-type, fast image loading, skeleton loaders. Benchmark against FBN's slowness complaints and beat them.
12. **Saved searches + alerts.** Let farmers save a part/machine search and get notified on price drops, restocks, or new listings (Tractor Zoom's stickiest feature).

---

*Sources: [Ag App UI: 7 Field-Tested Principles](https://medium.com/@sneh_sagar/agriculture-app-ui-design-7-field-tested-principles-that-drive-real-farmer-adoption-3fbbbbb24cea), [Ruggedized/tactical field UX](https://corvusintell.com/blog/field-apps/ruggedized-ux-military-operators/), [JD Operations Center UX](https://koenigequipment.com/resources/technology-and-apps/operations-center), [Climate FieldView](https://apps.apple.com/us/app/climate-fieldview/id797902820), [Tractor Zoom app](https://tractorzoom.com/mobile-app), [Case IH AFS Connect](https://www.striptillfarmer.com/articles/3820-case-ih-updates-afs-connect-farm-platform), [FBN Market navigation](https://www.fbn.com/community/blog/market-app-navigation), [Bushel Farm](https://www.bushelpowered.com/agribusiness/solutions/farm-management), [Ag app color/typography guide](https://gapsystudio.com/blog/agriculture-app-design/), [Ag color palette](https://farmonaut.com/blogs/agriculture-color-palette-5-powerful-ways-farming-uses-blue).*
