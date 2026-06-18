// ─────────────────────────────────────────────────────────────────────────────
// Marketplace economics (single source of truth).
//
// Model: the DEALER is the seller. The farmer pays the dealer's listed price
// (+ shipping if shipped). The platform takes a commission on the PART PRICE
// only — never on shipping or tax — and that commission comes OUT of the
// dealer's payout (via a Stripe Connect application fee). The farmer is never
// charged more than buying from the dealer directly.
// ─────────────────────────────────────────────────────────────────────────────

// Platform commission on the part subtotal. Adjust to taste (5–15% is typical
// for parts marketplaces). 0.08 = 8%.
export const PLATFORM_FEE_RATE = 0.08;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Compute the money breakdown for an order from one dealer.
 * @param {Object} a
 * @param {number} a.partSubtotal  Sum of part prices (no shipping).
 * @param {number} a.shipping      Dealer's shipping cost (ignored for pickup).
 * @param {('ship'|'pickup')} a.fulfillment
 * @returns {{subtotal:number, shipping:number, customerTotal:number, platformFee:number, dealerPayout:number}}
 */
export function orderMath({ partSubtotal, shipping = 0, fulfillment = "ship" }) {
  const subtotal = round2(partSubtotal);
  const ship = fulfillment === "pickup" ? 0 : round2(shipping);
  const customerTotal = round2(subtotal + ship); // what the farmer pays
  const platformFee = round2(subtotal * PLATFORM_FEE_RATE); // our cut, from the dealer side
  const dealerPayout = round2(customerTotal - platformFee); // dealer receives (incl. shipping pass-through)
  return { subtotal, shipping: ship, customerTotal, platformFee, dealerPayout };
}

export const money = (n) =>
  "$" + (Number.isInteger(n) ? n : Number(n).toFixed(2));
