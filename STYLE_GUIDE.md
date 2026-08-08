# EZPARTS Product and Code Style Guide

This guide governs user-facing language, interaction design, React/CSS patterns,
accessibility, and maintainable presentation code.

## 1. Product character

EZPARTS should feel:

- practical;
- trustworthy;
- fast in a field/shop environment;
- technically accurate without requiring catalog expertise;
- calm when data is incomplete;
- optimized for mobile and gloved/one-handed use.

Do not use confidence theater. A green check, “verified,” “exact,” or “correct”
must correspond to a defined evidence state.

## 2. Current UI implementation

- React functional components under `src/components` and `src/screens`.
- Screen routing is local state in `src/App.jsx`.
- Global styling and tokens live in `src/styles.css`.
- Many screens also use inline style objects.
- `src/components/icons.jsx` contains reusable line icons.
- Mobile uses full viewport; desktop frames the app at a maximum 412px width.
- iOS safe areas are handled on `.phone` and `.botnav`.
- The current primary colors are a near-black/green agricultural palette.
- Some inactive marketplace, dealer, checkout, and order screens remain even
  though current `App.jsx` routes mainly search/machine flows.

Future work should consolidate repeated inline patterns into components/classes,
but broad mechanical restyling must be a separately reviewed task.

## 3. Visual tokens

The current source of truth is `:root` in `src/styles.css`:

```text
Primary green       --ag-green: #24b33f
Dark green          --ag-green-dark: #1d9735
Soft green          --ag-green-soft: rgba(36, 179, 63, 0.14)
Background          --bg: #050d0d
Card/surface        --card / --surface: #121a1a
Raised surface      --card-2 / --surface-2: #172021
Border              --border: #20302f
Primary text        --text: #f3f5f3
Muted text          --text-muted: #9aa29d
Danger              --danger: #d64545
Warning/star        --star: #f5a623
```

Rules:

- use tokens instead of introducing arbitrary nearby colors;
- add semantic tokens before repeating a new literal across components;
- do not use color alone for verification, errors, selection, or availability;
- verify contrast in the actual mobile simulator/browser;
- retain dark-theme consistency unless a full theme system is approved.

## 4. Layout and responsive behavior

- Mobile is the primary layout.
- Respect `100dvh` and both top/bottom safe areas.
- Bottom navigation must not cover scroll content.
- Preserve a comfortable touch target; target at least 44×44 CSS pixels for
  primary controls.
- Avoid fixed heights for text-heavy cards.
- Use a bounded render/page size for long part lists.
- At desktop widths, retain the phone preview only while that remains product
  direction; do not assume desktop catalog workflows will always use 412px.
- Test narrow phones, a representative modern iPhone simulator, larger text,
  and desktop preview.

## 5. Navigation hierarchy

The target catalog navigation is:

```text
Manufacturer
→ Machine Type
→ Model
→ Variant / Serial Range if needed
→ Major System
→ Subsystem
→ Assembly / Component Group
→ Individual Parts
```

Each screen stores IDs, not only display labels. Breadcrumbs must expose the
current path and permit safe back navigation without losing selection.

Do not flatten system/subsystem/assembly into a single “category” grid once the
normalized hierarchy is active.

## 6. Typography

- Current font stack: `Inter`, `system-ui`, sans-serif.
- Headings are short, direct, and sentence/title case according to context.
- Part numbers use a visually strong, selectable style and must not be truncated
  without an accessible full value.
- Avoid all-caps paragraphs; compact uppercase labels are acceptable for section
  eyebrows.
- Muted text is supplementary, never the only location for critical information.
- Support Dynamic Type/browser text scaling without clipped controls.

## 7. Product language

Preferred language:

- “Part number,” not ambiguous “number.”
- “Manufacturer,” “model,” “variant,” “serial/PIN range,” “system,” “subsystem,”
  and “assembly” according to their actual domain meaning.
- “Fits selected machine” only when fitment state permits it.
- “Source verified,” “candidate,” “serial range unknown,” or “assembly unresolved”
  when that is the truth.
- “Equivalent” and “superseded by” must remain distinct.

Avoid:

- “Guaranteed” unless backed by a real policy and eligible data;
- “OEM verified” for AI-extracted or aftermarket-researched records;
- “Exact part” when variant/serial scope is unknown;
- vague errors such as “Something went wrong” without a recovery action;
- internal terms such as `pn_norm`, UUID, foreign key, or staging candidate in
  farmer-facing copy.

## 8. Verification presentation

Every badge maps to one documented status. At minimum distinguish:

- verified by an approved source;
- candidate/unverified;
- rejected/deprecated (normally hidden from users);
- serial-specific with resolved range;
- source present but exact assembly unresolved.

