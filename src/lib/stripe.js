import { loadStripe } from "@stripe/stripe-js";

// Publishable key is safe in the browser. When it's absent the app simply
// stays in demo mode (no real card step).
const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const STRIPE_ENABLED = Boolean(pk);
export const stripePromise = pk ? loadStripe(pk) : null;

/**
 * Ask the serverless function to create a PaymentIntent for this order.
 * Returns { configured: false } when the backend secret key isn't set yet,
 * or { clientSecret } when it is.
 */
export async function createPaymentIntent({ amount, platformFee, dealerAccountId, metadata }) {
  const res = await fetch("/.netlify/functions/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, platformFee, dealerAccountId, metadata }),
  });
  if (!res.ok) throw new Error("Payment setup failed (" + res.status + ")");
  return res.json();
}

// ── Dealer onboarding (Stripe Connect) ───────────────────────────────────────
export async function createConnectAccount({ accountId, email } = {}) {
  const res = await fetch("/.netlify/functions/create-connect-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId, email, origin: window.location.origin }),
  });
  if (!res.ok) throw new Error("Onboarding setup failed (" + res.status + ")");
  return res.json();
}

export async function getConnectStatus(accountId) {
  const res = await fetch(
    "/.netlify/functions/connect-account-status?accountId=" + encodeURIComponent(accountId)
  );
  if (!res.ok) throw new Error("Status check failed (" + res.status + ")");
  return res.json();
}

// For the demo, remember the onboarded dealer account in the browser so
// checkout can route the payment (and our fee) to it.
const DEALER_ACCT_KEY = "ezparts_dealer_acct";
export const getDealerAccount = () => {
  try { return localStorage.getItem(DEALER_ACCT_KEY) || null; } catch { return null; }
};
export const setDealerAccount = (id) => {
  try { id ? localStorage.setItem(DEALER_ACCT_KEY, id) : localStorage.removeItem(DEALER_ACCT_KEY); } catch { /* ignore */ }
};
