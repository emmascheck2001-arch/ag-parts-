// Exploded parts-diagram manifests (built by scripts/extract_diagrams.py and
// served from /public/diagrams). Loaded once at startup; lets the app show
// "your part is on this diagram page" — the OEM parts-catalog experience.
import { resolveDiagramAssetUrl } from "./diagram-assets";

let MANIFESTS = null; // { slug: {title, slug, pages, partToPage} }
let MACHINE_SLUG = {}; // machine name -> slug

const norm = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

export async function loadDiagrams() {
  try {
    const idx = await fetch(resolveDiagramAssetUrl("/diagrams/index.json")).then((r) => {
      if (!r.ok) throw new Error(`Diagram index request failed (${r.status})`);
      return r.json();
    });
    MACHINE_SLUG = idx.machines || {};
    const slugs = [...new Set(Object.values(MACHINE_SLUG))];
    const loaded = {};
    const manifests = await Promise.all(slugs.map(async (slug) => {
      try {
        const response = await fetch(resolveDiagramAssetUrl(`/diagrams/${slug}.json`));
        if (!response.ok) return null;
        return [slug, await response.json()];
      } catch { return null; }
    }));
    manifests.filter(Boolean).forEach(([slug, manifest]) => { loaded[slug] = manifest; });
    MANIFESTS = loaded;
    return true;
  } catch { return false; }
}

// Slug for a machine, if it has a diagram set.
export function diagramSlugFor(machineName) {
  return MACHINE_SLUG[machineName] || null;
}

// The diagram page image url for a machine + page.
export const diagramImage = (slug, page) => resolveDiagramAssetUrl(`/diagrams/${slug}/p${page}.png`);

function pageParts(manifest) {
  const byPage = {};
  for (const [partNumber, page] of Object.entries(manifest?.partToPage || {})) {
    (byPage[page] ||= []).push(partNumber);
  }
  return byPage;
}

function partPage(manifest, partNumber) {
  const normalizedPartNumber = norm(partNumber);
  for (const [candidate, page] of Object.entries(manifest?.partToPage || {})) {
    if (norm(candidate) === normalizedPartNumber) return page;
  }
  return null;
}

// Find every manual occurrence for a part, optionally restricted to machines
// it is already known to fit. Manufacturer scoping matters because a normalized
// part number is not globally unique.
export function diagramsForPart(partNumber, machineNames = []) {
  if (!MANIFESTS) return null;
  const allowedSlugs = new Set(
    machineNames.map((machineName) => MACHINE_SLUG[machineName]).filter(Boolean)
  );
  const restrictToMachines = machineNames.length > 0;
  const occurrences = [];
  for (const [slug, manifest] of Object.entries(MANIFESTS)) {
    if (restrictToMachines && !allowedSlugs.has(slug)) continue;
    const page = partPage(manifest, partNumber);
    if (page == null) continue;
    const machine = Object.keys(MACHINE_SLUG).find((name) => MACHINE_SLUG[name] === slug) || "";
    occurrences.push({
      slug, machine, title: manifest.title, page,
      img: diagramImage(slug, page),
    });
  }
  return occurrences;
}

// Backward-compatible single occurrence lookup.
export function diagramForPart(partNumber, machineNames = []) {
  return diagramsForPart(partNumber, machineNames)?.[0] || null;
}

// All diagram pages for a machine (for a machine-level diagram browser).
export function diagramPagesFor(machineName) {
  const slug = diagramSlugFor(machineName);
  if (!slug || !MANIFESTS?.[slug]) return null;
  const manifest = MANIFESTS[slug];
  const partsByPage = pageParts(manifest);
  return {
    slug,
    title: manifest.title,
    pages: manifest.pages.map((page) => ({
      page,
      img: diagramImage(slug, page),
      partNumbers: partsByPage[page] || [],
    })),
  };
}

// Locate a printed part number inside one machine's manual.
export function diagramPageForMachinePart(machineName, partNumber) {
  const slug = diagramSlugFor(machineName);
  const manifest = slug && MANIFESTS?.[slug];
  if (!manifest) return null;
  const page = partPage(manifest, partNumber);
  return page == null ? null : { slug, page, img: diagramImage(slug, page) };
}