Display source details on demand. Never infer manufacturer from machine fitment
for badge text when a resolved issuer exists.

## 9. Components

Use/reuse components for:

- top and bottom navigation;
- hierarchy breadcrumb;
- manufacturer/model/variant selectors;
- system/subsystem/assembly cards;
- part number and issuer display;
- verification/source badge;
- loading, empty, unavailable, and error states;
- paginated list/load-more controls;
- source/provenance disclosure.

Screen components orchestrate data and layout. Shared domain display logic should
not be copied across screens.

## 10. React conventions

- Functional components and hooks.
- One component per exported UI responsibility.
- Keep side effects in `useEffect` with cleanup/cancellation guards.
- Do not store derived data in state when `useMemo` or direct derivation is safer.
- Stable IDs are React keys. Part-number text is not a safe global key.
- Keep network state explicit: idle/loading/success/empty/error.
- Prevent stale responses from replacing newer search results.
- Do not call Supabase directly from many screen components; use an authoritative
  service/API layer.
- Avoid global mutable data arrays for normalized catalog behavior.
- Add error boundaries for critical screen trees when the test foundation exists.

## 11. CSS conventions

- Reuse CSS custom properties for semantic values.
- Use classes for repeated patterns; inline styles are acceptable for truly local
  calculated values during the current transition.
- Class names use kebab-case and domain/pattern meaning.
- Avoid selectors dependent on fragile DOM position.
- Keep animation subtle and respect `prefers-reduced-motion`.
- Hide scrollbars only when scrolling remains discoverable and usable.
- Avoid `!important` unless documenting a third-party override.
- Keep z-index values in a small documented scale if overlays are added.

## 12. Icons and imagery

- Prefer the existing coherent line icon set over mixed emoji for core navigation.
- Emoji may be temporary fallbacks but must not encode essential meaning alone.
- Images require meaningful `alt` text unless purely decorative (`alt=""`).
- Machine images must not imply an exact variant when the image is generic.
- Diagram images should expose page/figure/source context and lazy-load.
- Do not commit or publish vendor imagery without permission and provenance.

## 13. Forms and input

- Every input has a visible label or accessible name.
- Use correct `inputMode`, autocomplete, and keyboard behavior.
- Preserve formatting the user typed while normalizing only for lookup.
- Validate on submit and guide correction; do not erase input.
- Serial/PIN entry must explain accepted format and uncertainty.
- Buttons state their action: “Search parts,” “Choose this machine,” “View
  assembly,” not generic “Continue” when avoidable.
- Disable repeated submissions while an operation is pending.

## 14. Accessibility

Minimum standard:

- semantic buttons/links rather than clickable `div`s;
- keyboard navigation and visible focus;
- 44px touch targets for primary controls;
- meaningful headings in order;
- labels and `aria` attributes where native semantics are insufficient;
- text alternatives for images/icons;
- contrast that meets WCAG AA for normal text;
- no information conveyed only by color/emoji;
- reduced-motion support;
- screen-reader announcement for search result counts, loading, and errors;
- no focus trapped behind fixed bottom navigation.

The current code contains clickable cards/divs and limited focus styling. Treat
this as a documented inconsistency to fix incrementally.

## 15. Empty, loading, and error states

Differentiate:

- no machines/parts catalogued;
- no result for this query;
- no fitment for selected machine;
- no parts placed in this assembly;
- data unavailable/offline;
- serial/PIN could not be resolved;
- permission/authentication required.

Every error state offers a sensible next action. Do not present database failure
as a legitimate empty catalog.

## 16. Performance UX

- Show loading feedback quickly without layout thrash.
- Debounce natural-language search when queries occur per keystroke.
- Paginate or virtualize large lists; do not render thousands of part cards.
- Lazy-load diagrams and noncritical images.
- Keep tap/navigation response immediate even while detail data loads.
- Avoid loading all fitments or inventory during application startup.
- Measure bundle size and interaction latency after adding dependencies.

## 17. Security and privacy in UI

- Never render secrets or raw provider error payloads.
- Do not expose private dealer/order/search-lead data in public components.
- External links use `rel="noreferrer"`/appropriate protections.
- Clearly identify external documents/sites.
- Never trust hidden form fields for dealer, price, payout, or catalog identity.

## 18. UI testing checklist

- Build succeeds with `npm run build`.
- Home/search/machine/part routes render.
- Hierarchy selection retains IDs and breadcrumbs.
- Exact and natural-language search states render correctly.
- Loading/empty/error/unavailable states are distinct.
- Keyboard and screen reader basics work.
- Touch targets and safe areas work in iOS Simulator.
- 320–430px mobile widths and desktop preview are checked.
- Long manufacturer/model/part/assembly names wrap safely.
- Part numbers remain exact and selectable.
- No UI copy overstates verification.
