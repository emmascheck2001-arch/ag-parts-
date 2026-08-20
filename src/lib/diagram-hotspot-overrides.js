import { DIAGRAM_HOTSPOT_PAGES } from "../data/diagram-hotspot-pages";
import { normalizeDiagramAssetPath } from "./diagram-assets";

function normalizeDiagramUrl(diagramUrl) {
  return normalizeDiagramAssetPath(diagramUrl)
    .replace(/\.(png|webp|jpg|jpeg)$/i, "");
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function hasCompleteHotspot(entry) {
  const hotspot = entry?.hotspot;
  return ["x", "y", "width", "height"].every((key) => isFiniteNumber(hotspot?.[key]));
}

function hasCompletePreview(entry) {
  const preview = entry?.preview;
  return ["centerX", "centerY", "scale"].every((key) => isFiniteNumber(preview?.[key]));
}

function buildHotspotIndex(pages = []) {
  const map = new Map();

  for (const page of pages) {
    if (page?.status !== "confirmed") continue;
    const refs = page?.refs && typeof page.refs === "object" ? Object.entries(page.refs) : [];
    const completeRefs = refs
      .filter(([, entry]) => hasCompleteHotspot(entry))
      .map(([ref, entry]) => {
        const normalizedRef = String(ref || "").trim().toUpperCase();
        return [normalizedRef, {
          id: `manual:${page.id}:${normalizedRef}`,
          ref: normalizedRef,
          x: Number(entry.hotspot.x),
          y: Number(entry.hotspot.y),
          width: Number(entry.hotspot.width),
          height: Number(entry.hotspot.height),
          previewCenterX: hasCompletePreview(entry) ? Number(entry.preview.centerX) : undefined,
          previewCenterY: hasCompletePreview(entry) ? Number(entry.preview.centerY) : undefined,
          previewScale: hasCompletePreview(entry) ? Number(entry.preview.scale) : undefined,
        }];
      });

    if (completeRefs.length === 0) continue;

    for (const diagramUrl of page.urls || []) {
      const normalizedUrl = normalizeDiagramUrl(diagramUrl);
      if (!normalizedUrl) continue;
      map.set(normalizedUrl, {
        page,
        refs: new Map(completeRefs),
      });
    }
  }

  return map;
}

const HOTSPOT_INDEX = buildHotspotIndex(DIAGRAM_HOTSPOT_PAGES);

export function listManualDiagramHotspotPages({ includeDraft = false } = {}) {
  return DIAGRAM_HOTSPOT_PAGES.filter((page) => includeDraft || page.status === "confirmed");
}

export function getManualDiagramHotspot(diagramUrl, ref) {
  const normalizedRef = String(ref || "").trim().toUpperCase();
  const normalizedUrl = normalizeDiagramUrl(diagramUrl);
  if (!normalizedUrl || !normalizedRef) return null;
  return HOTSPOT_INDEX.get(normalizedUrl)?.refs.get(normalizedRef) || null;
}
