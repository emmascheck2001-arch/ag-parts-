// Stripe webhook — the authoritative "money actually arrived" signal. On
// payment_intent.succeeded it marks the matching order paid (by the orderId in
// the PaymentIntent metadata). Verifies the Stripe signature so it can't be
// spoofed. Set STRIPE_WEBHOOK_SECRET (whsec_...) in Netlify and point a Stripe
// webhook endpoint at /.netlify/functions/stripe-webhook.
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !whSecret || !url || !key) {
    return { statusCode: 200, body: JSON.stringify({ configured: false }) };
  }
  const stripe = Stripe(secret);
  const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;

  let evt;
  try {
    evt = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` };
  }

  try {
    if (evt.type === "payment_intent.succeeded" || evt.type === "payment_intent.payment_failed") {
      const pi = evt.data.object;
      const orderRef = pi.metadata && pi.metadata.orderId;
      const status = evt.type === "payment_intent.succeeded" ? "paid" : "payment_failed";
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      if (orderRef) {
        await supabase.from("orders")
          .update({ status, stripe_payment_intent: pi.id })
          .eq("order_ref", orderRef);
      }
    }
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
