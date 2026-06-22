// Graded fit-confidence — how we know a part fits, not a blunt yes/no.
//
//   oem      ✓ listed in the machine's OEM parts manual (the authority)
//   ocr      ⚠ read from a SCANNED manual (OCR can misread a digit)
//   review   ⚠ web-sourced / cross-ref / malformed — confirm before ordering
//
// Demo-seed fitments are hand-curated, so they read as oem-grade.

export function fitTier(source, verified) {
  const s = (source || "").toLowerCase();
  if (s.startsWith("seed/")) return "oem";
  if (/vision|ocr/.test(s)) return verified ? "oem" : "ocr"; // verified OCR = OEM-corroborated
  if (/websearch|crossref/.test(s)) return "review";
  if (verified) return "oem";
  return "review";
}

// Per-tier display: short row tag + full badge copy.
export const TIER = {
  oem: {
    ok: true,
    mark: "✓",
    color: "var(--ag-green)",
    soft: "var(--ag-green-soft)",
    row: "✓ OEM",
    badge: "✓ Verified — listed in the OEM parts manual for this machine",
  },
  ocr: {
    ok: false,
    mark: "⚠",
    color: "var(--star)",
    soft: "rgba(245,180,40,0.12)",
    row: "⚠ Scan",
    badge: "⚠ From a scanned manual (OCR) — double-check the part # before ordering",
  },
  review: {
    ok: false,
    mark: "⚠",
    color: "var(--star)",
    soft: "rgba(245,180,40,0.12)",
    row: "⚠ Check",
    badge: "⚠ Unverified source — confirm this part # against your machine's serial before ordering",
  },
};

// A fitment's effective tier — uses the graded `tier` if present, else falls
// back to the legacy `verified` flag (demo-seed parts carry only `verified`).
const rowTier = (f) => f.tier || (f.verified ? "oem" : "review");

// Roll up a part's fitment list into one overall tier (worst wins).
export function partTier(fitment = []) {
  if (!fitment.length) return "review";
  if (fitment.some((f) => rowTier(f) === "review")) return "review";
  if (fitment.some((f) => rowTier(f) === "ocr")) return "ocr";
  return "oem";
}
