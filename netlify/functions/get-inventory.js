// Returns the SIGNED-IN dealer's own inventory listings, scoped by their auth
// token. An unauthenticated/non-dealer caller gets an empty list (no leak).
const { createClient } = require("@supabase/supabase-js");
const { getCaller } = require("./_auth.cjs");

exports.handler = async (event) => {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false, listings: [] }) };

  const caller = await getCaller(event);
  if (!caller || caller.role !== "dealer" || !caller.dealerId) {
    return { statusCode: 200, body: JSON.stringify({ configured: true, listings: [] }) };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("pn_norm, part_number, name, price, ship, stock, lead_days, active")
      .eq("dealer_id", caller.dealerId)
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    // Shape to the app's listing format.
    const listings = (data || []).map((r) => ({
      id: caller.dealerId + ":" + r.pn_norm, // stable id for delete
      pn: r.part_number, name: r.name, price: r.price, ship: r.ship,
      stock: r.stock, dealer: caller.dealerName, fromDb: true,
    }));
    return { statusCode: 200, body: JSON.stringify({ configured: true, listings }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
