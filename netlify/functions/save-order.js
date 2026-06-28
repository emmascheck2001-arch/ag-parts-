// Persists a placed order to the `orders` table (service-role). Called when the
// farmer confirms checkout, so the order survives a refresh and the dealer can
// see it. Returns {configured:false} until SUPABASE_* are set (app falls back
// to in-memory only).
const { createClient } = require("@supabase/supabase-js");
const { sendEmail } = require("./_email.cjs");
const normPn = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");
const money = (n) => "$" + (Number(n) || 0).toFixed(2);

// Fire the two order emails (farmer confirmation + dealer alert). Best-effort:
// looks up the dealer's email, never throws into the order flow.
async function sendOrderEmails(supabase, o) {
  const items = (Array.isArray(o.cart) ? o.cart : o.items) || [];
  const lines = items.map((it) => `${it.partName || it.name || "Part"} ×${it.qty || 1}`).join(", ");
  const fulfil = o.fulfillment === "pickup" ? "Pickup" : "Ship to farm";

  if (o.email) {
    await sendEmail({
      to: o.email,
      subject: `Your EzParts order ${o.orderId} is placed`,
      html: `<p>Thanks for your order!</p>
        <p><strong>Order ${o.orderId}</strong><br>${lines}<br>${fulfil} · Total ${money(o.total)}</p>
        <p>The dealer (${o.dealer || "your dealer"}) will confirm and fulfill it. We'll keep you posted.</p>`,
    });
  }
  // Dealer alert — look up the dealer's email by id.
  try {
    if (o.dealerId != null) {
      const { data: d } = await supabase.from("dealers").select("email, name").eq("id", Number(o.dealerId)).single();
      if (d && d.email) {
        await sendEmail({
          to: d.email,
          subject: `New EzParts order ${o.orderId}`,
          html: `<p>You have a new order on EzParts.</p>
            <p><strong>Order ${o.orderId}</strong><br>${lines}<br>${fulfil}<br>
            Your payout: ${money(o.dealerPayout)} (after ${money(o.platformFee)} fee)</p>
            <p>Customer: ${o.email || ""} ${o.phone || ""}${o.address ? "<br>" + o.address : ""}</p>`,
        });
      }
    }
  } catch { /* best-effort */ }
}

// Reduce inventory.stock by the ordered quantity for each line, per dealer+part.
// Read-modify-write (clamped at 0). Best-effort: a stock miss never fails the
// order. Called only the first time an order is saved (not on re-save).
async function decrementStock(supabase, order) {
  const items = Array.isArray(order.cart) ? order.cart : (Array.isArray(order.items) ? order.items : []);
  for (const it of items) {
    const pnNorm = normPn(it.pn || it.part_number);
    const dealerId = it.supplier?.dealerId ?? (order.dealerId != null ? Number(order.dealerId) : null);
    const qty = Number(it.qty) || 1;
    if (!pnNorm || dealerId == null) continue;
    try {
      const { data } = await supabase
        .from("inventory").select("stock").eq("dealer_id", dealerId).eq("pn_norm", pnNorm).single();
      if (!data) continue;
      const next = Math.max(0, (Number(data.stock) || 0) - qty);
      await supabase.from("inventory")
        .update({ stock: next, updated_at: new Date().toISOString() })
        .eq("dealer_id", dealerId).eq("pn_norm", pnNorm);
    } catch { /* best-effort */ }
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false }) };
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const o = JSON.parse(event.body || "{}");
    if (!o.orderId) return { statusCode: 400, body: JSON.stringify({ error: "orderId required" }) };

    // Fallback: derive the dealer id from the cart if the client didn't send it,
    // so the order still reaches the dealer's dashboard + alert email.
    if (o.dealerId == null) {
      const items = o.cart || o.items || [];
      const withId = items.find((it) => it.supplier?.dealerId != null);
      if (withId) o.dealerId = withId.supplier.dealerId;
    }

    // New order? (so stock is only decremented once, not on re-save)
    const { data: existing } = await supabase
      .from("orders").select("id").eq("order_ref", o.orderId).maybeSingle();
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

    // First save only: count stock down and send the order emails.
    if (!existing) {
      await decrementStock(supabase, o);
      await sendOrderEmails(supabase, o);
    }

    return { statusCode: 200, body: JSON.stringify({ configured: true, order: data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
