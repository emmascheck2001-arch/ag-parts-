# PartFinder AG — Project Guide for Claude Code

One search across every ag parts supplier. Farmers find the right part, at the
lowest price, without phoning John Deere, New Holland, and Case IH one at a time.

---

## ⛔ RULE 0 — THIS PROJECT IS INDEPENDENT FROM THE HORMONE APP

This is a **separate application**. It shares nothing with the Em-power / hormone
health app.

- **NEVER** read from, import from, copy code out of, or reference the hormone app
  folder (`~/Desktop/hormone app/`).
- **NEVER** reuse the hormone app's Supabase project, API keys, or Netlify site ID.
- This app has its **own** Supabase project, **own** Netlify site, **own** git repo.
- If you are ever unsure which project you are in, STOP and ask. Do not guess.
- Only operate on files inside this folder (`~/Desktop/partfinder-ag/`).

---

## What this app is

A parts search + price comparison app for farmers. Core promises, in priority order:

1. **Never the wrong part.** Fitment to the farmer's specific machine is verified
   before a part is shown as a match. "VERIFIED FIT" means we have confirmed the
   part number fits that make/model — not "probably fits."
2. **Lowest price, automatically.** Search results default to sorted-by-price.
   The cheapest in-stock option gets the BEST PRICE badge. No manual comparison.
3. **One search, every supplier.** The farmer types a part number, machine, or
   description once. We fan out across all sources we have data for.

If a change ever weakens one of these three promises, flag it instead of shipping it.

---

## Tech stack

- **Frontend:** React + Vite. No vanilla single-file HTML — the UI is split into
  small component files (one per screen) so edits stay surgical and design doesn't
  get clobbered by whole-file rewrites. (This is the deliberate fix for the pain on
  the hormone app.)
- **Styling:** plain CSS with CSS-variable tokens in `src/styles.css` — the single
  source of design truth. No Tailwind, no CSS-in-JS. Edit a token in one place.
- **Backend / DB:** Supabase (its OWN new project — see Rule 0).
- **Hosting:** Netlify (its OWN new site). Vite builds to `dist/`.
- **PWA-capable** (manifest + service worker) so farmers can add it to a phone.

## Project structure

Keep this layout. One screen = one file. This is what keeps edits surgical.

```
partfinder-ag/
├── CLAUDE.md
├── index.html              # minimal Vite entry
├── package.json
├── vite.config.js
├── netlify.toml
├── .env                    # Supabase keys — gitignored, NOT the hormone app's
├── public/
│   └── manifest.json       # PWA
└── src/
    ├── main.jsx
    ├── App.jsx             # screen state + bottom nav (the router)
    ├── styles.css          # CSS-variable design tokens (single source of truth)
    ├── lib/
    │   └── supabase.js     # Supabase client
    ├── data/
    │   └── demo.js         # DEMO seed data (clearly labeled)
    ├── components/         # small reusable pieces
    │   ├── TopBar.jsx
    │   ├── BottomNav.jsx
    │   ├── SupplierCard.jsx
    │   ├── PartRow.jsx
    │   └── Badge.jsx
    └── screens/            # ONE FILE PER SCREEN
        ├── Home.jsx
        ├── Categories.jsx
        ├── SearchResults.jsx
        ├── PartDetails.jsx
        ├── Checkout.jsx
        ├── OrderTracking.jsx
        ├── MachineDetails.jsx
        ├── Scan.jsx
        └── HowItWorks.jsx
```

Navigation for the MVP is a simple `screen` state in `App.jsx` (no react-router
needed yet). Add react-router later only if deep links / browser back become needed.

### Deploy

