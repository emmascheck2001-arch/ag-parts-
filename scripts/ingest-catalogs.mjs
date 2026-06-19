#!/usr/bin/env node
// ============================================================================
// Batch fitment ingestion — the firehose.
//
// Eats a whole FOLDER of parts-catalog files (PDF / image), extracts fitment
// rows with Claude, and writes them straight into the Supabase index. This is
// the part-first, run-at-scale version of the one-file Extract UI: point it at
// a stack of aftermarket application guides (Donaldson, Baldwin, WIX, ...) and
// it fills thousands of machine→part relationships in one go.
//
// Reuses the EXACT schema + prompt from netlify/functions/extract-fitment.js
// and the upsert logic from netlify/functions/save-fitment.js, so the batch
// path and the UI path stay identical.
//
// Usage:
//   node scripts/ingest-catalogs.mjs [folder] [--dry-run] [--limit N]
//     folder      directory of catalog files (default: ./catalogs)
//     --dry-run   extract and print, but DON'T write to the database
//     --limit N   only process the first N files (handy for a test run)
//
// Env (auto-loaded from .env): ANTHROPIC_API_KEY, SUPABASE_URL,
//                              SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ── tiny .env loader (no extra dependency, works on any Node version) ────────
(function loadEnv(file = ".env") {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
})();

// ── extraction contract — identical to netlify/functions/extract-fitment.js ──
const SCHEMA = {
  type: "object",
  properties: {
    fitments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          part_number: { type: "string", description: "Exact part number as printed" },
          part_name: { type: "string" },
          make: { type: "string", description: "e.g. John Deere, Case IH" },
          model: { type: "string", description: "Machine model the part fits" },
          serial_range: { type: "string", description: "Serial/PIN applicability if shown, else empty" },
          position: { type: "string", description: "Where/how it's used, if shown" },
          qty: { type: "integer" },
          category: { type: "string" },
        },
        required: ["part_number", "part_name", "make", "model", "serial_range", "position", "qty", "category"],
        additionalProperties: false,
      },
    },
  },
  required: ["fitments"],
  additionalProperties: false,
};

const PROMPT =
  "This is an agricultural-equipment parts catalog or fitment page. Extract every part and the machine(s) it fits as structured rows. Use the EXACT part numbers shown on the page — never invent or guess a part number. Capture any serial/PIN applicability and position/usage if shown. If a field isn't on the page, return an empty string (or 1 for qty). Only include rows you can actually read.";

const MEDIA = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const normPn = (pn) => String(pn || "").toUpperCase().replace(/[\s-]/g, "");

// ── extract one file → fitment rows ─────────────────────────────────────────
async function extractFile(client, path) {
  const ext = extname(path).toLowerCase();
  const mediaType = MEDIA[ext];
  const data = readFileSync(path).toString("base64");
  const fileBlock =
    ext === ".pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data } };

  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: [fileBlock, { type: "text", text: PROMPT }] }],
  });
  const textBlock = msg.content.find((b) => b.type === "text");
  const parsed = JSON.parse(textBlock ? textBlock.text : "{}");
  return parsed.fitments || [];
}

// ── write rows → Supabase (mirror of save-fitment.js) ───────────────────────
async function writeRows(supabase, fitments, source) {
  let machinesWritten = 0, partsWritten = 0, fitmentsWritten = 0;
  const machineId = {}; // "make|model" -> id
  const partId = {};    // pn_norm -> id

  for (const r of fitments) {
    const make = (r.make || "").trim();
    const model = (r.model || "").trim();
    const pn = (r.part_number || "").trim();
    if (!pn) continue;

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

    const norm = normPn(pn);
    if (partId[norm] == null) {
      const { data } = await supabase
        .from("parts")
        .upsert(
          { part_number: pn, pn_norm: norm, name: r.part_name || pn, category: r.category || null },
          { onConflict: "pn_norm" }
        )
        .select("id")
        .single();
      partId[norm] = data ? data.id : null;
      if (data) partsWritten++;
    }
    const pId = partId[norm];

    if (mId && pId) {
      const { error } = await supabase
        .from("fitments")
        .upsert(
          {
            machine_id: mId, part_id: pId, position: r.position || null,
            qty: Number(r.qty) || 1, serial_note: r.serial_range || null,
            verified: false, source, confidence: 0.7,
          },
          { onConflict: "machine_id,part_id,serial_from,serial_to" }
        );
      if (!error) fitmentsWritten++;
    }
  }
  return { machinesWritten, partsWritten, fitmentsWritten };
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const limitArg = argv.indexOf("--limit");
  const limit = limitArg !== -1 ? parseInt(argv[limitArg + 1], 10) : Infinity;
  const folder = argv.find((a) => !a.startsWith("--") && a !== String(limit)) || "catalogs";

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!anthropicKey) {
    console.error("✗ ANTHROPIC_API_KEY is not set (add it to .env). Get one at console.anthropic.com.");
    process.exit(1);
  }
  if (!dryRun && (!url || !svc)) {
    console.error("✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (add to .env), or use --dry-run.");
    process.exit(1);
  }
  if (!existsSync(folder)) {
    console.error(`✗ Folder not found: ${folder}  (create it and drop catalog PDFs/images in)`);
    process.exit(1);
  }

  const files = readdirSync(folder)
    .filter((f) => MEDIA[extname(f).toLowerCase()])
    .sort()
    .slice(0, limit)
    .map((f) => join(folder, f));

  if (!files.length) {
    console.error(`✗ No supported files in ${folder}/ (looking for: ${Object.keys(MEDIA).join(", ")})`);
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: anthropicKey });
  const supabase = dryRun ? null : createClient(url, svc, { auth: { persistSession: false } });

  console.log(`\n📚 Ingesting ${files.length} file(s) from ${folder}/${dryRun ? "  [DRY RUN — no writes]" : ""}\n`);
  const totals = { rows: 0, machines: 0, parts: 0, fitments: 0, failed: 0 };

  for (const path of files) {
    const label = basename(path);
    process.stdout.write(`• ${label} … `);
    try {
      const rows = await extractFile(client, path);
      totals.rows += rows.length;

      if (dryRun) {
        console.log(`extracted ${rows.length} row(s)`);
        for (const r of rows.slice(0, 8)) {
          console.log(`    ${r.part_number}  ${r.make} ${r.model}  ${r.serial_range || ""}`);
        }
        if (rows.length > 8) console.log(`    … and ${rows.length - 8} more`);
        continue;
      }

      const w = await writeRows(supabase, rows, label);
      totals.machines += w.machinesWritten;
      totals.parts += w.partsWritten;
      totals.fitments += w.fitmentsWritten;
      await supabase.from("ingestion_sources").insert({ label, rows_written: w.fitmentsWritten });
      console.log(`+${w.fitmentsWritten} fitments  (+${w.machinesWritten} machines, +${w.partsWritten} parts)`);
    } catch (err) {
      totals.failed++;
      console.log(`✗ FAILED: ${err.message}`);
    }
  }

  console.log(`\n──────── done ────────`);
  console.log(`files:    ${files.length}  (${totals.failed} failed)`);
  console.log(`extracted ${totals.rows} rows`);
  if (!dryRun) {
    console.log(`written:  +${totals.fitments} fitments, +${totals.machines} machines, +${totals.parts} parts`);
    console.log(`\nReview AI-extracted rows in Supabase: they're verified=false, confidence=0.7.`);
  } else {
    console.log(`\n(dry run — nothing written. Re-run without --dry-run to ingest.)`);
  }
}

main().catch((e) => {
  console.error("\n✗ Fatal:", e.message);
  process.exit(1);
});
