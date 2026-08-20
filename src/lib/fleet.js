// "My Fleet" — the machines a user owns, saved locally so the app can jump
// straight to their parts. Lightweight (localStorage); no account required.

const KEY = "ezparts_fleet";
const VERIFIED_KEY = "ezparts_verified_fleet_v1";

export function getFleet() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function inFleet(machineName) {
  return getFleet().includes(machineName);
}

export function toggleFleet(machineName) {
  const f = getFleet();
  const next = f.includes(machineName) ? f.filter((m) => m !== machineName) : [...f, machineName];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function saveFleetMachine(machineName) {
  const f = getFleet();
  if (f.includes(machineName)) return f;
  const next = [...f, machineName];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function removeFleetMachine(machineName) {
  const next = getFleet().filter((m) => m !== machineName);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// Source-backed machines use stable model IDs instead of display-name identity.
// Keep the saved fleet separate from the catalog: this array says which machines
// the farmer owns, while the normalized pilot catalog remains the source of truth
// for model names, types, assemblies, and parts.
export function getVerifiedFleet() {
  try {
    const rows = JSON.parse(localStorage.getItem(VERIFIED_KEY) || "[]");
    if (!Array.isArray(rows)) return [];
    const seen = new Set();
    return rows.filter((row) => {
      if (!row?.modelId || seen.has(row.modelId)) return false;
      seen.add(row.modelId);
      return true;
    });
  } catch {
    return [];
  }
}

export function saveVerifiedMachine(modelId) {
  const now = new Date().toISOString();
  const current = getVerifiedFleet();
  const existing = current.find((row) => row.modelId === modelId);
  const next = [
    {
      modelId,
      nickname: existing?.nickname || "",
      location: existing?.location || "",
      addedAt: existing?.addedAt || now,
      lastUsedAt: now,
    },
    ...current.filter((row) => row.modelId !== modelId),
  ];
  try { localStorage.setItem(VERIFIED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function removeVerifiedMachine(modelId) {
  const next = getVerifiedFleet().filter((row) => row.modelId !== modelId);
  try { localStorage.setItem(VERIFIED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function pruneVerifiedFleet(validModelIds = []) {
  const allowed = new Set(validModelIds.filter(Boolean));
  const next = getVerifiedFleet().filter((row) => allowed.has(row.modelId));
  try { localStorage.setItem(VERIFIED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// Engine hours per machine — drives the maintenance reminder so routine service
// becomes recurring demand. Stored locally; no account required.
const HKEY = "ezparts_fleet_hours";

export function getHours(machineName) {
  try { return JSON.parse(localStorage.getItem(HKEY) || "{}")[machineName] ?? null; } catch { return null; }
}

export function setHours(machineName, hours) {
  try {
    const all = JSON.parse(localStorage.getItem(HKEY) || "{}");
    all[machineName] = hours;
    localStorage.setItem(HKEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

// Standard service interval (hours). Returns how far into the current interval
// the machine is and how many hours until the next service.
export const SERVICE_INTERVAL = 250;
export function serviceStatus(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) return null;
  const into = h % SERVICE_INTERVAL;
  const until = into === 0 ? 0 : SERVICE_INTERVAL - into;
  return { until, due: until <= 25, interval: SERVICE_INTERVAL };
}
