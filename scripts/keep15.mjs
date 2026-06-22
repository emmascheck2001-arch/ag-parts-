// Prune the fitment index down to 15 machines + their parts. Deletes everything
// else (machines, their fitments, now-orphaned parts + crossrefs). FK-safe order.
// A full backup was written to backups/ first — this is reversible.
//
//   node --env-file=.env scripts/keep15.mjs          # dry run
//   node --env-file=.env scripts/keep15.mjs --write  # apply

const BASE = process.env.SUPABASE_URL, SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !SVC) { console.error("missing supabase env"); process.exit(1); }
const WRITE = process.argv.includes("--write");
const h = { apikey: SVC, Authorization: "Bearer " + SVC, "Content-Type": "application/json" };

// The 15 to KEEP, by exact make + model. Built to the user's spec: variety +
// at least 4 fleet machines (Hagie 2100, Claas Xerion 3800, Case IH 7120,
// Versatile 9480), the rest the deepest/most-complete machines.
const KEEP = [
  // fleet (4)
  ["Hagie", "2100"], ["Claas", "Xerion 3800"], ["Case IH", "7120"], ["Versatile", "9480"],
  // deep Hagie + MacDon (5)
  ["Hagie", "STS 12"], ["Hagie", "STS 16"], ["Hagie", "DTS 10"], ["Hagie", "647-S, 647 SX"],
  ["MacDon", "FD70 FlexDraper Header"],
  // Country Clipper variety (6)
  ["Country Clipper", "SR110 Jazee One"], ["Country Clipper", "SR1220/SR1220L Boss"],
  ["Country Clipper", "Charger"], ["Country Clipper", "Boss XL"], ["Country Clipper", "Edge Series"],
  ["Country Clipper", "1525 Boss XL"],
];

const page = async (t, cols) => {
  const out = [];
  for (let o = 0; ; o += 1000) {
    const r = await fetch(`${BASE}/rest/v1/${t}?select=${cols}`, { headers: { ...h, Range: `${o}-${o + 999}` } });
    const d = await r.json();
    if (!Array.isArray(d) || !d.length) break;
    out.push(...d); if (d.length < 1000) break;
  }
  return out;
};
const del = async (t, filter) => {
  const r = await fetch(`${BASE}/rest/v1/${t}?${filter}`, { method: "DELETE", headers: { ...h, Prefer: "return=minimal" } });
  if (!r.ok) { console.error("DELETE failed", t, r.status, await r.text()); process.exit(1); }
};
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

(async () => {
  console.log(WRITE ? "WRITE mode\n" : "DRY RUN\n");
  const machines = await page("machines", "id,make,model");

  // Resolve keep ids; abort unless every entry matches exactly one machine.
  const keepIds = [];
  for (const [mk, md] of KEEP) {
    const hits = machines.filter((m) => m.make === mk && m.model === md);
    if (hits.length !== 1) { console.error(`!! "${mk} ${md}" matched ${hits.length} machines — aborting`); process.exit(1); }
    keepIds.push(hits[0].id);
  }
  if (keepIds.length !== 15) { console.error(`!! keep set is ${keepIds.length}, not 15 — aborting`); process.exit(1); }
  const keepSet = new Set(keepIds);
  const dropMachineIds = machines.filter((m) => !keepSet.has(m.id)).map((m) => m.id);
  console.log(`machines: keep 15, delete ${dropMachineIds.length}`);

  const allFits = await page("fitments", "id,machine_id,part_id");
  const keepFits = allFits.filter((f) => keepSet.has(f.machine_id));
  const keepPartIds = new Set(keepFits.map((f) => f.part_id));
  const allParts = await page("parts", "id");
  const dropPartIds = allParts.filter((p) => !keepPartIds.has(p.id)).map((p) => p.id);
  console.log(`fitments: keep ${keepFits.length}, delete ${allFits.length - keepFits.length}`);
  console.log(`parts: keep ${keepPartIds.size}, delete ${dropPartIds.length}`);

  if (!WRITE) { console.log("\n(dry run — nothing deleted)"); return; }

  // 1. fitments of dropped machines (by machine_id, FK child of machines+parts)
  for (const c of chunk(dropMachineIds, 100)) await del("fitments", `machine_id=in.(${c.join(",")})`);
  console.log("✓ deleted fitments for dropped machines");
  // 2. the dropped machines
  for (const c of chunk(dropMachineIds, 100)) await del("machines", `id=in.(${c.join(",")})`);
  console.log("✓ deleted dropped machines");
  // 3. crossrefs of orphaned parts (FK child of parts)
  for (const c of chunk(dropPartIds, 100)) await del("crossrefs", `part_id=in.(${c.join(",")})`);
  console.log("✓ deleted crossrefs for orphaned parts");
  // 4. the orphaned parts
  let done = 0;
  for (const c of chunk(dropPartIds, 100)) { await del("parts", `id=in.(${c.join(",")})`); done += c.length; if (done % 2000 < 100) console.log(`  …parts ${done}/${dropPartIds.length}`); }
  console.log("✓ deleted orphaned parts");

  // verify
  const m2 = await page("machines", "id"); const f2 = await page("fitments", "id"); const p2 = await page("parts", "id");
  console.log(`\nFINAL: machines ${m2.length} | parts ${p2.length} | fitments ${f2.length}`);
})();
