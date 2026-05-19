"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUtilityStatus } from "@/app/(app)/utilities/actions";
import {
  UTILITY_STATUSES,
  UTILITY_STATUS_LABELS,
  type UtilityStatus,
} from "@/lib/utilities/types";

import { UtilityStatusPill } from "./UtilityStatusPill";

type Props = {
  utilityId: string;
  value: UtilityStatus;
};

/**
 * Inline-edit cell for `utilities.status`. Renders a click-to-edit pill that
 * swaps for a shadcn Select. Saves on value change via the server action and
 * exits edit mode immediately so the realtime subscription paints the new
 * row. Esc cancels back to the pill.
 */
export function InlineStatusCell({ utilityId, value }: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function commit(next: UtilityStatus) {
    if (next === value) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setUtilityStatus(utilityId, next);
      if (!result.ok) {
        setError(result.error);
        toast.error("Couldn't update status", { description: result.error });
        return;
      }
      toast.success(
        `Status: ${UTILITY_STATUS_LABELS[next].toLowerCase()}`
      );
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded px-1 -mx-1 py-0.5 text-left transition-colors hover:bg-accent/40"
        title="Click to edit status"
        aria-label="Edit status"
      >
        <UtilityStatusPill value={value} />
        {error && <span className="ml-2 text-[11px] text-destructive">{error}</span>}
      </button>
    );
  }

  return (
    <Select
      defaultValue={value}
      open
      onOpenChange={(open) => {
        if (!open) setEditing(false);
      }}
      onValueChange={(v) => commit(v as UtilityStatus)}
      disabled={pending}
    >
      <SelectTrigger
        className="h-7 min-w-[120px] text-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {UTILITY_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {UTILITY_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
