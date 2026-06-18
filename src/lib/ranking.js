// ─────────────────────────────────────────────────────────────────────────────
// Supplier ranking — deliberately NOT pure lowest-price.
//
// A price-only sort pushes dealers into a race to the bottom. Instead we blend
// price, distance, delivery speed, rating, and stock so a dealer can win by
// being close, fast, well-reviewed, and in-stock — not just cheapest. This
// keeps the marketplace attractive to dealers while still surfacing good value.
// ─────────────────────────────────────────────────────────────────────────────
import { SUPPLIERS_MAP, USER_LOCATION, calculateDistance } from "../data/demo";

export function supplierDistance(s) {
  const loc = SUPPLIERS_MAP[s.s];
  return loc
    ? calculateDistance(USER_LOCATION.lat, USER_LOCATION.lng, loc.lat, loc.lng)
    : null;
}

const WEIGHTS = { price: 0.4, distance: 0.2, speed: 0.2, rating: 0.15, stock: 0.05 };

// Returns suppliers sorted best-match first, each annotated with { distance }.
export function rankSuppliers(suppliers) {
  const list = suppliers.map((s) => ({ ...s, distance: supplierDistance(s) }));
  if (list.length <= 1) return list;

  const totals = list.map((s) => s.price + s.ship);
  const minT = Math.min(...totals);
  const maxT = Math.max(...totals);
  const maxD = Math.max(...list.map((s) => s.distance ?? 100), 1);

  const score = (s) => {
    const total = s.price + s.ship;
    const priceScore = maxT === minT ? 1 : 1 - (total - minT) / (maxT - minT); // cheaper → 1
    const distScore = 1 - Math.min(s.distance ?? maxD, maxD) / maxD; // closer → 1
    const speedScore = 1 / (s.days || 3); // faster → higher
    const ratingScore = (s.rating || 0) / 5;
    const stockScore = s.stock > 0 ? 1 : 0;
    return (
      WEIGHTS.price * priceScore +
      WEIGHTS.distance * distScore +
      WEIGHTS.speed * speedScore +
      WEIGHTS.rating * ratingScore +
      WEIGHTS.stock * stockScore
    );
  };

  return list
    .map((s) => ({ ...s, _score: score(s) }))
    .sort((a, b) => b._score - a._score);
}

// Lowest total (price + shipping) across the set — for an informational label.
export function lowestTotal(suppliers) {
  return Math.min(...suppliers.map((s) => s.price + s.ship));
}
