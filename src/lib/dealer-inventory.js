// Client for the signed-in dealer's persisted inventory (the real listings in
// the database, as opposed to the localStorage demo cache). All calls are
// auth-scoped server-side to the dealer's own records.
import { supabase } from "./supabase";

async function authHeader() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: "Bearer " + token } : {};
  } catch { return {}; }
}

// The dealer's own listings from the DB ([] if not signed in / none / offline).
export async function fetchMyListings() {
  try {
    const res = await fetch("/.netlify/functions/get-inventory", { headers: await authHeader() });
    if (!res.ok) return [];
    const j = await res.json();
    return j.listings || [];
  } catch {
    return [];
  }
}

// Soft-delete one listing by part number. Returns true on success.
export async function deleteMyListing(pn) {
  try {
    const res = await fetch("/.netlify/functions/delete-inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ pn }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
