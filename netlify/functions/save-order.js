// Persists a placed order to the `orders` table (service-role). Called when the
// farmer confirms checkout, so the order survives a refresh and the dealer can
// see it. Returns {configured:false} until SUPABASE_* are set (app falls back
// to in-memory only).
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false }) };
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const o = JSON.parse(event.body || "{}");
    if (!o.orderId) return { statusCode: 400, body: JSON.stringify({ error: "orderId required" }) };
    const row = {
      order_ref: o.orderId,
      dealer_id: o.dealerId != null ? Number(o.dealerId) : null,
      buyer_email: o.email || null,
      buyer_phone: o.phone || null,
      ship_address: o.address || null,
      fulfillment: o.fulfillment || null,
      items: o.cart || o.items || [],
      subtotal: o.subtotal ?? null,
      shipping: o.shipping ?? null,
      total: o.total ?? null,
      platform_fee: o.platformFee ?? null,
      dealer_payout: o.dealerPayout ?? null,
      stripe_payment_intent: o.paymentIntent || null,
      status: o.paid ? "paid" : "pending",
    };
    const { data, error } = await supabase
      .from("orders").upsert(row, { onConflict: "order_ref" }).select("id, order_ref, status").single();
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ configured: true, order: data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
