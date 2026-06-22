// Store cross-references for parts. Input is a JSON map:
//   { "<OEM part_number>": [ ["Brand","EquivNumber"], ... ], ... }
// Looks up each part by pn_norm, inserts crossrefs (skipping dupes). Cross-refs
// are GUIDANCE (the part page already says "confirm specs") — we only store
// sane, validated lists, never the 200-item over-broad scrape dumps.
//
//   node --env-file=.env scripts/crossref_ingest.mjs data.json [--write]

import { readFileSync } from "node:fs";

const BASE = process.env.SUPABASE_URL, SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WRITE = process.argv.includes("--write");
const file = process.argv[2];
const h = { apikey: SVC, Authorization: "Bearer " + SVC, "Content-Type": "application/json" };
const norm = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

const page = async (t, c) => {
  const o = [];
  for (let f = 0; ; f += 1000) {
    const r = await fetch(`${BASE}/rest/v1/${t}?select=${c}`, { headers: { ...h, Range: `${f}-${f + 999}` } });
    const d = await r.json(); if (!d.length) break; o.push(...d); if (d.length < 1000) break;
  }
  return o;
};

(async () => {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const parts = await page("parts", "id,part_number,pn_norm");
  const byNorm = {}; parts.forEach((p) => (byNorm[p.pn_norm || norm(p.part_number)] = p.id));
  const existing = await page("crossrefs", "part_id,equiv_number");
  const have = new Set(existing.map((c) => `${c.part_id}|${norm(c.equiv_number)}`));

  const rows = [];
  let missing = 0;
  for (const [pn, refs] of Object.entries(data)) {
    const pid = byNorm[norm(pn)];
    if (!pid) { console.log(`  ?? part not found: ${pn}`); missing++; continue; }
    let added = 0;
    for (const [brand, equiv] of refs) {
      if (norm(equiv) === norm(pn)) continue;          // skip self
      const key = `${pid}|${norm(equiv)}`;
      if (have.has(key)) continue;                     // skip dupes
      have.add(key);
      rows.push({ part_id: pid, brand, equiv_number: equiv });
      added++;
    }
    console.log(`  ${pn}: +${added} cross-refs`);
  }
  console.log(`\n${rows.length} new cross-ref rows (${missing} parts not found)`);
  if (!WRITE) { console.log("(dry run — use --write)"); return; }

  for (let i = 0; i < rows.length; i += 200) {
    const r = await fetch(`${BASE}/rest/v1/crossrefs`, { method: "POST", headers: { ...h, Prefer: "return=minimal" }, body: JSON.stringify(rows.slice(i, i + 200)) });
    if (!r.ok) { console.error("insert failed", r.status, await r.text()); process.exit(1); }
  }
  console.log(`✓ inserted ${rows.length} cross-refs`);
})();
