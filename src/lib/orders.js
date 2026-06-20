// Order persistence client. saveOrder() writes the order to the DB via the
// serverless function so it survives refresh and the dealer can see it. Safe
// no-op (returns null) when the backend isn't configured — the app keeps its
// in-memory copy either way.
import { supabase } from "./supabase";

async function authHeader() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: "Bearer " + token } : {};
  } catch { return {}; }
}

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

// The signed-in dealer's orders. Scoped server-side by the caller's auth token,
// so the dealer only gets their own (empty if not a signed-in dealer).
export async function fetchDealerOrders() {
  try {
    const res = await fetch("/.netlify/functions/get-orders", { headers: await authHeader() });
    if (!res.ok) return [];
    const j = await res.json();
    return j.orders || [];
  } catch {
    return [];
  }
}
