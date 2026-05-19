"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/Markdown";
import { setContractorNotes } from "@/app/(app)/contractors/actions";

type Props = {
  contractorId: string;
  initialNotes: string | null;
};

/**
 * Click-to-edit notes block. Renders Markdown by default; switches to a
 * textarea on click. Mirrors the task-side EditableDescription pattern.
 */
export function EditableNotes({ contractorId, initialNotes }: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialNotes ?? "");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // If the server-side notes change while we're not editing (e.g. realtime
  // refresh from the other user), adopt them. Doing this during render
  // avoids the cascading-render lint rule.
  const [trackedInitial, setTrackedInitial] = React.useState(initialNotes);
  if (initialNotes !== trackedInitial) {
    setTrackedInitial(initialNotes);
    if (!editing) setValue(initialNotes ?? "");
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setContractorNotes(contractorId, value);
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
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="Long-form notes, links, paragraphs… Markdown supported."
          className="min-h-[240px] resize-y"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Markdown supported · Cmd/Ctrl + Enter to save · Esc to cancel.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancel}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={pending}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group w-full rounded-md border border-dashed border-transparent p-2 text-left transition-colors hover:border-border hover:bg-accent/30 focus-visible:border-border focus-visible:outline-none"
    >
      {initialNotes && initialNotes.trim().length > 0 ? (
        <Markdown className="text-base leading-relaxed">
          {initialNotes}
        </Markdown>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          Click to add notes — first call, site visit, gut feel, anything that
          will matter later.
        </p>
      )}
    </button>
  );
}
