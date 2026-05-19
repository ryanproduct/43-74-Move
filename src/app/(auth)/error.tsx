"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
};

/** Minimal error UI for unauthenticated routes (/login, /auth/callback). */
export default function AuthError({ error, unstable_retry, reset }: Props) {
  useEffect(() => {
    console.error("[move-hq] auth route error", error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-background p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold tracking-tight">Sign-in hiccup</h1>
      <p className="text-sm text-muted-foreground">
        Something went wrong loading this page. Try again, or refresh.
      </p>
      <Button
        onClick={() => {
          if (retry) retry();
          else if (typeof window !== "undefined") window.location.reload();
        }}
      >
        Try again
      </Button>
    </div>
  );
}
