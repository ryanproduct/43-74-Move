"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

import { Input } from "@/components/ui/input";
import { setUtilitySwitchDate } from "@/app/(app)/utilities/actions";

type Props = {
  utilityId: string;
  value: string | null;
};

/**
 * Inline-edit cell for `utilities.switch_date`. Click switches the cell to
 * a native date input; saves on blur or Enter via the server action. Esc
 * cancels back to the formatted text.
 */
export function InlineDateCell({ utilityId, value }: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? "");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function formatted(): string {
    if (!value) return "—";
    try {
      return format(parseISO(value), "d MMM yyyy");
    } catch {
      return value;
    }
  }

  function commit(next: string) {
    const normalized = next.trim() || null;
    if (normalized === (value ?? null)) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setUtilitySwitchDate(utilityId, normalized);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? "");
          setEditing(true);
        }}
        className={`rounded px-1 -mx-1 py-0.5 text-left text-sm transition-colors hover:bg-accent/40 ${
          value ? "" : "text-muted-foreground"
        }`}
        title="Click to edit switch date"
        aria-label="Edit switch date"
      >
        {formatted()}
        {error && <span className="ml-2 text-[11px] text-destructive">{error}</span>}
      </button>
    );
  }

  return (
    <Input
      type="date"
      value={draft}
      autoFocus
      disabled={pending}
      className="h-7 w-[150px] text-xs"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setDraft(value ?? "");
          setEditing(false);
        }
      }}
    />
  );
}
