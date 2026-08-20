const Anthropic = require("@anthropic-ai/sdk");
const { MEASURE_SCHEMA, measurePromptFor } = require("./_measure-contract.cjs");
const {
  enforceRateLimit,
  parseJsonBody,
  preflight,
  requireBase64Payload,
  response,
} = require("./_function-access.cjs");

const MAX_REQUEST_BODY_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const RATE_LIMIT_WINDOW_SECONDS = Number(process.env.EZPARTS_MEASURE_WINDOW_SECONDS || 60 * 60);
const RATE_LIMIT_REQUESTS = Number(process.env.EZPARTS_MEASURE_RATE_LIMIT || 60);

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || "";
  const optionsResponse = preflight(event);
  if (optionsResponse) return optionsResponse;
  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method Not Allowed" }, requestOrigin);
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return response(200, { configured: false }, requestOrigin);

  try {
    await enforceRateLimit(event, {
      scopeName: "measure-hardware",
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      requestLimit: RATE_LIMIT_REQUESTS,
    });
    const {
      data,
      mediaType,
      referenceType,
      machineName,
      hardwareFamily,
      areaLabel,
      assemblyLabel,
    } = parseJsonBody(event, { maxBodyBytes: MAX_REQUEST_BODY_BYTES });
    requireBase64Payload(data, MAX_IMAGE_BYTES);

    const client = new Anthropic({ apiKey: key });
    const message = await client.messages.create({
      model: "claude-opus-5",
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
    if (error.statusCode) {
      return response(error.statusCode, { error: error.message, resetAt: error.meta?.resetAt || null }, requestOrigin);
    }
    console.error("measure-hardware failed", { name: error.name, status: error.status });
    return response(500, { error: "Hardware measurement is temporarily unavailable" }, requestOrigin);
  }
};
