"use client";

import { useEffect } from "react";

/**
 * Client-only effect that registers `/sw.js` for offline shell caching.
 * Silently no-ops on browsers without `serviceWorker` (older Safari) and on
 * the server. We mount this inside the authenticated layout because the
 * shell URLs assume an authed user can see `/`.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Defer registration until after first paint so we don't compete with
    // hydration/initial data fetches.
    const handle = window.setTimeout(() => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          // Best-effort only — log but never crash the app.
          console.warn("SW registration failed", err);
        });
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  return null;
}
