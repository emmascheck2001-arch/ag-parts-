// Dealer onboarding: create a Stripe Connect (Express) account and an
// onboarding link. Reuses an existing account id if one is passed (to resume
// onboarding). The connected account needs the `transfers` capability so we
// can route destination-charge funds to it.

const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { statusCode: 200, body: JSON.stringify({ configured: false }) };

  const stripe = Stripe(secret);
  try {
    const { accountId, email, origin } = JSON.parse(event.body || "{}");
    const base = origin || `https://${event.headers.host}`;

    let acct = accountId;
    if (!acct) {
      const created = await stripe.accounts.create({
        type: "express",
        email: email || undefined,
        capabilities: { transfers: { requested: true } },
        business_profile: {
          product_description: "Agricultural equipment replacement parts",
        },
      });
      acct = created.id;
    }

    const link = await stripe.accountLinks.create({
      account: acct,
      refresh_url: `${base}/?screen=dealer&onboard=refresh`,
      return_url: `${base}/?screen=dealer&onboard=return`,
      type: "account_onboarding",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ configured: true, accountId: acct, url: link.url }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
