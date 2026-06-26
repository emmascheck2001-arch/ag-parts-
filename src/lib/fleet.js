// "My Fleet" — the machines a user owns, saved locally so the app can jump
// straight to their parts. Lightweight (localStorage); no account required.

const KEY = "ezparts_fleet";

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
