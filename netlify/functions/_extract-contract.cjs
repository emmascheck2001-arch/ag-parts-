// Shared extraction contract — the single source of truth for how we pull
// fitment rows out of a parts-catalog page. Used by both the one-file UI
// extractor (extract-fitment.js) and the batch ingester
// (scripts/ingest-catalogs.mjs) so the two paths can never drift.
//
// .cjs so it works as CommonJS for the Netlify functions AND can be imported
// by the ESM batch script (the project is "type":"module", which would
// otherwise treat a .js file as ESM and break the module.exports below).

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
          model: { type: "string", description: "ONE machine model only — never a list" },
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

const PROMPT = [
  "This is an agricultural-equipment parts catalog or fitment page. Extract every part and the machine(s) it fits as structured rows.",
  "",
  "Rules:",
  "- Use the EXACT part numbers shown on the page — never invent or guess a part number.",
  "- ONE model per row. If a single part fits several models listed together (e.g. \"4040, 4240, 4440\" or \"6105R / 6115R / 6125R\"), emit a SEPARATE row for each model, repeating the part details. Never put a list of models in the `model` field.",
  "- Expand a model only when the page actually names the members. Do NOT invent specific models from a series name — if the page only says \"6 Series Tractors\", keep that single generic entry.",
  "- `model` is just the model designation (e.g. \"4440\", \"6155R\", \"S680\") — do not prefix it with the make.",
  "- Capture any serial/PIN applicability and position/usage if shown. If a field isn't on the page, return an empty string (or 1 for qty).",
  "- Only include rows you can actually read.",
].join("\n");

module.exports = { SCHEMA, PROMPT };
