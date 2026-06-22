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
