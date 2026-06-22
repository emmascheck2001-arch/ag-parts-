// Exploded parts-diagram manifests (built by scripts/extract_diagrams.py and
// served from /public/diagrams). Loaded once at startup; lets the app show
// "your part is on this diagram page" — the OEM parts-catalog experience.

let MANIFESTS = null; // { slug: {title, slug, pages, partToPage} }
let MACHINE_SLUG = {}; // machine name -> slug

const norm = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

export async function loadDiagrams() {
  try {
    const idx = await fetch("/diagrams/index.json").then((r) => r.json());
    MACHINE_SLUG = idx.machines || {};
    const slugs = [...new Set(Object.values(MACHINE_SLUG))];
    const loaded = {};
    for (const slug of slugs) {
      try { loaded[slug] = await fetch(`/diagrams/${slug}.json`).then((r) => r.json()); } catch { /* skip */ }
    }
    MANIFESTS = loaded;
    return true;
  } catch { return false; }
}

// Slug for a machine, if it has a diagram set.
export function diagramSlugFor(machineName) {
  return MACHINE_SLUG[machineName] || null;
}

// The diagram page image url for a machine + page.
export const diagramImage = (slug, page) => `/diagrams/${slug}/p${page}.png`;

// Find a part's diagram (searches all loaded manuals). Returns {slug,title,page,img} or null.
export function diagramForPart(pn) {
  if (!MANIFESTS) return null;
  const n = norm(pn);
  for (const [slug, man] of Object.entries(MANIFESTS)) {
    const p2p = man.partToPage || {};
    // partToPage is keyed by original part number; match on normalized form too.
    let page = p2p[pn];
    if (page == null) {
      const hit = Object.keys(p2p).find((k) => norm(k) === n);
      if (hit) page = p2p[hit];
    }
    if (page != null) return { slug, title: man.title, page, img: diagramImage(slug, page) };
  }
  return null;
}

// All diagram pages for a machine (for a machine-level diagram browser).
export function diagramPagesFor(machineName) {
  const slug = diagramSlugFor(machineName);
  if (!slug || !MANIFESTS?.[slug]) return null;
  const man = MANIFESTS[slug];
  return { slug, title: man.title, pages: man.pages.map((p) => ({ page: p, img: diagramImage(slug, p) })) };
}
