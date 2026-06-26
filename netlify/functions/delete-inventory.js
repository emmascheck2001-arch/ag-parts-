// Deactivates one of the SIGNED-IN dealer's inventory listings (soft delete:
// active=false, so the part stops showing to farmers). Scoped to the caller's
// dealer_id — a dealer can only remove their own listings.
const { createClient } = require("@supabase/supabase-js");
const { getCaller } = require("./_auth.cjs");
const normPn = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false }) };

  const caller = await getCaller(event);
  if (!caller || caller.role !== "dealer" || !caller.dealerId) {
    return { statusCode: 401, body: JSON.stringify({ error: "Sign in as a dealer" }) };
  }

  try {
    const { pn } = JSON.parse(event.body || "{}");
    const pnNorm = normPn(pn);
    if (!pnNorm) return { statusCode: 400, body: JSON.stringify({ error: "pn required" }) };
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase
      .from("inventory").update({ active: false, updated_at: new Date().toISOString() })
      .eq("dealer_id", caller.dealerId).eq("pn_norm", pnNorm);
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
