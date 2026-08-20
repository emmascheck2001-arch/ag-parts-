const crypto = require("crypto");
const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const { getCaller } = require("./_auth.cjs");

const LOCAL_PREVIEW_ORIGIN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;
const STATIC_ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:3000",
]);
const GUEST_TOKEN_PREFIX = "ezp1";

let supabaseAdmin;
let rateLimitPool;

function configuredOrigins() {
  const values = [
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.SITE_URL,
    process.env.VITE_FUNCTIONS_ORIGIN,
    process.env.VITE_SITE_ORIGIN,
    ...String(process.env.EZPARTS_ALLOWED_ORIGINS || "").split(","),
  ]
    .map((value) => String(value || "").trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return new Set([...STATIC_ALLOWED_ORIGINS, ...values]);
}

function defaultOrigin() {
  return [...configuredOrigins()].find((value) => /^https?:\/\//i.test(value)) || "";
}

function allowedOrigin(requestOrigin) {
  const origin = String(requestOrigin || "").trim().replace(/\/+$/, "");
  if (!origin) return defaultOrigin();
  if (LOCAL_PREVIEW_ORIGIN.test(origin)) return origin;
  return configuredOrigins().has(origin) ? origin : defaultOrigin();
}

function response(statusCode, body, requestOrigin, extraHeaders = {}) {
  const origin = allowedOrigin(requestOrigin);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    ...extraHeaders,
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return {
    statusCode,
    headers,
    body: body == null ? "" : JSON.stringify(body),
  };
}

function preflight(event) {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || "";
  if (event.httpMethod === "OPTIONS") return response(204, {}, requestOrigin);
  return null;
}

function getFunctionCallerSecret() {
  return String(process.env.EZPARTS_FUNCTION_CALLER_SECRET || "").trim();
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signGuestToken(payload, secret) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${GUEST_TOKEN_PREFIX}.${encodedPayload}.${signature}`;
}

function verifyGuestToken(token, secret) {
  const [prefix, encodedPayload, signature] = String(token || "").split(".");
  if (prefix !== GUEST_TOKEN_PREFIX || !encodedPayload || !signature) {
    throw new Error("Malformed guest token");
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !crypto.timingSafeEqual(actual, wanted)) {
    throw new Error("Guest token signature mismatch");
  }
  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);
  if (!payload?.sub || !payload?.exp || payload.exp <= now) {
    throw new Error("Guest token expired");
  }
  return payload;
}

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  const url = String(process.env.SUPABASE_URL || "").trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return null;
  supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  return supabaseAdmin;
}

function getRateLimitPool() {
  if (rateLimitPool) return rateLimitPool;
  let connectionString = String(
    process.env.EZPARTS_PRODUCTION_DATABASE_URL
    || process.env.DATABASE_URL
    || "",
  ).trim();
  if (!connectionString) return null;
  if (/[?&]sslmode=require(?:&|$)/i.test(connectionString) && !/[?&]uselibpqcompat=/i.test(connectionString)) {
    connectionString += `${connectionString.includes("?") ? "&" : "?"}uselibpqcompat=true`;
  }
  rateLimitPool = new Pool({
    connectionString,
  });
  return rateLimitPool;
}

async function consumeRateLimit(scopeName, actorKey, windowSeconds, requestLimit) {
  const pool = getRateLimitPool();
  if (!pool) {
    throw new Error("Postgres rate-limit client is not configured");
  }
  const result = await pool.query(
    `
      select allowed, used, remaining, reset_at
      from catalog_staging.consume_function_rate_limit($1, $2, $3, $4)
    `,
    [scopeName, actorKey, windowSeconds, requestLimit],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Rate-limit response was empty");
  return {
    allowed: !!row.allowed,
    used: Number(row.used || 0),
    remaining: Number(row.remaining || 0),
    resetAt: row.reset_at || null,
  };
}

function requestBodyLengthBytes(event) {
  const raw = String(event.body || "");
  if (!raw) return 0;
  return event.isBase64Encoded ? Buffer.byteLength(raw, "base64") : Buffer.byteLength(raw, "utf8");
}

function parseJsonBody(event, { maxBodyBytes = 0 } = {}) {
  const raw = String(event.body || "");
  const bodyBytes = requestBodyLengthBytes(event);
  if (maxBodyBytes > 0 && bodyBytes > maxBodyBytes) {
    const error = new Error(`Payload too large (${bodyBytes} bytes)`);
    error.statusCode = 413;
    throw error;
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
}

function estimateBase64Bytes(data) {
  const value = String(data || "").trim();
  if (!value) return 0;
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.floor((value.length * 3) / 4) - padding;
}

function requireBase64Payload(data, maxDecodedBytes) {
  const decodedBytes = estimateBase64Bytes(data);
  if (!decodedBytes) {
    const error = new Error("No file data provided");
    error.statusCode = 400;
    throw error;
  }
  if (maxDecodedBytes > 0 && decodedBytes > maxDecodedBytes) {
    const error = new Error(`Uploaded file is too large (${decodedBytes} bytes)`);
    error.statusCode = 413;
    throw error;
  }
  return decodedBytes;
}

function readBearerToken(event) {
  const authz = event.headers?.authorization || event.headers?.Authorization || "";
  return authz.replace(/^Bearer\s+/i, "").trim();
}

function getClientIp(event) {
  const forwarded = String(
    event.headers?.["x-nf-client-connection-ip"]
    || event.headers?.["client-ip"]
    || event.headers?.["x-forwarded-for"]
    || "",
  ).trim();
  return forwarded.split(",")[0].trim();
}

async function resolveFunctionCaller(event) {
  const token = readBearerToken(event);
  if (!token) {
    const error = new Error("Missing function caller token");
    error.statusCode = 401;
    throw error;
  }

  if (token.startsWith(`${GUEST_TOKEN_PREFIX}.`)) {
    const secret = getFunctionCallerSecret();
    if (!secret) {
      const error = new Error("Function caller secret is not configured");
      error.statusCode = 503;
      throw error;
    }
    const payload = verifyGuestToken(token, secret);
    return {
      actorKey: payload.sub,
      callerKind: payload.kind || "guest",
      clientId: payload.clientId || null,
      expiresAt: payload.exp,
    };
  }

  const caller = await getCaller(event);
  if (!caller?.userId) {
    const error = new Error("Function caller token is invalid");
    error.statusCode = 401;
    throw error;
  }
  return {
    actorKey: `user:${caller.userId}`,
    callerKind: "supabase-user",
    userId: caller.userId,
    caller,
  };
}

async function enforceRateLimit(event, options) {
  const caller = await resolveFunctionCaller(event);
  const result = await consumeRateLimit(
    options.scopeName,
    caller.actorKey,
    options.windowSeconds,
    options.requestLimit,
  );
  if (!result.allowed) {
    const error = new Error("Rate limit exceeded");
    error.statusCode = 429;
    error.meta = result;
    throw error;
  }
  return { caller, rateLimit: result };
}

function issueGuestCallerToken(clientId, ttlSeconds) {
  const secret = getFunctionCallerSecret();
  if (!secret) {
    const error = new Error("Function caller secret is not configured");
    error.statusCode = 503;
    throw error;
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ver: 1,
    kind: "guest",
    sub: `guest:${clientId}`,
    clientId,
    iat: now,
    exp: now + ttlSeconds,
  };
  return {
    token: signGuestToken(payload, secret),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    actorKey: payload.sub,
  };
}

module.exports = {
  consumeRateLimit,
  enforceRateLimit,
  estimateBase64Bytes,
  getClientIp,
  issueGuestCallerToken,
  parseJsonBody,
  preflight,
  readBearerToken,
  requestBodyLengthBytes,
  requireBase64Payload,
  response,
};
