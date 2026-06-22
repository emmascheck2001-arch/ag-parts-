// Grade every fitment by evidence strength and set verified/confidence honestly.
//
// The OEM parts manual is the AUTHORITY for what fits a machine, so a clean
// text-layer extraction from an OEM manual (with a valid part-number format) is
// treated as verified. OCR/vision data can have misread digits, so it stays
// unverified unless an independent OEM source corroborates the exact part on the
// same machine. Web-sourced / cross-ref / malformed entries are "needs review".
//
// Idempotent: re-running recomputes the same tiers. Mutates verified/confidence/
// last_verified only — never deletes.
//
//   node --env-file=.env scripts/verify_fitments.mjs          # dry run (counts only)
//   node --env-file=.env scripts/verify_fitments.mjs --write  # apply

const BASE = process.env.SUPABASE_URL, SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !SVC) { console.error("Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const WRITE = process.argv.includes("--write");
const h = { apikey: SVC, Authorization: "Bearer " + SVC, "Content-Type": "application/json" };

const page = async (t, cols) => {
  const out = [];
  for (let o = 0; ; o += 1000) {
    const r = await fetch(`${BASE}/rest/v1/${t}?select=${cols}`, { headers: { ...h, Range: `${o}-${o + 999}` } });
    const d = await r.json();
    if (!Array.isArray(d) || !d.length) break;
    out.push(...d);
    if (d.length < 1000) break;
  }
  return out;
};

// A real part number: starts alphanumeric, >=3 chars, contains a digit, only
// A-Z/0-9/-/. — kills OCR noise like "—", "see page 4", stray punctuation.
const validPN = (p) => /^[A-Za-z0-9][A-Za-z0-9.\-]{2,}$/.test(p || "") && /[0-9]/.test(p || "");

const isOcr = (s) => /vision|ocr/i.test(s || "");
const isOem = (s) => !isOcr(s) && (/\.pdf$/i.test(s || "") || /countryclipper|macdon|hagie|messicks|donaldson/i.test(s || ""));
const isWeb = (s) => /websearch|crossref/i.test(s || "");

(async () => {
  console.log(WRITE ? "WRITE mode\n" : "DRY RUN (use --write to apply)\n");
  const parts = await page("parts", "id,pn_norm");
  const pnNorm = {}; parts.forEach(p => pnNorm[p.id] = p.pn_norm);
  const fits = await page("fitments", "id,part_id,machine_id,source,verified,confidence");
  console.log(`loaded ${parts.length} parts, ${fits.length} fitments`);

  // Build the set of (pn_norm @ machine) pairs confirmed by an OEM manual.
  const oemPairs = new Set();
  for (const f of fits) {
    if (isOem(f.source) && validPN(pnNorm[f.part_id])) oemPairs.add(`${pnNorm[f.part_id]}@${f.machine_id}`);
  }

  // Assign a tier to each fitment.
  const tierOf = (f) => {
    const pn = pnNorm[f.part_id];
    if (f.source && f.source.startsWith("seed/")) return "confirmed";       // hand-curated demo
    if (!validPN(pn)) return "review";                                       // malformed PN (OCR noise)
    if (isOem(f.source)) return "oem";                                       // listed in OEM manual
    if (isOcr(f.source)) {
      return oemPairs.has(`${pn}@${f.machine_id}`) ? "oem" : "ocr";          // corroborated → oem
    }
    if (isWeb(f.source)) return "review";                                    // web-sourced, unconfirmed
    return "review";
  };

  // tier -> {verified, confidence}
  const SETTINGS = {
    confirmed: { verified: true,  confidence: 1.0 },
    oem:       { verified: true,  confidence: 0.95 },
    ocr:       { verified: false, confidence: 0.6 },
    review:    { verified: false, confidence: 0.3 },
  };

  const tally = {}, updates = [];
  for (const f of fits) {
    const t = tierOf(f);
    tally[t] = (tally[t] || 0) + 1;
    const want = SETTINGS[t];
    if (f.verified !== want.verified || Number(f.confidence) !== want.confidence) {
      updates.push({ id: f.id, ...want, _t: t });
    }
  }

  console.log("\nTIERS:");
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k.padEnd(10)} ${v}  (${SETTINGS[k].verified ? "✓ verified" : "⚠ unverified"}, conf ${SETTINGS[k].confidence})`);
  const willVerify = (tally.confirmed || 0) + (tally.oem || 0);
  console.log(`\n=> ${willVerify} fitments verified, ${fits.length - willVerify} unverified`);
  console.log(`   ${updates.length} rows need updating`);

  if (!WRITE) { console.log("\n(dry run — nothing written)"); return; }

  // PATCH in chunks grouped by target value (id=in list).
  const groups = {};
  for (const u of updates) {
    const key = `${u.verified}|${u.confidence}`;
    (groups[key] ||= []).push(u.id);
  }
  let done = 0;
  const now = new Date().toISOString();
  for (const [key, ids] of Object.entries(groups)) {
    const [verified, confidence] = key.split("|");
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const r = await fetch(`${BASE}/rest/v1/fitments?id=in.(${chunk.join(",")})`, {
        method: "PATCH", headers: { ...h, Prefer: "return=minimal" },
        body: JSON.stringify({ verified: verified === "true", confidence: Number(confidence), last_verified: now }),
      });
      if (!r.ok) { console.error("PATCH failed:", r.status, await r.text()); process.exit(1); }
      done += chunk.length;
      if (done % 2000 < 200) console.log(`  updated ${done}/${updates.length}…`);
    }
  }
  console.log(`\n✓ wrote ${done} updates.`);
})();
