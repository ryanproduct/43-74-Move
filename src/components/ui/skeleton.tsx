import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Generic skeleton placeholder. Used inside `loading.tsx` route files to
 * mirror the eventual layout of each list view. Pulse + muted background;
 * no text content. Pass through any className/props to shape it per-use.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/70", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
