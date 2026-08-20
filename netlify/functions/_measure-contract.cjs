const MEASURE_SCHEMA = {
  name: "hardware_measurement_estimate",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      usable: { type: "boolean" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      estimates: {
        type: "object",
        additionalProperties: false,
        properties: {
          diameter: { type: "string" },
          length: { type: "string" },
          pitch: { type: "string" },
          wrench: { type: "string" },
          head_style: { type: "string" },
        },
        required: ["diameter", "length", "pitch", "wrench", "head_style"],
      },
      notes: { type: "string" },
    },
    required: ["usable", "confidence", "estimates", "notes"],
  },
};

function measurePromptFor({ referenceType, machineName, hardwareFamily, areaLabel, assemblyLabel }) {
  return [
    "You are estimating approximate hardware measurements from a single reference photo.",
    `Machine: ${machineName || "unknown"}.`,
    `Likely hardware family: ${hardwareFamily || "unknown"}.`,
    `Machine area: ${areaLabel || "unknown"}.`,
    `Assembly: ${assemblyLabel || "unknown"}.`,
    `Reference object selected by the user: ${referenceType || "unknown"}.`,
    "Use the visible reference object to estimate approximate dimensions only if the part and reference appear to be in the same plane and the image is clear enough.",
    "If the photo is not trustworthy for measurement, set usable=false and leave estimate strings empty.",
    "Known reference assumptions:",
    "- credit/debit card: 85.60 mm x 53.98 mm",
    "- US quarter coin: 24.26 mm diameter",
    "- ruler/tape: only estimate if visible markings clearly show scale",
    "- socket/wrench/card tag: only estimate if size markings are visible or the object is obvious enough to compare conservatively",
    "Return approximate strings such as 3/8, M10, 2 in, 50 mm, coarse, fine, 1.5 mm, 13 TPI, 3/4, 19 mm, hex, carriage, socket.",
    "Do not invent exact measurements. Prefer blank strings over guesses.",
  ].join("\n");
}

module.exports = { MEASURE_SCHEMA, measurePromptFor };
