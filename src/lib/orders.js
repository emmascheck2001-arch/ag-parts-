// Order persistence client. saveOrder() writes the order to the DB via the
// serverless function so it survives refresh and the dealer can see it. Safe
// no-op (returns null) when the backend isn't configured — the app keeps its
// in-memory copy either way.
export async function saveOrder(order) {
  try {
    const res = await fetch("/.netlify/functions/save-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.configured ? j.order : null;
  } catch {
    return null;
  }
}

// Dealer's orders (service-role read via function). NOTE: not auth-scoped yet —
// gate behind dealer auth before production (see GO-LIVE.md).
export async function fetchDealerOrders(dealerId) {
  try {
    const res = await fetch("/.netlify/functions/get-orders?dealerId=" + encodeURIComponent(dealerId || ""));
    if (!res.ok) return [];
    const j = await res.json();
    return j.orders || [];
  } catch {
    return [];
  }
}
