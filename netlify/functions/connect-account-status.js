// Returns onboarding/payout status for a dealer's Connect account.

const Stripe = require("stripe");

exports.handler = async (event) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { statusCode: 200, body: JSON.stringify({ configured: false }) };

  const stripe = Stripe(secret);
  try {
    const accountId =
      (event.queryStringParameters && event.queryStringParameters.accountId) ||
      JSON.parse(event.body || "{}").accountId;
    if (!accountId) {
      return { statusCode: 400, body: JSON.stringify({ error: "accountId required" }) };
    }

    const a = await stripe.accounts.retrieve(accountId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        configured: true,
        accountId: a.id,
        charges_enabled: a.charges_enabled,
        payouts_enabled: a.payouts_enabled,
        details_submitted: a.details_submitted,
        transfers: a.capabilities?.transfers || "inactive",
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
