// Extract structured fitment rows from a parts-catalog page (image or PDF)
// using Claude Opus 4.8 with structured outputs. The SECRET ANTHROPIC_API_KEY
// is read from the Netlify env and never reaches the browser. Returns
// {configured:false} until the key is set.

const Anthropic = require("@anthropic-ai/sdk");
const { SCHEMA, PROMPT } = require("./_extract-contract.cjs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { statusCode: 200, body: JSON.stringify({ configured: false }) };

  const client = new Anthropic({ apiKey: key });
  try {
    const { data, mediaType } = JSON.parse(event.body || "{}");
    if (!data) return { statusCode: 400, body: JSON.stringify({ error: "No file data provided" }) };

    const isPdf = (mediaType || "").includes("pdf");
    const fileBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: mediaType || "image/png", data } };

    const msg = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: [fileBlock, { type: "text", text: PROMPT }] }],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    const parsed = JSON.parse(textBlock ? textBlock.text : "{}");
    return {
      statusCode: 200,
      body: JSON.stringify({ configured: true, fitments: parsed.fitments || [] }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
