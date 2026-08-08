const SCAN_SCHEMA = {
  type: "object",
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          part_number: {
            type: "string",
            description: "Exact letters and digits visibly stamped, engraved, cast, or printed on the part",
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          visible_text: { type: "string" },
          part_description: { type: "string" },
        },
        required: ["part_number", "confidence", "visible_text", "part_description"],
        additionalProperties: false,
      },
    },
  },
  required: ["candidates"],
  additionalProperties: false,
};

const SCAN_PROMPT = [
  "Inspect this photo of an agricultural-equipment part and read possible part numbers that are actually visible on it.",
  "Return at most five candidates in descending confidence.",
  "Only copy text visible in the photo. Never infer a number from the part's appearance, manufacturer, or likely application.",
  "A candidate part number must contain at least one digit.",
  "Do not return generic manufacturing words such as FORGED, CAST, PATENT, LEFT, RIGHT, MADE, or a brand name by itself.",
  "Preserve the printed characters and punctuation exactly. If a character is unclear, lower the confidence; do not replace it with a guess.",
  "If no plausible part number can be read, return an empty candidates array.",
].join("\n");

function scanPromptFor(machineName) {
  const selectedMachine = String(machineName || "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 120);
  if (!selectedMachine) return SCAN_PROMPT;
  return [
    SCAN_PROMPT,
    `The farmer selected this machine before taking the photo: ${JSON.stringify(selectedMachine)}.`,
    "Treat the selected machine as ranking context only when two or more visible readings are genuinely plausible.",
    "Do not invent, complete, or alter characters merely to make a number seem appropriate for the selected machine.",
  ].join("\n");
}

module.exports = { SCAN_SCHEMA, SCAN_PROMPT, scanPromptFor };
