// Writes a dealer's listing into the real supply tables (the "List a Part"
// flow's backend). Upserts the dealer, the part, the inventory row (price/
// stock), and fitments for the machines the dealer tagged. Service-role key,
// server-side only. Returns {configured:false} until SUPABASE_* are set.
const { createClient } = require("@supabase/supabase-js");
const { getCaller } = require("./_auth.cjs");
const { sendEmail } = require("./_email.cjs");
const normPn = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false }) };
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const b = JSON.parse(event.body || "{}");
    const pn = (b.pn || "").trim();
    // If a dealer is signed in, listings are forced to THEIR dealership — a
    // dealer can't list under another's name. (No token → falls back to the
    // posted name for demo/testing; require auth before production.)
    const caller = await getCaller(event);
    const dealerName = (caller && caller.role === "dealer" && caller.dealerName) ? caller.dealerName : (b.dealer || "").trim();
    if (!pn || !dealerName) return { statusCode: 400, body: JSON.stringify({ error: "dealer and pn required" }) };

    // 1) Dealer (set stripe account / contact if provided)
    const dealerRow = { name: dealerName };
    if (b.email) dealerRow.email = b.email;
    if (b.stripeAccountId) { dealerRow.stripe_account_id = b.stripeAccountId; dealerRow.status = "active"; }
    const { data: dealer } = await supabase
      .from("dealers").upsert(dealerRow, { onConflict: "name" }).select("id").single();
    const dealerId = dealer && dealer.id;

    // 2) Part
    const { data: part } = await supabase
      .from("parts").upsert({ part_number: pn, pn_norm: normPn(pn), name: b.name || pn, category: b.cat || null }, { onConflict: "pn_norm" })
      .select("id").single();
    const partId = part && part.id;

    // 3) Inventory (price/stock for this dealer+part)
    if (dealerId) {
      await supabase.from("inventory").upsert({
        dealer_id: dealerId, pn_norm: normPn(pn), part_number: pn, name: b.name || pn,
        price: Number(b.price) || 0, ship: Number(b.ship) || 0,
        stock: Number(b.stock) || 0, lead_days: Number(b.days) || 2, active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "dealer_id,pn_norm" });
    }

    // 4) Fitments for tagged machines (so the part shows up for those machines)
    let fitments = 0;
    const machines = Array.isArray(b.machines) ? b.machines : [];
    if (partId && machines.length) {
      const { data: allM } = await supabase.from("machines").select("id, make, model");
      const idByName = {};
      (allM || []).forEach((m) => { idByName[`${m.make} ${m.model}`.trim()] = m.id; });
      for (const nm of machines) {
        const mId = idByName[String(nm).trim()];
        if (!mId) continue;
        const { error } = await supabase.from("fitments").upsert(
          { machine_id: mId, part_id: partId, position: b.name || pn, qty: 1, verified: false, source: "dealer:" + dealerName, confidence: 0.9 },
          { onConflict: "machine_id,part_id,serial_from,serial_to" });
        if (!error) fitments++;
      }
    }

    // Demand loop: a farmer who searched for this part and left an email now
    // gets told it's available. Match by part number or name, only those not yet
    // notified, then stamp notified_at so we never email twice. Best-effort.
    let notified = 0;
    try {
      // Match by part number, plus the part name with commas/parens stripped —
      // those characters are PostgREST .or() delimiters and would break the query
      // (e.g. a name like "Fan, 6 Blade").
      const safeName = (b.name || "").replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
      const ors = [`query.ilike.%${pn}%`];
      if (safeName) ors.push(`query.ilike.%${safeName}%`);
      const { data: waiting } = await supabase
        .from("search_misses")
        .select("id, query, notify_email")
        .not("notify_email", "is", null)
        .is("notified_at", null)
        .or(ors.join(","));
      for (const w of waiting || []) {
        const r = await sendEmail({
          to: w.notify_email,
          subject: `The part you wanted is now on EzParts`,
          html: `<p>Good news — a dealer just listed <strong>${b.name || pn} (${pn})</strong>,
            which matches your search “${w.query}”.</p>
            <p>Open EzParts and search “${pn}” to see it and order.</p>`,
        });
        if (r.sent) {
          await supabase.from("search_misses").update({ notified_at: new Date().toISOString() }).eq("id", w.id);
          notified++;
        }
      }
    } catch { /* best-effort */ }

    return { statusCode: 200, body: JSON.stringify({ configured: true, dealerId, partId, fitments, notified }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
