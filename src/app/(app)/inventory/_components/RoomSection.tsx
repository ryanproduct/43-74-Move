"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { InventoryRow as InventoryItem } from "@/lib/inventory/types";

import { AddItemForm } from "./AddItemForm";
import { InventoryRow } from "./InventoryRow";

type Props = {
  room: string;
  items: InventoryItem[];
  doneCount: number;
  /** Map of photo storage path → 1h signed URL, pre-resolved on the server. */
  photoUrls: Record<string, string | null>;
};

/**
 * Collapsible per-room section. Expanded by default; the expand/collapse
 * state lives in component state only — refreshing the page resets it, which
 * matches the lightweight feel intended for v1.
 */
export function RoomSection({ room, items, doneCount, photoUrls }: Props) {
  const [open, setOpen] = React.useState(true);
  const total = items.length;

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/40",
          open && "border-b"
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm font-semibold">{room}</span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {doneCount}/{total} decided
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 p-3">
          {items.map((item) => (
            <InventoryRow
              key={item.id}
              item={item}
              photoSignedUrl={item.photo_path ? photoUrls[item.photo_path] ?? null : null}
            />
          ))}
          <AddItemForm rooms={[room]} lockedRoom={room} />
        </div>
      )}
    </section>
  );
}
