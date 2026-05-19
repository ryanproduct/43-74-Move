"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Single mounted instance of `sonner` for the whole app. Lives in the
 * authenticated layout. Defaults are tuned for Move HQ:
 *   - bottom-right (out of the way of the global "+ New task" button)
 *   - richColors (success/error get a coloured background)
 *   - closeButton so accidental long-running toasts can be dismissed
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "text-sm",
        },
      }}
    />
  );
}
