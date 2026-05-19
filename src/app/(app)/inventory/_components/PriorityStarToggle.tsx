"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { setInventoryPriorityUnpack } from "../actions";

type Props = {
  itemId: string;
  value: boolean;
};

/**
 * Star button that toggles `priority_unpack`. Uses React 19's `useOptimistic`
 * so the visual flips instantly; if the server action fails, the optimistic
 * value resets naturally on the next render because `value` is re-fed from
 * the server.
 */
export function PriorityStarToggle({ itemId, value }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [optimistic, setOptimistic] = React.useOptimistic(
    value,
    (_state, next: boolean) => next
  );

  function toggle() {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      const result = await setInventoryPriorityUnpack(itemId, next);
      if (!result.ok) {
        toast.error("Couldn't update priority", { description: result.error });
        return;
      }
      toast.success(
        next ? "Marked for first-day box" : "Removed from first-day box"
      );
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimistic}
      aria-label={
        optimistic
          ? "Unmark as priority unpack"
          : "Mark as priority unpack (first-day box)"
      }
      title={
        optimistic
          ? "Priority unpack — first-day box"
          : "Mark as priority unpack"
      }
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent disabled:opacity-60",
        optimistic ? "text-amber-500" : "text-muted-foreground"
      )}
    >
      <Star
        className={cn("h-4 w-4", optimistic && "fill-amber-400 stroke-amber-500")}
      />
    </button>
  );
}
