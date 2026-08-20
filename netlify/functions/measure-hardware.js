const Anthropic = require("@anthropic-ai/sdk");
const { MEASURE_SCHEMA, measurePromptFor } = require("./_measure-contract.cjs");

const ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:3000",
  "https://ezparts.netlify.app",
]);
const LOCAL_PREVIEW_ORIGIN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

function allowedOrigin(requestOrigin) {
  return ALLOWED_ORIGINS.has(requestOrigin) || LOCAL_PREVIEW_ORIGIN.test(requestOrigin)
    ? requestOrigin
    : "https://ezparts.netlify.app";
}

function response(statusCode, body, requestOrigin) {
  const origin = allowedOrigin(requestOrigin);
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

  try {
    const {
      data,
      mediaType,
      referenceType,
      machineName,
      hardwareFamily,
      areaLabel,
      assemblyLabel,
    } = JSON.parse(event.body || "{}");
    if (!data) return response(400, { error: "No file data provided" }, requestOrigin);

    const client = new Anthropic({ apiKey: key });
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1200,
      output_config: { format: { type: "json_schema", schema: MEASURE_SCHEMA } },
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType || "image/jpeg",
              data,
            },
          },
          {
            type: "text",
            text: measurePromptFor({ referenceType, machineName, hardwareFamily, areaLabel, assemblyLabel }),
          },
        ],
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const parsed = JSON.parse(textBlock ? textBlock.text : "{}");
    return response(200, {
      configured: true,
      provider: "server-vision",
      usable: !!parsed.usable,
      confidence: parsed.confidence || "medium",
      estimates: parsed.estimates || {},
      notes: parsed.notes || "",
    }, requestOrigin);
  } catch (error) {
    console.error("measure-hardware failed", { name: error.name, status: error.status });
    return response(500, { error: "Hardware measurement is temporarily unavailable" }, requestOrigin);
  }
};
