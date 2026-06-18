// Dealer-supplied listings — the "Uber Eats menu" side. Dealers list the parts
// they sell and tag which machines each fits. Stored in the browser for the
// demo; in production this is the dealer's catalog in the database.

const KEY = "ezparts_listings";

export function getListings() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function addListing(listing) {
  const list = getListings();
  list.push({ id: "L" + list.length + "_" + listing.pn, ...listing });
  save(list);
}

export function removeListing(id) {
  save(getListings().filter((l) => l.id !== id));
}

// Convert dealer listings into PARTS-shaped entries. Each listing becomes a
// supplier on its part; the tagged machines become fitment rows. Multiple
// dealers listing the same part number merge into one part with many suppliers.
export function listingParts() {
  const byPn = {};
  for (const l of getListings()) {
    const pn = (l.pn || "").trim();
    if (!pn) continue;
    if (!byPn[pn]) {
      byPn[pn] = {
        name: l.name || pn,
        cat: l.cat || "Other",
        ic: "🧩",
        fits: (l.machines || []).join(", "),
        fitment: [],
        suppliers: [],
        dealerListed: true,
      };
    }
    const part = byPn[pn];
    part.suppliers.push({
      s: l.dealer || "Dealer",
      price: Number(l.price) || 0,
      ship: Number(l.ship) || 12,
      rating: 4.6,
      n: 1,
      days: Number(l.days) || 2,
      stock: Number(l.stock) || 1,
    });
    for (const m of l.machines || []) {
      if (!part.fitment.find((f) => f.machine === m)) {
        part.fitment.push({ machine: m, years: "", position: part.name, qty: 1, verified: false });
      }
    }
  }
  return byPn;
}
