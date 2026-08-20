// Resolves the parts manual for a machine.
//
// The pinned source document recorded during ingest is the source of truth: it
// is the exact PDF a machine's part rows were read from, so it is always the
// right document to open. The legacy MACHINE_MANUALS name->URL table is only a
// fallback for machines that predate the verified catalog — it cannot tell
// OEM-badged variants apart (a Case IH and a New Holland D2 FM200 have
// different catalogs) and so must never win over the pinned document.
import { manualFor } from "../data/machine-manuals";

// Prefer the parts catalog the rows came from over an operator manual or a
// compiled dataset. Mirrors pickMachineSourceDocument in
// scripts/catalog/export-verified-machine-catalog.mjs.
const DOCUMENT_TYPE_RANK = { parts_catalog: 0, parts_manual: 1, operator_manual: 2 };

export function pickSourceDocument(documents) {
  const ranked = [...(documents || [])].sort((a, b) =>
    (DOCUMENT_TYPE_RANK[a.documentType] ?? 9) - (DOCUMENT_TYPE_RANK[b.documentType] ?? 9) ||
    String(a.title || "").localeCompare(String(b.title || ""))
  );
  return ranked[0] || null;
}

function isOpenableUrl(url) {
  // Absolute http(s), or a root-relative path we serve ourselves. A bare
  // relative path (e.g. "catalogs/diagrams/x.pdf") is an ingest-time path that
  // is not published, and would 404.
  return Boolean(url) && (/^https?:\/\//i.test(url) || url.startsWith("/"));
}

/**
 * @returns {{url: string|null, title: string, source: 'pinned'|'legacy'|null, available: boolean}}
 */
export function resolveMachineManual(machine) {
  if (!machine) return { url: null, title: "", source: null, available: false };

  const pinned = machine.sourceDocument;
  if (pinned && isOpenableUrl(pinned.sourceUrl)) {
    return {
      url: pinned.sourceUrl,
      title: pinned.title || "Pinned source catalog",
      source: "pinned",
      available: true,
    };
  }

  const legacyUrl = manualFor(machine.displayName, machine.manufacturer, machine.modelCode);
  if (isOpenableUrl(legacyUrl)) {
    return {
      url: legacyUrl,
      title: pinned?.title || "Manufacturer parts manual",
      source: "legacy",
      available: true,
    };
  }

  // Known document, no published copy — say so rather than shipping a dead link.
  return {
    url: null,
    title: pinned?.title || "",
    source: null,
    available: false,
  };
}
