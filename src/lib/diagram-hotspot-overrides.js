import { DIAGRAM_HOTSPOT_PAGES } from "../data/diagram-hotspot-pages";
import { normalizeDiagramAssetPath, resolveDiagramAssetUrl } from "./diagram-assets";

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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function defaultFallbackFrame() {
  return {
    x: 0.18,
    y: 0.12,
    width: 0.64,
    height: 0.54,
    previewCenterX: 0.50,
    previewCenterY: 0.35,
    previewScale: 2.1,
  };
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
          source: "manual",
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
const FALLBACK_FRAME_PROMISES = new Map();

export function listManualDiagramHotspotPages({ includeDraft = false } = {}) {
  return DIAGRAM_HOTSPOT_PAGES.filter((page) => includeDraft || page.status === "confirmed");
}

export function getManualDiagramHotspot(diagramUrl, ref) {
  const normalizedRef = String(ref || "").trim().toUpperCase();
  const normalizedUrl = normalizeDiagramUrl(diagramUrl);
  if (!normalizedUrl || !normalizedRef) return null;
  return HOTSPOT_INDEX.get(normalizedUrl)?.refs.get(normalizedRef) || null;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Diagram image could not be loaded: ${url}`));
    image.src = url;
  });
}

function rowRuns(rowCounts, threshold) {
  const runs = [];
  let start = null;
  for (let index = 0; index < rowCounts.length; index += 1) {
    if (rowCounts[index] >= threshold) {
      if (start == null) start = index;
      continue;
    }
    if (start != null) {
      runs.push([start, index - 1]);
      start = null;
    }
  }
  if (start != null) runs.push([start, rowCounts.length - 1]);
  return runs;
}

function deriveFallbackFrame(metrics) {
  const { width, height, rowCounts, rowMinX, rowMaxX } = metrics;
  const threshold = Math.max(2, Math.round(width * 0.012));
  const runs = rowRuns(rowCounts, threshold);
  const candidates = runs.length > 0 ? runs : [[0, height - 1]];

  let best = null;
  for (const [start, end] of candidates) {
    let minX = width - 1;
    let maxX = 0;
    let inkRows = 0;
    let totalInk = 0;
    for (let row = start; row <= end; row += 1) {
      if (rowCounts[row] <= 0) continue;
      inkRows += 1;
      totalInk += rowCounts[row];
      minX = Math.min(minX, rowMinX[row]);
      maxX = Math.max(maxX, rowMaxX[row]);
    }
    if (inkRows === 0 || maxX < minX) continue;

    const runHeight = end - start + 1;
    const runWidth = maxX - minX + 1;
    const averageInk = totalInk / Math.max(1, inkRows);
    const score =
      (runHeight / height) * 8 +
      (runWidth / width) * 1.5 +
      (1 - (start / height)) * 4 +
      (averageInk / width) * 2 -
      (start / height > 0.72 ? 2.5 : 0);

    if (!best || score > best.score) {
      best = { start, end, minX, maxX, score };
    }
  }

  if (!best) return defaultFallbackFrame();

  const padX = Math.max(2, Math.round((best.maxX - best.minX + 1) * 0.08));
  const padY = Math.max(2, Math.round((best.end - best.start + 1) * 0.10));
  const x = clamp((best.minX - padX) / width, 0, 0.96);
  const y = clamp((best.start - padY) / height, 0, 0.96);
  const right = clamp((best.maxX + padX + 1) / width, x + 0.02, 1);
  const bottom = clamp((best.end + padY + 1) / height, y + 0.02, 1);
  const frameWidth = right - x;
  const frameHeight = bottom - y;
  const centerX = x + (frameWidth / 2);
  const centerY = y + (frameHeight / 2);

  return {
    x,
    y,
    width: frameWidth,
    height: frameHeight,
    previewCenterX: centerX,
    previewCenterY: centerY,
    previewScale: clamp(0.92 / Math.max(frameWidth, frameHeight * 0.82), 1.65, 3.4),
  };
}

async function loadFallbackFrame(diagramUrl) {
  const normalizedUrl = normalizeDiagramUrl(diagramUrl);
  if (!normalizedUrl) return null;
  if (typeof window === "undefined" || typeof document === "undefined") {
    return defaultFallbackFrame();
  }
  if (!FALLBACK_FRAME_PROMISES.has(normalizedUrl)) {
    FALLBACK_FRAME_PROMISES.set(normalizedUrl, (async () => {
      const assetUrl = resolveDiagramAssetUrl(diagramUrl);
      if (!assetUrl) return defaultFallbackFrame();

      const image = await loadImage(assetUrl);
      const naturalWidth = image.naturalWidth || image.width || 1;
      const naturalHeight = image.naturalHeight || image.height || 1;
      const scale = Math.min(1, 256 / Math.max(naturalWidth, naturalHeight));
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return defaultFallbackFrame();
      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height).data;

      const rowCounts = new Array(height).fill(0);
      const rowMinX = new Array(height).fill(width - 1);
      const rowMaxX = new Array(height).fill(0);

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = ((y * width) + x) * 4;
          const alpha = imageData[index + 3];
          if (alpha < 24) continue;
          const luminance = (imageData[index] + imageData[index + 1] + imageData[index + 2]) / 3;
          if (luminance >= 245) continue;
          rowCounts[y] += 1;
          rowMinX[y] = Math.min(rowMinX[y], x);
          rowMaxX[y] = Math.max(rowMaxX[y], x);
        }
      }

      return deriveFallbackFrame({ width, height, rowCounts, rowMinX, rowMaxX });
    })().catch((error) => {
      FALLBACK_FRAME_PROMISES.delete(normalizedUrl);
      throw error;
    }));
  }

  return FALLBACK_FRAME_PROMISES.get(normalizedUrl);
}

export async function getEstimatedDiagramHotspot(diagramUrl, ref) {
  const normalizedRef = String(ref || "").trim().toUpperCase();
  const normalizedUrl = normalizeDiagramUrl(diagramUrl);
  if (!normalizedRef || !normalizedUrl) return null;
  const exact = HOTSPOT_INDEX.get(normalizedUrl)?.refs.get(normalizedRef);
  if (exact) return exact;
  const frame = await loadFallbackFrame(diagramUrl);
  if (!frame) return null;
  return {
    id: `fallback:${normalizedUrl}:${normalizedRef}`,
    ref: normalizedRef,
    source: "fallback",
    ...frame,
  };
}
