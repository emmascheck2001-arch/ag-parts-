// Recent searches, persisted in the browser. Replaces the old hardcoded RECENT
// list so "Clear all" actually clears, and real searches show up here.

const KEY = "ezparts_recent_searches";
const MAX = 8;

export function getRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Add a query to the front, de-duped (case-insensitive), capped at MAX.
export function addRecent(query) {
  const q = (query || "").trim();
  if (!q) return getRecent();
  const lower = q.toLowerCase();
  const next = [q, ...getRecent().filter((x) => x.toLowerCase() !== lower)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return [];
}