```
Project folder:  /Users/emmascheck/Desktop/ag parts/
Supabase URL:    https://tzbrrbryfu.supabase.co
Supabase Key:    (saved in .env)
Netlify site ID: shiny-otter-df5b7d
Live URL:        https://shiny-otter-df5b7d.netlify.app
Deploy command:  npm run build && netlify deploy --site shiny-otter-df5b7d --prod
```
Supabase URL:    <NEW_SUPABASE_URL>
Supabase anon:   <NEW_SUPABASE_ANON_KEY>
```

---

## Design system

**DARK THEME** — pulled from the approved mockups. Treat these as fixed tokens —
do not invent new colors or restyle components without being asked.

```
--ag-green:        #2fb04a   /* primary: buttons, active nav, verified, best price, prices */
--ag-green-dark:   #259a3e   /* hover / pressed */
--ag-green-soft:   rgba(47,176,74,.14)  /* badge fills, best-price card tint */
--bg:              #0f1311   /* page background (near-black, faint green-charcoal) */
--surface:         #181d1a   /* card surface */
--surface-2:       #1f2521   /* nested / elevated surface, inputs */
--border:          #2a322d   /* card borders, dividers */
--text:            #f3f5f3   /* primary text (near white) */
--text-muted:      #8a938c   /* secondary text, captions */
--price:           #2fb04a   /* price figures */
--oem:             #f5a623   /* OEM badge (amber) */
--star:            #f5a623   /* rating stars */
--track:           #6c5ce7   /* order-tracking accent only */
--danger:          #e0575b   /* errors, out-of-stock */
```

- **Type:** Inter (UI + body). Wordmark "PARTFINDER" in heavy weight, "AG" in green.
- **Cards:** `--surface`, 14px radius, 1px `--border`. Best-price card gets a green
  border + soft green tint. Generous padding.
- **Bottom nav:** Home · Search · Orders · Machines · Account. Active tab = green.
- **Badges:** VERIFIED FIT (green check + green text), BEST PRICE (green pill),
  OEM (amber pill).
- **Machine details tabs:** Overview · Parts · Maintenance · History. Active = green underline.
- Sentence case in UI; the wordmark stays "PARTFINDER AG". Buttons name the action:
  "Buy now", "Place order".

---

## Core product rules

1. **Fitment honesty.** Only render "VERIFIED FIT" when `fits_machine` is true for
   that part + machine pair. If fitment is unknown, show "Check fit" (neutral), never
   a green check.
2. **Price sorting.** Results sort by total landed price (part + shipping) ascending
   by default. BEST PRICE badge goes to the lowest in-stock total.
3. **No fabricated data.** Until real supplier data is wired in, all parts, prices,
   suppliers, and stock are clearly-labeled DEMO seed data. Never present demo
   numbers as if they were live supplier prices. Keep a visible "Demo data" marker
   while seeded.
4. **Stock + delivery are claims, not guarantees.** Phrase as "Ships in 2 days"
   from supplier feed; never promise a delivery date we can't source.
5. **Wrong-part prevention is the whole point.** Any feature touching search,
   matching, or fitment gets extra care. When in doubt, show fewer, more-certain
   matches rather than more guesses.

---

## Data model (high level — build the schema before the screens)

The value lives in the relationships, not the UI. Tables:

- `machines` — make, model, year, PIN, engine_hours (the farmer's garage).
- `parts` — part_number, name, category, description, image_url.
- `fitment` — which part fits which make/model (the "never wrong part" table).
- `suppliers` — name, rating, rating_count, ships_in_days, shipping_cost.
- `prices` — part_id, supplier_id, price, in_stock_qty, last_updated.
- `searches` — recent searches per user (for the home screen).
- `orders` + `order_events` — checkout and the tracking timeline.

Lowest-price = a query joining `parts` → `prices` → `suppliers`, ordered by
`price + shipping_cost`. Fitment filter = inner join on `fitment` for the selected
machine.

---

## Screens (matches the approved mockup)

1. **Home** — search bar; Scan Part / Search by Machine / Enter Part Number;
   My Machines row; Quick Categories.
2. **Browse Categories** — Engine, Hydraulic, Electrical, Filters, Belts, Bearings,
   Drivetrain, Cooling, Cab & Body.
3. **Search Results** — sorted lowest price; Filter; Sort; result cards with rating,
   stock, shipping, VERIFIED FIT, BEST PRICE.
4. **Part Details** — image; verified fit; condition / stock / est. delivery;
   price comparison across suppliers; Buy now / Save part.
5. **Checkout** — order summary, ship to, supplier, payment, Place order.
6. **Order Confirmation / Tracking** — confirmed → processing → shipped → out for
   delivery → delivered timeline.
7. **Machine Details** — machine photo; Overview / Parts / Maintenance / History
   tabs; "Common Parts" list with "From $X"; Maintenance Reminders (due-in cards).
8. **Scan Part** — camera frame placeholder; Photo Library / capture / Light.
9. **How it works** — 4 steps (Search → Compare → Buy → Shipped) + "Why PartFinder AG"
   value points. Onboarding / about screen.

---

## Working rules for Claude Code (read every session)

These exist because of pain on the other project. Follow them.

- **Make surgical edits. Edit the ONE component/screen file the change touches.**
  Do NOT rewrite whole files or restructure the folder tree unless explicitly asked.
  (One screen = one file exists precisely so this is easy — honor it.)
- **Never change the design tokens (`src/styles.css`) or restyle a finished
  component** without being asked. If a fix seems to need a token change, propose first.
- **Preserve what already works.** Before editing a screen, note what's already
  correct and keep it. Don't "improve" things that weren't part of the request.
- **One change at a time, then confirm** before moving on for anything visual.
- **Ask before schema changes.** Adding/renaming columns or tables → propose first.
- **No new dependencies** without asking. (React + Vite + Supabase client only,
  unless we agree to add something.)
- After a meaningful change, do a quick **farmer's-eye review**: would a farmer in a
  hurry, on a phone, with the wrong part costing them a day of downtime, get the
  right part at the right price without confusion? Fix anything that fails that.

---

## Demo / build order

1. Build the schema (tables above) first.
2. Seed DEMO data (clearly labeled) so screens have something to show.
3. Build screens in mockup order; keep everything clickable end-to-end.
4. Wire real supplier data LAST — start with one supplier you can actually get a
   price list from (e.g. Bourgault), then expand. Don't scrape dealer sites.
