const DIAGRAMS_ORIGIN = String(import.meta.env.VITE_DIAGRAMS_ORIGIN || "")
  .trim()
  .replace(/\/+$/, "");

function looksAbsolute(value) {
  return /^(?:https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:");
}

export function normalizeDiagramAssetPath(assetUrl) {
  const value = String(assetUrl || "").trim();
  if (!value) return "";
  if (value.startsWith("/")) return value;
  try {
    return new URL(value).pathname || value;
  } catch {
    return value;
  }
}

export function resolveDiagramAssetUrl(assetPath) {
  const value = String(assetPath || "").trim();
  if (!value || looksAbsolute(value)) return value;
  if (!DIAGRAMS_ORIGIN || !value.startsWith("/diagrams/")) return value;
  return `${DIAGRAMS_ORIGIN}${value}`;
}
