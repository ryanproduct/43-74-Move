"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { Markdown } from "@/components/Markdown";
import { OwnerAvatar } from "@/components/OwnerAvatar";
import type { CommentRow } from "@/lib/tasks/queries";
import { addComment } from "@/app/(app)/projects/[id]/actions";

type Props = {
  projectId: string;
  comments: CommentRow[];
};

/**
 * Project-flavour of the comment thread. Functionally mirrors the shared
 * `CommentThread`, but calls into the projects `addComment` server action so
 * `parent_type='project'` is written correctly. Kept local to this route so
 * the shared component owned by another agent stays untouched.
 */
export function ProjectCommentThread({ projectId, comments }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function relative(iso: string) {
    try {
      return formatDistanceToNow(parseISO(iso), { addSuffix: true });
    } catch {
      return "";
    }
  }

  function submit() {
    if (!value.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addComment(projectId, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValue("");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Comments</h2>

      {comments.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No comments yet"
          description="Use comments to flag questions, decisions, or @-mention each other."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <OwnerAvatar owner={c.author} size="md" />
              <div className="flex-1 rounded-md border bg-card p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {c.author?.display_name ?? "Unknown"}
                  </span>
                  <span>·</span>
                  <span>{relative(c.created_at)}</span>
                </div>
                <Markdown>{c.body}</Markdown>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a comment… Markdown supported."
          className="min-h-[80px] resize-y"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Cmd/Ctrl + Enter to post.
          </p>
          <Button
            size="sm"
            onClick={submit}
            disabled={pending || !value.trim()}
          >
            {pending ? "Posting…" : "Comment"}
          </Button>
        </div>
      </div>
    </section>
  );
}
