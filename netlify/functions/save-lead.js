// Records a demand signal / lead into search_misses, using the SERVICE ROLE key
// (server-side only) to bypass RLS. The browser can't safely upsert this table
// with the anon key (anon can insert but not update, and exposing update/select
// would leak every farmer's email), so the lead write goes through here.
//
// Returns {configured:false} until SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
// set, so the caller can fail silently in local/dev.

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false }) };

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { query, email, machine } = JSON.parse(event.body || "{}");
    const q = (query || "").trim();
    if (!q) return { statusCode: 400, body: JSON.stringify({ error: "Missing query" }) };

    // Upsert on the unique query. A bare miss just bumps the demand signal; a
    // notify (email present) also attaches the contact + machine.
    const row = { query: q };
    if (email) row.notify_email = String(email).trim();
    if (machine) row.machine = String(machine).trim();

    const { error } = await supabase
      .from("search_misses")
      .upsert(row, { onConflict: "query", ignoreDuplicates: false });
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ ok: true, lead: !!email }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
