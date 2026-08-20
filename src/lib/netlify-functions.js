import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const LOCAL_FUNCTIONS_ORIGIN = String(import.meta.env.VITE_LOCAL_FUNCTIONS_ORIGIN || "http://127.0.0.1:8888")
  .trim()
  .replace(/\/+$/, "");
const CONFIGURED_FUNCTIONS_ORIGIN = String(import.meta.env.VITE_FUNCTIONS_ORIGIN || "")
  .trim()
  .replace(/\/+$/, "");
const CALLER_ID_KEY = "ezparts_function_caller_id";
const CALLER_TOKEN_KEY = "ezparts_function_caller_token";

let callerTokenPromise;

function readStorage(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStorage(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Ignore private-mode and quota errors.
  }
}

function createRandomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `ezparts-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCallerId() {
  const existing = readStorage(CALLER_ID_KEY);
  if (existing) return existing;
  const created = createRandomId();
  writeStorage(CALLER_ID_KEY, created);
  return created;
}

function readCachedCallerToken() {
  const raw = readStorage(CALLER_TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.expiresAt) return null;
    const expiresAt = Date.parse(parsed.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt - Date.now() < 60_000) {
      writeStorage(CALLER_TOKEN_KEY, "");
      return null;
    }
    return parsed;
  } catch {
    writeStorage(CALLER_TOKEN_KEY, "");
    return null;
  }
}

async function readSupabaseAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || "";
  } catch {
    return "";
  }
}

async function fetchGuestCallerToken() {
  const response = await fetch(netlifyFunctionUrl("issue-function-token"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: getCallerId() }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
  const tokenRecord = {
    token: json.token,
    expiresAt: json.expiresAt,
  };
  writeStorage(CALLER_TOKEN_KEY, JSON.stringify(tokenRecord));
  return tokenRecord.token;
}

async function getFunctionCallerToken() {
  const sessionToken = await readSupabaseAccessToken();
  if (sessionToken) return sessionToken;

  const cached = readCachedCallerToken();
  if (cached) return cached.token;

  if (!callerTokenPromise) {
    callerTokenPromise = fetchGuestCallerToken().finally(() => {
      callerTokenPromise = undefined;
    });
  }
  return callerTokenPromise;
}

// Browser builds can use Netlify's same-origin function path. Capacitor serves
// the bundled app from capacitor://localhost, so native builds must call the
// deployed HTTPS origin instead of resolving the path against that URL scheme.
export function netlifyFunctionUrl(functionName) {
  const path = `/.netlify/functions/${encodeURIComponent(functionName)}`;
  if (typeof window === "undefined") return path;
  const localPreview = LOCAL_HOSTS.has(window.location.hostname);
  if (!Capacitor.isNativePlatform()) {
    return localPreview && LOCAL_FUNCTIONS_ORIGIN ? `${LOCAL_FUNCTIONS_ORIGIN}${path}` : path;
  }
  if (!CONFIGURED_FUNCTIONS_ORIGIN) {
    throw new Error("VITE_FUNCTIONS_ORIGIN is required for native builds");
  }
  return `${CONFIGURED_FUNCTIONS_ORIGIN}${path}`;
}

export async function netlifyFunctionFetch(functionName, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${await getFunctionCallerToken()}`);
  return fetch(netlifyFunctionUrl(functionName), {
    ...init,
    headers,
  });
}
