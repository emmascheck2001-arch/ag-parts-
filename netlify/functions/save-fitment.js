// Writes extracted fitment rows into the Supabase index (the ingestion step).
// Uses the SERVICE ROLE key (server-side only) to bypass RLS. Returns
// {configured:false} until SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.

const { createClient } = require("@supabase/supabase-js");

const normPn = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 200, body: JSON.stringify({ configured: false }) };

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { fitments, source } = JSON.parse(event.body || "{}");
    if (!Array.isArray(fitments) || !fitments.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No fitment rows" }) };
    }

    const src = source || "extractor";
    let machinesWritten = 0, partsWritten = 0, fitmentsWritten = 0;
    const machineId = {}; // "make|model" -> id
    const partId = {}; // pn_norm -> id

    for (const r of fitments) {
      const make = (r.make || "").trim();
      const model = (r.model || "").trim();
      const pn = (r.part_number || "").trim();
      if (!pn) continue;

      // Machine (only if make+model present)
      let mId = null;
      if (make && model) {
        const mk = make + "|" + model;
        if (machineId[mk] == null) {
          const { data } = await supabase
            .from("machines")
            .upsert({ make, model }, { onConflict: "make,model" })
            .select("id")
            .single();
          machineId[mk] = data ? data.id : null;
          if (data) machinesWritten++;
        }
        mId = machineId[mk];
      }

      // Part
      const norm = normPn(pn);
      if (partId[norm] == null) {
        const { data } = await supabase
          .from("parts")
          .upsert({ part_number: pn, pn_norm: norm, name: r.part_name || pn, category: r.category || null }, { onConflict: "pn_norm" })
          .select("id")
          .single();
        partId[norm] = data ? data.id : null;
        if (data) partsWritten++;
      }
      const pId = partId[norm];

      // Fitment
      if (mId && pId) {
        const { error } = await supabase
          .from("fitments")
          .upsert(
            {
              machine_id: mId, part_id: pId, position: r.position || null,
              qty: Number(r.qty) || 1, serial_note: r.serial_range || null,
              verified: false, source: src, confidence: 0.7,
            },
            { onConflict: "machine_id,part_id,serial_from,serial_to" }
          );
        if (!error) fitmentsWritten++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ configured: true, machinesWritten, partsWritten, fitmentsWritten }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
