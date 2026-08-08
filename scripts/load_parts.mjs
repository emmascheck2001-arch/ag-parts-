// Load researched parts for the hero machines into Supabase: parts + fitments (part→machine) +
// crossrefs (OEM cross-reference for aftermarket parts). Reads catalogs/machines/parts_pilot.json
// (or a file passed as arg). Idempotent-ish: skips parts whose part_number already exists.
// Run: node scripts/load_parts.mjs [path-to-parts.json]
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n").filter(Boolean).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const URL_ = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const pnNorm = (s) => String(s || "").toUpperCase().replace(/[\s-]/g, "");
const file = process.argv[2] || new URL("../catalogs/machines/parts_pilot.json", import.meta.url);

const raw = JSON.parse(readFileSync(file, "utf8"));
console.log(`Loaded ${raw.length} researched parts from file.`);

// --- machine name -> id map
async function getJSON(path) { const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: H }); if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`); return r.json(); }
const machines = await getJSON("machines?select=id,make,model&limit=5000");
const mid = {};
machines.forEach((m) => { mid[`${m.make}|||${m.model}`] = m.id; });

// --- existing parts (so we don't duplicate) -> pn_norm -> id
const existing = await getJSON("parts?select=id,pn_norm&limit=100000");
const idByNorm = {};
existing.forEach((p) => { if (p.pn_norm) idByNorm[p.pn_norm] = p.id; });

// --- dedupe incoming parts by pn_norm; collect fitment pairs + crossrefs
const toInsert = [], fitPairs = [], crossByNorm = {};
const seen = new Set();
for (const p of raw) {
  const norm = pnNorm(p.part_number);
  if (!norm) continue;
  const machineId = mid[`${p.machine_make}|||${p.machine_model}`];
  if (machineId) fitPairs.push({ norm, machineId });
  if (p.is_oem === false && p.oem_crossref && pnNorm(p.oem_crossref) !== norm) {
    crossByNorm[norm] = { brand: p.machine_make, equiv_number: p.oem_crossref };
  }
  if (seen.has(norm) || idByNorm[norm]) continue;
  seen.add(norm);
  toInsert.push({ part_number: p.part_number, pn_norm: norm, name: p.name || p.part_number,
    category: p.category || "Other", brand: p.brand || "", is_oem: p.is_oem !== false });
}
console.log(`New parts to insert: ${toInsert.length} | fitment links: ${fitPairs.length}`);

// --- insert parts (return ids)
async function insertReturn(table, rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += 500) {
    const r = await fetch(`${URL_}/rest/v1/${table}`, { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(rows.slice(i, i + 500)) });
    if (!r.ok) throw new Error(`insert ${table}: ${r.status} ${await r.text()}`);
    out.push(...await r.json());
  }
  return out;
}
if (toInsert.length) {
  const inserted = await insertReturn("parts", toInsert);
  inserted.forEach((p) => { idByNorm[p.pn_norm] = p.id; });
  console.log(`  inserted ${inserted.length} parts`);
}

// --- fitments (dedupe machine+part)
const fitSeen = new Set(), fitRows = [];
for (const f of fitPairs) {
  const pid = idByNorm[f.norm]; if (!pid) continue;
  const k = `${pid}|${f.machineId}`; if (fitSeen.has(k)) continue; fitSeen.add(k);
  fitRows.push({ machine_id: f.machineId, part_id: pid, verified: true, source: "ezparts-catalog", qty: 1 });
}
async function insertMinimal(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const r = await fetch(`${URL_}/rest/v1/${table}`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(rows.slice(i, i + 500)) });
    if (!r.ok) throw new Error(`insert ${table}: ${r.status} ${await r.text()}`);
  }
}
if (fitRows.length) { await insertMinimal("fitments", fitRows); console.log(`  inserted ${fitRows.length} fitments`); }

// --- crossrefs (OEM number for aftermarket parts)
const crossRows = [];
for (const [norm, c] of Object.entries(crossByNorm)) {
  const pid = idByNorm[norm]; if (!pid) continue;
  crossRows.push({ part_id: pid, brand: c.brand, equiv_number: c.equiv_number });
}
if (crossRows.length) { await insertMinimal("crossrefs", crossRows); console.log(`  inserted ${crossRows.length} crossrefs`); }

console.log("✅ Parts load complete.");
