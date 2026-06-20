// Dealer inventory from Supabase — the real SUPPLY side (replaces the
// localStorage demo listings). Each part the farmer sees gets its sellers from
// here, and every seller carries its dealer's Stripe Connect account id so
// checkout can route the payout to the dealer and keep the platform fee.
import { supabase } from "./supabase";

let bySku = null; // pn_norm -> [supplier, ...]  (null until a successful load)

export function getInventorySuppliers() {
  return bySku;
}

// Suppliers for a single part number (normalized), or [] if none/unloaded.
export function suppliersForPn(pnNorm) {
  return (bySku && bySku[pnNorm]) || [];
}

export async function loadInventory() {
  try {
    const [invRes, dealRes] = await Promise.all([
      supabase.from("inventory").select("dealer_id, pn_norm, part_number, name, price, ship, stock, lead_days").eq("active", true),
      supabase.from("dealers").select("id, name, stripe_account_id, rating, status"),
    ]);
    const inv = invRes.data;
    if (invRes.error || !inv || !inv.length) return false; // empty → keep seed/demo suppliers

    const dealer = {};
    (dealRes.data || []).forEach((d) => { dealer[d.id] = d; });

    const map = {};
    for (const r of inv) {
      const d = dealer[r.dealer_id] || {};
      (map[r.pn_norm] ||= []).push({
        s: d.name || "Dealer",
        price: Number(r.price) || 0,
        ship: Number(r.ship) || 0,
        rating: d.rating != null ? Number(d.rating) : 4.7,
        n: 1,
        days: Number(r.lead_days) || 2,
        stock: Number(r.stock) || 0,
        dealerId: r.dealer_id,
        dealerAccountId: d.stripe_account_id || null, // → payout routing at checkout
        dealerActive: d.status === "active",
      });
    }
    // Cheapest first, in-stock preferred.
    for (const pn of Object.keys(map)) {
      map[pn].sort((a, b) => (b.stock > 0) - (a.stock > 0) || a.price - b.price);
    }
    bySku = map;
    return true;
  } catch {
    return false;
  }
}
