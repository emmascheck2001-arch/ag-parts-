// EzParts service worker — makes the app installable and resilient on a spotty
// field connection. Strategy:
//   • navigations: network-first, fall back to the cached app shell when offline
//   • static assets (js/css/img/fonts): cache-first, then network
//   • API / serverless / Supabase / Stripe calls: always network (never cached)
const CACHE = "ezparts-v1";
const SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const isApiCall = (url) =>
  url.pathname.startsWith("/.netlify/") ||
  /supabase\.co|stripe\.com|anthropic\.com/.test(url.host);

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never cache live data calls.
  if (isApiCall(url)) return;

  // App navigations: try network, fall back to cached shell offline.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("/index.html").then((r) => r || caches.match("/")))
    );
    return;
  }

  // Same-origin static assets: cache-first.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        }).catch(() => cached)
      )
    );
  }
});
