import { Capacitor, registerPlugin } from "@capacitor/core";
import { resolveDiagramAssetUrl } from "./diagram-assets";
import { netlifyFunctionUrl } from "./netlify-functions";

const HardwareMeasure = registerPlugin("HardwareMeasure");
const diagramCalloutCache = new Map();

function normalizeTextValue(value) {
  return String(value || "").trim();
}

export function normalizeCalloutRef(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export async function getHardwareMeasureCapabilities() {
  const base = {
    isNativePlatform: Capacitor.isNativePlatform(),
    supportsReferenceSizing: true,
    supportsOnDeviceSizing: false,
    supportsArGuidance: false,
    supportsLidar: false,
    supportsVision: false,
      provider: "server",
      supportsDiagramCallouts: false,
  };

  if (!Capacitor.isNativePlatform()) return base;
  try {
    const native = await HardwareMeasure.getCapabilities();
    return { ...base, ...native };
  } catch (error) {
    console.warn("HardwareMeasure native capabilities unavailable", error);
    return base;
  }
}

export async function estimateHardwareMeasurements({
  measurementPhoto,
  referenceType,
  machineName,
  hardwareFamily,
  areaLabel,
  assemblyLabel,
}) {
  if (!measurementPhoto?.data) throw new Error("No measurement photo provided");

  const capabilities = await getHardwareMeasureCapabilities();
  if (capabilities.supportsOnDeviceSizing) {
    try {
      const native = await HardwareMeasure.estimateMeasurements({
        data: measurementPhoto.data,
        mediaType: measurementPhoto.mediaType,
        referenceType,
        machineName,
        hardwareFamily,
        areaLabel,
        assemblyLabel,
      });
      if (native?.usable) {
        return {
          provider: "native",
          capabilities,
          estimates: native.estimates || {},
          notes: normalizeTextValue(native.notes),
          confidence: native.confidence || "medium",
        };
      }
    } catch (error) {
      console.warn("HardwareMeasure native estimate failed, falling back to server", error);
    }
  }

  const response = await fetch(netlifyFunctionUrl("measure-hardware"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: measurementPhoto.data,
      mediaType: measurementPhoto.mediaType,
      referenceType,
      machineName,
      hardwareFamily,
      areaLabel,
      assemblyLabel,
      capabilities,
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
  if (json.configured === false) {
    throw new Error("Measurement estimation is not configured");
  }

  return {
    provider: json.provider || "server",
    capabilities,
    estimates: json.estimates || {},
    notes: normalizeTextValue(json.notes),
    confidence: json.confidence || "medium",
  };
}

export async function detectDiagramCallouts({ diagramUrl, refs = [] }) {
  const normalizedRefs = [...new Set(refs.map((value) => String(value || "").trim()).filter(Boolean))];
  if (!diagramUrl || normalizedRefs.length === 0) {
    return { supported: false, provider: "none", callouts: [], notes: "" };
  }

  const capabilities = await getHardwareMeasureCapabilities();
  if (!Capacitor.isNativePlatform() || !capabilities.supportsDiagramCallouts) {
    return { supported: false, provider: capabilities.provider || "server", callouts: [], notes: "" };
  }

  const cacheKey = `${diagramUrl}::${normalizedRefs.join("|")}`;
  if (!diagramCalloutCache.has(cacheKey)) {
    diagramCalloutCache.set(cacheKey, (async () => {
      const imagePayload = await loadDiagramImagePayload(diagramUrl);
      const native = await HardwareMeasure.detectDiagramCallouts({
        data: imagePayload.data,
        mediaType: imagePayload.mediaType,
        refs: normalizedRefs,
      });
      return {
        supported: Boolean(native?.usable),
        provider: "native",
        callouts: Array.isArray(native?.callouts) ? native.callouts : [],
        notes: normalizeTextValue(native?.notes),
      };
    })().catch((error) => {
      diagramCalloutCache.delete(cacheKey);
      throw error;
    }));
  }

  return diagramCalloutCache.get(cacheKey);
}

async function loadDiagramImagePayload(diagramUrl) {
  const response = await fetch(resolveDiagramAssetUrl(diagramUrl));
  if (!response.ok) throw new Error(`Diagram image failed to load (${response.status})`);
  const blob = await response.blob();
  const data = await blobToDataUrl(blob);
  if (blob.size <= 1_800_000) {
    return {
      data,
      mediaType: blob.type || "image/png",
    };
  }
  return {
    data: await resizeImageDataUrl(data, 1800),
    mediaType: "image/jpeg",
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Diagram image could not be read"));
    reader.readAsDataURL(blob);
  });
}

function resizeImageDataUrl(dataUrl, maxDimension) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
      const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Diagram image canvas is unavailable"));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    image.onerror = () => reject(new Error("Diagram image could not be resized"));
    image.src = dataUrl;
  });
}
