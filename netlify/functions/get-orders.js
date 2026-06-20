// Returns orders for the dealer dashboard (service-role read, since orders are
// not publicly readable). Optional ?dealerId= filter.
//
// ⚠️ NOT auth-scoped yet — any caller can read. Before production, gate this
// behind dealer authentication (Supabase Auth) so a dealer only sees their own
// orders. See GO-LIVE.md.
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false, orders: [] }) };
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  try {
    const dealerId = (event.queryStringParameters || {}).dealerId;
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (dealerId) q = q.eq("dealer_id", Number(dealerId));
    const { data, error } = await q;
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ configured: true, orders: data || [] }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
