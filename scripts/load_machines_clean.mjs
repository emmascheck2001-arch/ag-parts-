// Fresh-start machine load. Wipes the jumbled parts/fitments + old machines and loads the clean,
// researched machine catalog (catalogs/machines/machines_research.json). Everything it deletes was
// backed up to backups/pre-machine-load/ first. Run: node scripts/load_machines_clean.mjs
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n").filter(Boolean).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const URL_ = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function delAll(table) {
  const r = await fetch(`${URL_}/rest/v1/${table}?id=not.is.null`, {
    method: "DELETE", headers: { ...H, Prefer: "return=minimal" },
  });
  if (!r.ok && r.status !== 404) throw new Error(`delete ${table}: ${r.status} ${await r.text()}`);
  console.log(`  cleared ${table}`);
}

async function insertBatch(table, rows) {
  const r = await fetch(`${URL_}/rest/v1/${table}`, {
    method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`insert ${table}: ${r.status} ${await r.text()}`);
}

const machines = JSON.parse(readFileSync(new URL("../catalogs/machines/machines_research.json", import.meta.url), "utf8"));
console.log(`Loaded ${machines.length} clean machines from research file.`);

console.log("Wiping old data (backed up in backups/pre-machine-load/)…");
await delAll("fitments");
await delAll("crossrefs");
await delAll("parts");
await delAll("machines");

console.log("Inserting clean machines…");
const rows = machines.map((m) => ({
  make: m.make, model: m.model, type: m.type,
  year_from: m.year_from ?? null, year_to: m.year_to ?? null, hp: m.hp ?? null,
}));
for (let i = 0; i < rows.length; i += 500) {
  await insertBatch("machines", rows.slice(i, i + 500));
  console.log(`  inserted ${Math.min(i + 500, rows.length)}/${rows.length}`);
}
console.log("✅ Done. Clean machine catalog loaded.");
