// Reads the current hand-loaded catalog (src/data/demo.js) and emits seed SQL
// for the Supabase fitment index. Run:  node scripts/generate-seed.mjs > FITMENT_SEED.sql
// Re-run any time to regenerate from demo.js.
import { MACHINES, PARTS } from "../src/data/demo.js";

const q = (s) => (s == null ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const num = (n) => (n == null || n === "" || Number.isNaN(Number(n)) ? "null" : Number(n));
const normPn = (pn) => pn.toUpperCase().replace(/[\s-]/g, "");

const MAKES = ["John Deere", "Case IH", "New Holland", "Kubota", "Massey Ferguson", "AGCO", "Fendt"];
function splitName(nm) {
  const make = MAKES.find((m) => nm.startsWith(m));
  return make ? { make, model: nm.slice(make.length).trim() } : { make: nm.split(" ")[0], model: nm };
}
function years(str) {
  const m = (str || "").match(/(\d{4}).*?(\d{4})/);
  return m ? { from: +m[1], to: +m[2] } : { from: null, to: null };
}
function brandOf(pn) {
  if (/^(RE|AR|AH|AL|DZ|TY|M|N|H)\d/i.test(pn)) return "John Deere";
  if (/^(84|85|87|58|47|1907)/.test(pn)) return "CNH (Case IH / New Holland)";
  return null;
}
// Known serial breaks (8R FT4 air filters switch at TSN 110760).
const SERIAL = {
  RE587793: { to: 110759, note: "TSN up to 110759" },
  RE587794: { to: 110759, note: "TSN up to 110759" },
  RE587791: { from: 110760, note: "TSN 110760 and up" },
  RE587792: { from: 110760, note: "TSN 110760 and up" },
};

// 1) Collect every machine referenced anywhere (MACHINES + fitment names).
const machines = new Map();
for (const m of MACHINES) {
  const y = years(m.year);
  machines.set(m.nm, { make: m.make || splitName(m.nm).make, model: m.model || splitName(m.nm).model, type: m.ty, year_from: y.from, year_to: y.to, hp: m.hp, image_url: m.img });
}
for (const part of Object.values(PARTS)) {
  for (const f of part.fitment || []) {
    if (!machines.has(f.machine)) {
      const s = splitName(f.machine);
      machines.set(f.machine, { make: s.make, model: s.model, type: null, year_from: null, year_to: null, hp: null, image_url: null });
    }
  }
}

const out = [];
out.push("-- Auto-generated from src/data/demo.js by scripts/generate-seed.mjs");
out.push("-- Run AFTER FITMENT_INDEX_SCHEMA.sql. Idempotent (on conflict do nothing).\n");

// 2) Machines
out.push("-- Machines");
for (const [, m] of machines) {
  out.push(
    `insert into machines (make, model, type, year_from, year_to, hp, image_url) values (` +
      `${q(m.make)}, ${q(m.model)}, ${q(m.type)}, ${num(m.year_from)}, ${num(m.year_to)}, ${q(m.hp)}, ${q(m.image_url)}) on conflict (make, model) do nothing;`
  );
}

// 3) Parts
out.push("\n-- Parts");
for (const [pn, part] of Object.entries(PARTS)) {
  out.push(
    `insert into parts (part_number, pn_norm, name, category, brand, is_oem) values (` +
      `${q(pn)}, ${q(normPn(pn))}, ${q(part.name)}, ${q(part.cat)}, ${q(brandOf(pn))}, true) on conflict (pn_norm) do nothing;`
  );
}

// 4) Fitments (resolve machine/part by natural key; carry serial breaks)
out.push("\n-- Fitments");
for (const [pn, part] of Object.entries(PARTS)) {
  const sb = SERIAL[normPn(pn)] || {};
  for (const f of part.fitment || []) {
    const s = splitName(f.machine);
    out.push(
      `insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)\n` +
        `select m.id, p.id, ${q(f.position)}, ${num(f.qty) || 1}, ${num(sb.from)}, ${num(sb.to)}, ${q(sb.note)}, ${f.verified ? "true" : "false"}, 'seed/demo', 1\n` +
        `from machines m, parts p where m.make=${q(s.make)} and m.model=${q(s.model)} and p.pn_norm=${q(normPn(pn))}\n` +
        `on conflict (machine_id, part_id, serial_from, serial_to) do nothing;`
    );
  }
}

// 5) Cross-references
out.push("\n-- Cross-references");
for (const [pn, part] of Object.entries(PARTS)) {
  for (const c of part.cross || []) {
    out.push(
      `insert into crossrefs (part_id, brand, equiv_number, source, confidence)\n` +
        `select p.id, ${q(c.brand)}, ${q(c.pn)}, 'seed/demo', 1 from parts p where p.pn_norm=${q(normPn(pn))}\n` +
        `on conflict (part_id, brand, equiv_number) do nothing;`
    );
  }
}

console.log(out.join("\n"));
