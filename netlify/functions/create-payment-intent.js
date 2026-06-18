// Creates a Stripe PaymentIntent for an order.
//
// Money model (Stripe Connect destination charge):
//   - The farmer is charged the order total.
//   - If the dealer has a Connect account, the funds are routed to that
//     account (transfer_data.destination) and EzParts keeps the commission
//     (application_fee_amount).
//   - If no dealer account yet (demo), it falls back to a plain charge so the
//     payment rail can still be tested end-to-end.
//
// The SECRET key is read from the Netlify env var STRIPE_SECRET_KEY and never
// ships to the browser. Until that var is set, this returns {configured:false}
// and the app stays in demo mode.

const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    // Not set up yet — tell the client to use demo mode.
    return { statusCode: 200, body: JSON.stringify({ configured: false }) };
  }

  const stripe = Stripe(secret);

  try {
    const { amount, platformFee, dealerAccountId, metadata } = JSON.parse(event.body || "{}");
    const amountCents = Math.round(Number(amount) * 100);

    if (!Number.isFinite(amountCents) || amountCents < 50) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid amount" }) };
    }

    const params = {
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {},
    };

    // Route to the dealer + keep our commission, when the dealer is onboarded.
    if (dealerAccountId) {
      const feeCents = Math.round(Number(platformFee) * 100);
      if (Number.isFinite(feeCents) && feeCents >= 0 && feeCents < amountCents) {
        params.application_fee_amount = feeCents;
      }
      params.transfer_data = { destination: dealerAccountId };
    }

    const intent = await stripe.paymentIntents.create(params);

    return {
      statusCode: 200,
      body: JSON.stringify({ configured: true, clientSecret: intent.client_secret }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
