"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordDecision } from "@/app/(app)/projects/actions";

type Props = {
  projectId: string;
};

/**
 * Inline expanding panel that lets the user append a decision to the project.
 * Decisions are append-only — there is no edit affordance anywhere. The form
 * collapses back to a single button after a successful save.
 */
export function RecordDecisionForm({ projectId }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [choice, setChoice] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function reset() {
    setTopic("");
    setChoice("");
    setNotes("");
    setError(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await recordDecision(
        projectId,
        topic,
        choice,
        notes.trim() ? notes : null
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-4 w-4" />
        Record a decision
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
      <div className="space-y-1.5">
        <Label htmlFor="decision-topic">Topic</Label>
        <Input
          id="decision-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Bathroom contractor"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="decision-choice">Choice</Label>
        <Input
          id="decision-choice"
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          placeholder="e.g. Bathroom Fitters Ltd"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="decision-notes">Notes (optional)</Label>
        <Textarea
          id="decision-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why this choice? Anything to remember? Markdown supported."
          className="min-h-[100px] resize-y"
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Decisions are append-only. They can never be edited.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || !topic.trim() || !choice.trim()}
            onClick={submit}
          >
            {pending ? "Saving…" : "Save decision"}
          </Button>
        </div>
      </div>
    </div>
  );
}
