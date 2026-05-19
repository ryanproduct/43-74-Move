"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DECISION_LABELS,
  DECISION_STYLES,
  INVENTORY_DECISIONS,
  type InventoryDecision,
} from "@/lib/inventory/types";
import { setInventoryDecision } from "../actions";

type Props = {
  itemId: string;
  value: InventoryDecision;
};

/**
 * Colour-mapped inline pill. The pill itself is the Select trigger — tapping
 * it opens a small popover with the five options. We swap the trigger out for
 * a transparent overlay so the coloured pill stays visible while the radix
 * Select still controls the popover.
 */
export function DecisionPill({ itemId, value }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function commit(next: InventoryDecision) {
    if (next === value) return;
    setError(null);
    startTransition(async () => {
      const result = await setInventoryDecision(itemId, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <Select value={value} onValueChange={(v) => commit(v as InventoryDecision)}>
        <SelectTrigger
          aria-label="Change decision"
          className={cn(
            "h-6 w-auto min-w-0 gap-1 rounded-full border px-2 py-0 text-[11px] font-medium shadow-none focus:ring-1 focus:ring-offset-0 [&>span]:line-clamp-none",
            DECISION_STYLES[value],
            pending && "opacity-70"
          )}
        >
          <SelectValue>{DECISION_LABELS[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {INVENTORY_DECISIONS.map((d) => (
            <SelectItem key={d} value={d} className="text-xs">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  DECISION_STYLES[d]
                )}
              >
                {DECISION_LABELS[d]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
