// Returns the SIGNED-IN dealer's orders. Verifies the caller's Supabase token
// and scopes to their dealer_id — a dealer only sees their own orders, and an
// unauthenticated/non-dealer caller gets an empty list (no leak).
const { createClient } = require("@supabase/supabase-js");
const { getCaller } = require("./_auth.cjs");

exports.handler = async (event) => {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false, orders: [] }) };

  const caller = await getCaller(event);
  // Only a signed-in dealer with a resolved dealer record may read orders.
  if (!caller || caller.role !== "dealer" || !caller.dealerId) {
    return { statusCode: 200, body: JSON.stringify({ configured: true, orders: [] }) };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  try {
    const { data, error } = await supabase.from("orders").select("*")
      .eq("dealer_id", caller.dealerId)
      .order("created_at", { ascending: false }).limit(200);
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ configured: true, orders: data || [] }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
