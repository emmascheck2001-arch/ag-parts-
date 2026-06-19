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
import { createRequire } from "node:module";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Shared extraction contract (CommonJS) — same SCHEMA + PROMPT the UI extractor
// uses, so batch and UI paths can't drift.
const require = createRequire(import.meta.url);
const { SCHEMA, PROMPT } = require("../netlify/functions/_extract-contract.cjs");

// ── tiny .env loader (no extra dependency, works on any Node version) ────────
(function loadEnv(file = ".env") {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
})();

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
async function extractFile(client, path, model) {
  const ext = extname(path).toLowerCase();
  const mediaType = MEDIA[ext];
  const data = readFileSync(path).toString("base64");
  const fileBlock =
    ext === ".pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data } };

  const msg = await client.messages.create({
    model,
    max_tokens: 16000, // big multi-page catalogs overflow a smaller cap -> truncated JSON

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
  const modelArg = argv.indexOf("--model");
  // Default to Haiku 4.5 — ~5x cheaper than Opus and plenty for clean filter
  // PDFs. Override with --model claude-opus-4-8 for dense/messy catalogs.
  const model = modelArg !== -1 ? argv[modelArg + 1] : "claude-haiku-4-5";
  // Values consumed by flags must not be mistaken for the folder arg.
  const flagValues = new Set([String(limit), model]);
  const folder = argv.find((a) => !a.startsWith("--") && !flagValues.has(a)) || "catalogs";

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

  console.log(`\n📚 Ingesting ${files.length} file(s) from ${folder}/ with ${model}${dryRun ? "  [DRY RUN — no writes]" : ""}\n`);
  const totals = { rows: 0, machines: 0, parts: 0, fitments: 0, failed: 0 };

  for (const path of files) {
    const label = basename(path);
    process.stdout.write(`• ${label} … `);
    try {
      const rows = await extractFile(client, path, model);
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
