/* Move HQ — minimal offline app-shell service worker. */

const CACHE = "move-hq-shell-v1";

/**
 * Resources we want available when the device is offline. Intentionally tiny:
 * just the dashboard, /login, the manifest and the favicon. We do NOT cache
 * /api/*, /auth/*, or any Supabase data — those must always hit the network so
 * stale records, magic-link callbacks and signed URLs never get stuck.
 */
const SHELL_URLS = [
  "/",
  "/login",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Each addAll failure would abort the whole list; do them one-by-one so
      // a missing favicon doesn't kill registration.
      await Promise.all(
        SHELL_URLS.map(async (url) => {
          try {
            await cache.add(new Request(url, { credentials: "same-origin" }));
          } catch {
            // ignore — best-effort prefetch only.
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle same-origin requests; let everything else (Supabase, fonts,
  // postmark, etc.) pass through to the network unchanged.
  if (url.origin !== self.location.origin) return;

  // Never cache API or auth routes — they're either dynamic data or one-shot
  // magic-link exchanges.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // Only handle the explicit shell list. Everything else (other routes,
  // _next/* bundles, images) is left to the browser's normal cache strategy.
  if (!SHELL_URLS.includes(url.pathname)) return;

  // Cache-first, network-fallback. If the network succeeds we refresh the
  // cache entry in the background.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        // Kick off the refresh but don't wait for it.
        network.catch(() => {});
        return cached;
      }

      const res = await network;
      if (res) return res;

      // Offline + no cache → return a tiny inline fallback so the browser
      // doesn't show its own offline page.
      return new Response(
        "<!doctype html><meta charset=utf-8><title>Offline</title><body style=\"font:14px/1.4 -apple-system,sans-serif;color:#333;padding:24px\">Move HQ is offline. Reconnect and try again.</body>",
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
      );
    })()
  );
});
