const {
  consumeRateLimit,
  getClientIp,
  issueGuestCallerToken,
  parseJsonBody,
  preflight,
  response,
} = require("./_function-access.cjs");

const CLIENT_ID_RE = /^[A-Za-z0-9._-]{16,128}$/;
const MAX_BODY_BYTES = 16 * 1024;
const TOKEN_TTL_SECONDS = Number(process.env.EZPARTS_FUNCTION_TOKEN_TTL_SECONDS || 6 * 60 * 60);
const ISSUE_WINDOW_SECONDS = Number(process.env.EZPARTS_FUNCTION_ISSUE_WINDOW_SECONDS || 60 * 60);
const ISSUE_LIMIT = Number(process.env.EZPARTS_FUNCTION_ISSUE_LIMIT || 24);

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || "";
  const optionsResponse = preflight(event);
  if (optionsResponse) return optionsResponse;
  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method Not Allowed" }, requestOrigin);
  }

  try {
    const body = parseJsonBody(event, { maxBodyBytes: MAX_BODY_BYTES });
    const clientId = String(body.clientId || "").trim();
    if (!CLIENT_ID_RE.test(clientId)) {
      return response(400, { error: "clientId must be a stable random identifier" }, requestOrigin);
    }

    const issueKey = `issue:${clientId}:${getClientIp(event) || "unknown"}`;
    const rateLimit = await consumeRateLimit("issue-function-token", issueKey, ISSUE_WINDOW_SECONDS, ISSUE_LIMIT);
    if (!rateLimit.allowed) {
      return response(429, {
        error: "Too many function-session requests. Reuse the current app session and try again later.",
        resetAt: rateLimit.resetAt,
      }, requestOrigin);
    }

    const token = issueGuestCallerToken(clientId, TOKEN_TTL_SECONDS);
    return response(200, {
      configured: true,
      token: token.token,
      expiresAt: token.expiresAt,
    }, requestOrigin);
  } catch (error) {
    const statusCode = error.statusCode || (error.message === "Rate limit exceeded" ? 429 : 500);
    const body = statusCode === 429
      ? {
        error: "Too many function-session requests. Reuse the current app session and try again later.",
        resetAt: error.meta?.resetAt || null,
      }
      : { error: error.message || "Function access is temporarily unavailable" };
    return response(statusCode, body, requestOrigin);
  }
};
