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
