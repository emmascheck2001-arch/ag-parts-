// Shared auth verifier for serverless functions. Validates the caller's
// Supabase access token (sent as `Authorization: Bearer <token>`) and resolves
// their dealer identity, so functions can scope data to the signed-in dealer.
// Returns null when there's no valid token.
const { createClient } = require("@supabase/supabase-js");

async function getCaller(event) {
  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return null;
  const authz = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  const token = authz.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  try {
    const sb = createClient(url, svc, { auth: { persistSession: false } });
    const { data: { user } = {}, error } = await sb.auth.getUser(token);
    if (error || !user) return null;
    const { data: profile } = await sb.from("profiles").select("role, dealer_name").eq("id", user.id).single();
    let dealerId = null;
    if (profile && profile.dealer_name) {
      const { data: d } = await sb.from("dealers").select("id").eq("name", profile.dealer_name).single();
      dealerId = d ? d.id : null;
    }
    return { userId: user.id, role: profile && profile.role, dealerName: profile && profile.dealer_name, dealerId };
  } catch {
    return null;
  }
}

module.exports = { getCaller };
