import { Capacitor } from "@capacitor/core";

const DEFAULT_FUNCTIONS_ORIGIN = "https://ezparts.netlify.app";

// Browser builds can use Netlify's same-origin function path. Capacitor serves
// the bundled app from capacitor://localhost, so native builds must call the
// deployed HTTPS origin instead of resolving the path against that URL scheme.
export function netlifyFunctionUrl(functionName) {
  const path = `/.netlify/functions/${encodeURIComponent(functionName)}`;
  if (typeof window === "undefined") return path;
  const localPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  if (!Capacitor.isNativePlatform() && !localPreview) return path;

  const configuredOrigin = String(import.meta.env.VITE_FUNCTIONS_ORIGIN || DEFAULT_FUNCTIONS_ORIGIN)
    .replace(/\/+$/, "");
  return `${configuredOrigin}${path}`;
}
