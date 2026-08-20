// Extract structured fitment rows from a parts-catalog page (image or PDF)
// using Claude Opus 4.8 with structured outputs. The SECRET ANTHROPIC_API_KEY
// is read from the Netlify env and never reaches the browser. Returns
// {configured:false} until the key is set.

const Anthropic = require("@anthropic-ai/sdk");
const { SCHEMA, PROMPT } = require("./_extract-contract.cjs");
const { SCAN_SCHEMA, scanPromptFor } = require("./_scan-contract.cjs");
const {
  enforceRateLimit,
  parseJsonBody,
  preflight,
  requireBase64Payload,
  response,
} = require("./_function-access.cjs");

const MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 9 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_PART_PHOTO_BYTES = 2 * 1024 * 1024;
const RATE_LIMIT_WINDOW_SECONDS = Number(process.env.EZPARTS_EXTRACT_WINDOW_SECONDS || 60 * 60);
const RATE_LIMIT_REQUESTS = Number(process.env.EZPARTS_EXTRACT_RATE_LIMIT || 30);

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || "";
  const optionsResponse = preflight(event);
  if (optionsResponse) return optionsResponse;
  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method Not Allowed" }, requestOrigin);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return response(200, { configured: false }, requestOrigin);

  const client = new Anthropic({ apiKey: key });
  try {
    await enforceRateLimit(event, {
      scopeName: "extract-fitment",
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      requestLimit: RATE_LIMIT_REQUESTS,
    });
    const { data, mediaType, mode, machineName } = parseJsonBody(event, {
      maxBodyBytes: MAX_REQUEST_BODY_BYTES,
    });
    const isPdf = (mediaType || "").includes("pdf");
    const isPartPhoto = mode === "part-photo" && !isPdf;
    requireBase64Payload(data, isPdf
      ? MAX_PDF_BYTES
      : isPartPhoto
        ? MAX_PART_PHOTO_BYTES
        : MAX_IMAGE_BYTES);

    const fileBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: mediaType || "image/png", data } };

    const msg = await client.messages.create({
      model: "claude-opus-5",
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
    if (err.statusCode) {
      return response(err.statusCode, { error: err.message, resetAt: err.meta?.resetAt || null }, requestOrigin);
    }
    console.error("extract-fitment failed", { name: err.name, status: err.status });
    return response(500, { error: "Photo recognition is temporarily unavailable" }, requestOrigin);
  }
};
