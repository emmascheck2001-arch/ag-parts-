// Real device location for "near me" / distance. USER_LOCATION is a shared
// object the rest of the app reads at render time, so we mutate it in place when
// the browser returns a position (and cache it so repeat visits are instant).
import { USER_LOCATION } from "../data/demo";

const KEY = "ezparts_user_loc";

function apply(lat, lng, name) {
  USER_LOCATION.lat = lat;
  USER_LOCATION.lng = lng;
  if (name) USER_LOCATION.name = name;
}

// Restore a cached location synchronously (before first paint), then ask the
// browser for a fresh fix. Resolves true if the location changed (so the caller
// can re-render distances). Never throws / never blocks the app.
export function initLocation() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    if (c && typeof c.lat === "number") apply(c.lat, c.lng, c.name);
  } catch { /* ignore */ }

  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const changed = latitude !== USER_LOCATION.lat || longitude !== USER_LOCATION.lng;
        apply(latitude, longitude, "Your location");
        try { localStorage.setItem(KEY, JSON.stringify({ lat: latitude, lng: longitude, name: "Your location" })); } catch { /* ignore */ }
        resolve(changed);
      },
      () => resolve(false), // denied/unavailable → keep cached or default
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  });
}
