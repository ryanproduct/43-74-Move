"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  // Next 16 prop. We keep `reset` as a fallback name to be safe.
  unstable_retry?: () => void;
  reset?: () => void;
};

/**
 * Catch-all error boundary for the authenticated app shell. Renders a calm
 * "something went wrong" panel with the error message (in dev) plus a Try
 * Again button that hits Next's retry, falling back to a full reload.
 */
export default function AppError({ error, unstable_retry, reset }: Props) {
  useEffect(() => {
    console.error("[move-hq] route error", error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">
          Something went wrong.
        </h1>
        <p className="text-sm text-muted-foreground">
          Move HQ hit an unexpected error rendering this page. The data is
          safe — try again, or ping Ryan if it sticks.
        </p>
      </div>

      {error?.message && (
        <pre className="max-w-full overflow-x-auto rounded-md border bg-muted/40 px-3 py-2 text-left text-xs text-muted-foreground">
          {error.message}
          {error.digest ? `\n\nDigest: ${error.digest}` : ""}
        </pre>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={() => {
            if (retry) {
              retry();
              return;
            }
            // Last-resort: reload the route.
            if (typeof window !== "undefined") window.location.reload();
          }}
        >
          Try again
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined") window.location.assign("/");
          }}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
