export function normalizeSerialLookupInput(value) {
  return String(value || "").trim().toUpperCase();
}

export function extractSerialLookupValue(value) {
  const normalized = normalizeSerialLookupInput(value);
  const compact = normalized.replace(/[^A-Z0-9]/g, "");
  const digitGroups = normalized.match(/\d+/g) || [];
  const prefixMatch = compact.match(/^([A-Z]+)\d/);
  return {
    raw: value,
    normalized,
    compact,
    prefix: prefixMatch?.[1] || null,
    lastDigits: digitGroups.length ? Number(digitGroups[digitGroups.length - 1]) : null,
  };
}

function normalizeRangeNote(note) {
  return String(note || "")
    .toUpperCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function isCleanSerialRangeNote(note) {
  const normalized = normalizeRangeNote(note);
  if (!normalized) return false;
  if (/^[A-Z]{2,}\s*#?\d{3,}\s+AND\s+(ABOVE|UP|HIGHER|BELOW|PRIOR|EARLIER)\b/.test(normalized)) return true;
  if (/^\d{3,}\s+AND\s+(ABOVE|UP|HIGHER|BELOW|PRIOR|EARLIER)$/.test(normalized)) return true;
  if (/^-\s*[A-Z]{0,4}\s*#?\d{3,}$/.test(normalized)) return true;
  if (/^[A-Z]{0,4}\s*#?\d{3,}\s*-\s*[A-Z]{0,4}\s*#?\d{3,}$/.test(normalized)) return true;
  if (/^[A-Z]{0,4}\s*#?\d{3,}\s*-$/.test(normalized)) return true;
  return false;
}

function buildParsedRange({ prefix = null, serialFrom = null, serialTo = null, note = "" }) {
  const parseBound = (value) => {
    if (value == null || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };
  return {
    prefix: prefix || null,
    serialFrom: parseBound(serialFrom),
    serialTo: parseBound(serialTo),
    note: String(note || "").trim(),
  };
}

export function parseSerialRangeNote(note) {
  const rawNote = String(note || "").trim();
  if (!rawNote) return null;
  const normalized = normalizeRangeNote(rawNote);
  let match = normalized.match(/\b([A-Z]{2,})\s*#?\s*(\d{3,})\b.*\b(AND ABOVE|AND UP|AND HIGHER)\b/);
  if (match) return buildParsedRange({ prefix: match[1], serialFrom: match[2], note: rawNote });

  match = normalized.match(/\b([A-Z]{2,})\s*#?\s*(\d{3,})\b.*\b(AND BELOW|AND PRIOR|AND EARLIER)\b/);
  if (match) return buildParsedRange({ prefix: match[1], serialTo: match[2], note: rawNote });

  match = normalized.match(/\b([A-Z]{2,})\s*#?\s*(\d{3,})\s*-\s*([A-Z]{0,})\s*(\d{3,})\b/);
  if (match && (!match[3] || match[3] === match[1])) {
    return buildParsedRange({ prefix: match[1], serialFrom: match[2], serialTo: match[4], note: rawNote });
  }

  match = normalized.match(/(?:^|[^\d])(\d{3,})\s*-\s*(\d{3,})(?:[^\d]|$)/);
  if (match) return buildParsedRange({ serialFrom: match[1], serialTo: match[2], note: rawNote });

  match = normalized.match(/\b([A-Z]{2,})\s*#?\s*(\d{3,})\s*-\s*(?:$|[A-Z])/);
  if (match) return buildParsedRange({ prefix: match[1], serialFrom: match[2], note: rawNote });

  match = normalized.match(/(?:^|[^\d])(\d{3,})\s*-\s*(?:$|[A-Z])/);
  if (match) return buildParsedRange({ serialFrom: match[1], note: rawNote });

  match = normalized.match(/^\s*-\s*([A-Z]{2,})?\s*#?\s*(\d{3,})\b/);
  if (match) return buildParsedRange({ prefix: match[1] || null, serialTo: match[2], note: rawNote });

  return null;
}

export function buildParsedSerialRanges(rows = []) {
  const seen = new Set();
  return rows.flatMap((row) => {
    const note = row?.applicabilityNote || row?.note || "";
    if (!isCleanSerialRangeNote(note)) return [];
    const parsed = parseSerialRangeNote(note);
    if (!parsed) return [];
    if (parsed.serialFrom != null && parsed.serialTo != null && parsed.serialFrom > parsed.serialTo) return [];
    const key = [parsed.prefix || "", parsed.serialFrom || "", parsed.serialTo || ""].join(":");
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      ...parsed,
      rangeCode: row?.rangeCode || null,
    }];
  });
}

export function doesSerialMatchRange(serialValue, range) {
  const serial = typeof serialValue === "string" ? extractSerialLookupValue(serialValue) : serialValue;
  const sequence = serial?.lastDigits;
  if (!Number.isFinite(sequence)) return false;
  if (serial?.prefix && !range.prefix) return false;
  if (range.prefix && serial?.prefix && range.prefix !== serial.prefix) return false;
  if (range.prefix && !serial?.prefix) return false;
  if (range.serialFrom != null && sequence < range.serialFrom) return false;
  if (range.serialTo != null && sequence > range.serialTo) return false;
  return range.serialFrom != null || range.serialTo != null;
}

function serialMatchScore(serial, range) {
  let score = 0;
  if (range.prefix && serial?.prefix === range.prefix) score += 1_000_000;
  if (range.serialFrom != null && range.serialTo != null) {
    const width = Math.max(0, range.serialTo - range.serialFrom);
    score += 500_000 - Math.min(width, 499_999);
  } else if (range.serialFrom != null) {
    score += 250_000 + Math.min(range.serialFrom, 249_999);
  } else if (range.serialTo != null) {
    score += Math.max(1, 250_000 - Math.min(range.serialTo, 249_999));
  }
  return score;
}

function serialRangeWidth(range) {
  if (range?.serialFrom != null && range?.serialTo != null) {
    return Math.max(0, range.serialTo - range.serialFrom);
  }
  return Number.POSITIVE_INFINITY;
}

function isDominantSerialMatch(topMatch, nextMatch) {
  if (!topMatch) return false;
  if (!nextMatch) return true;

  const scoreGap = (topMatch.matchScore || 0) - (nextMatch.matchScore || 0);
  const topWidth = serialRangeWidth(topMatch.bestMatch);
  const nextWidth = serialRangeWidth(nextMatch.bestMatch);
  const topBounded = Number.isFinite(topWidth);
  const nextBounded = Number.isFinite(nextWidth);

  if (scoreGap >= 100_000) return true;
  if (topBounded && !nextBounded && scoreGap >= 15_000) return true;
  if (topBounded && nextBounded && nextWidth >= (topWidth * 3) && scoreGap >= 20_000) return true;
  return false;
}

export function formatSerialRange(range) {
  const prefix = range?.prefix || "";
  if (range?.serialFrom != null && range?.serialTo != null) return `${prefix}${range.serialFrom} to ${prefix}${range.serialTo}`.trim();
  if (range?.serialFrom != null) return `${prefix}${range.serialFrom} and up`.trim();
  if (range?.serialTo != null) return `${prefix}${range.serialTo} and below`.trim();
  return range?.note || "Catalog serial note";
}

export function lookupVerifiedMachinesBySerial(serialIndex, serialInput) {
  const serial = extractSerialLookupValue(serialInput);
  if (!serial.normalized || !Number.isFinite(serial.lastDigits)) return [];
  const machines = serialIndex?.machines || [];
  const matches = machines.flatMap((machine) => {
    const matchedRanges = (machine.serialRanges || []).filter((range) => doesSerialMatchRange(serial, range));
    if (!matchedRanges.length) return [];
    const bestMatch = [...matchedRanges].sort((a, b) => serialMatchScore(serial, b) - serialMatchScore(serial, a))[0];
    return [{
      ...machine,
      bestMatch,
      matchedRanges,
      matchScore: serialMatchScore(serial, bestMatch),
    }];
  }).sort((a, b) =>
    b.matchScore - a.matchScore ||
    a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: "base" }));

  if (!matches.length) return [];

  const topMatch = matches[0];
  const nextMatch = matches[1] || null;
  if (isDominantSerialMatch(topMatch, nextMatch)) {
    return [{
      ...topMatch,
      matchConfidence: nextMatch ? "dominant" : "single",
    }];
  }

  return matches.map((match) => ({
    ...match,
    matchConfidence: "candidate",
  }));
}
