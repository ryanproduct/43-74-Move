"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
};

/**
 * Root-layout error boundary. Replaces the entire HTML document when the root
 * layout itself fails to render, so it must define its own <html>/<body>.
 * No styling system available here (the layout that imports globals.css has
 * crashed) — keep it inline and minimal.
 */
export default function GlobalError({ error, unstable_retry, reset }: Props) {
  useEffect(() => {
    console.error("[move-hq] global error", error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F2EDE3",
          color: "#1f1d1a",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              margin: "0 0 8px",
            }}
          >
            Move HQ couldn&apos;t load.
          </h1>
          <p style={{ fontSize: 14, color: "#6b6258", margin: "0 0 16px" }}>
            Something failed at the root of the app. Try again, or refresh the
            page.
          </p>
          {error?.digest && (
            <p
              style={{
                fontSize: 11,
                color: "#9b9387",
                fontFamily: "ui-monospace, monospace",
                margin: "0 0 16px",
              }}
            >
              Digest: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              if (retry) retry();
              else window.location.reload();
            }}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid #1f1d1a",
              background: "#1f1d1a",
              color: "#F2EDE3",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
