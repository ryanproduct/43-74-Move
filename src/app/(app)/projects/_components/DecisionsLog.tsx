import { format, parseISO } from "date-fns";
import { GitBranch } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Markdown } from "@/components/Markdown";
import { OwnerAvatar } from "@/components/OwnerAvatar";
import type { ProfileLite } from "@/lib/tasks/types";
import type { ProjectDecision } from "@/lib/projects/types";

type Props = {
  decisions: ProjectDecision[];
  /** Resolved profile names keyed by uuid. */
  profilesById: Map<string, ProfileLite>;
};

/**
 * Renders the append-only decisions log. Server component — no edit affordance.
 * The matching `RecordDecisionForm` (client) handles new entries.
 */
export function DecisionsLog({ decisions, profilesById }: Props) {
  if (decisions.length === 0) {
    return (
      <EmptyState
        icon={<GitBranch className="h-6 w-6" />}
        title="No decisions logged yet"
        description="Record contractor choices, scope changes, budget calls — anything you'd want a trail of."
      />
    );
  }

  // Most recent first.
  const ordered = [...decisions].sort((a, b) =>
    (b.decided_at ?? "").localeCompare(a.decided_at ?? "")
  );

  return (
    <ol className="flex flex-col gap-3">
      {ordered.map((d, i) => {
        const profile = profilesById.get(d.decided_by) ?? null;
        let when = "";
        try {
          when = d.decided_at ? format(parseISO(d.decided_at), "d MMM yyyy") : "";
        } catch {
          when = d.decided_at ?? "";
        }

        return (
          <li
            key={`${d.decided_at}-${i}`}
            className="flex gap-3 rounded-md border bg-card p-3"
          >
            <OwnerAvatar owner={profile} size="md" />
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
                <span className="text-sm font-semibold text-foreground">
                  {d.topic}
                </span>
                <span className="text-muted-foreground">
                  decided by{" "}
                  <span className="font-medium text-foreground">
                    {profile?.display_name ?? "Unknown"}
                  </span>
                </span>
                {when && (
                  <span className="text-muted-foreground">· {when}</span>
                )}
              </div>
              <p className="mt-1 text-sm">
                <span className="text-muted-foreground">Choice: </span>
                <span className="font-medium">{d.choice}</span>
              </p>
              {d.notes && d.notes.trim().length > 0 && (
                <div className="mt-2 border-t pt-2">
                  <Markdown>{d.notes}</Markdown>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
