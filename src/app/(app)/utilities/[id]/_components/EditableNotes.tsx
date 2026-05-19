"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/Markdown";
import { setUtilityNotes } from "@/app/(app)/utilities/actions";

type Props = {
  utilityId: string;
  initialNotes: string | null;
};

/**
 * Click-to-edit notes card for the utility detail page. Mirrors the Tasks
 * `EditableDescription` pattern: reads as Markdown, swaps to a tall
 * textarea on click, saves on Cmd/Ctrl+Enter, cancels on Esc.
 */
export function EditableNotes({ utilityId, initialNotes }: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialNotes ?? "");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function startEditing() {
    setValue(initialNotes ?? "");
    setEditing(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setUtilityNotes(utilityId, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setValue(initialNotes ?? "");
    setEditing(false);
    setError(null);
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-h-[180px] resize-y"
          placeholder="Notes, links, account references… Markdown supported."
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <p className="mr-auto text-[11px] text-muted-foreground">
            Markdown supported — Cmd/Ctrl + Enter to save, Esc to cancel.
          </p>
          <Button variant="ghost" size="sm" onClick={cancel} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className="w-full rounded-md border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-accent/40"
      aria-label="Edit notes"
    >
      {initialNotes && initialNotes.trim().length > 0 ? (
        <Markdown>{initialNotes}</Markdown>
      ) : (
        <p className="text-sm text-muted-foreground">
          No notes yet — click to add Markdown notes, links, or context.
        </p>
      )}
    </button>
  );
}
