// Extract structured fitment rows from a parts-catalog page (image or PDF)
// using Claude Opus 4.8 with structured outputs. The SECRET ANTHROPIC_API_KEY
// is read from the Netlify env and never reaches the browser. Returns
// {configured:false} until the key is set.

const Anthropic = require("@anthropic-ai/sdk");
const { SCHEMA, PROMPT } = require("./_extract-contract.cjs");
const { SCAN_SCHEMA, scanPromptFor } = require("./_scan-contract.cjs");

const ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:3000",
  "https://ezparts.netlify.app",
]);

function response(statusCode, body, requestOrigin) {
  const origin = ALLOWED_ORIGINS.has(requestOrigin)
    ? requestOrigin
    : "https://ezparts.netlify.app";
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || "";
  if (event.httpMethod === "OPTIONS") return response(204, {}, requestOrigin);
  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method Not Allowed" }, requestOrigin);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return response(200, { configured: false }, requestOrigin);

  const client = new Anthropic({ apiKey: key });
  try {
    const { data, mediaType, mode, machineName } = JSON.parse(event.body || "{}");
    if (!data) return response(400, { error: "No file data provided" }, requestOrigin);

    const isPdf = (mediaType || "").includes("pdf");
    const fileBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: mediaType || "image/png", data } };

    const isPartPhoto = mode === "part-photo" && !isPdf;
    const msg = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: isPartPhoto ? 800 : 16000,
      output_config: { format: { type: "json_schema", schema: isPartPhoto ? SCAN_SCHEMA : SCHEMA } },
      messages: [{ role: "user", content: [fileBlock, { type: "text", text: isPartPhoto ? scanPromptFor(machineName) : PROMPT }] }],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    const parsed = JSON.parse(textBlock ? textBlock.text : "{}");
    return response(200, isPartPhoto
      ? { configured: true, candidates: parsed.candidates || [] }
      : { configured: true, fitments: parsed.fitments || [] }, requestOrigin);
  } catch (err) {
    console.error("extract-fitment failed", { name: err.name, status: err.status });
    return response(500, { error: "Photo recognition is temporarily unavailable" }, requestOrigin);
  }
};
