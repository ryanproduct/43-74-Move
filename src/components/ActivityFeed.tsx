import { formatDistanceToNow, parseISO } from "date-fns";
import { Activity } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { OwnerAvatar } from "@/components/OwnerAvatar";
import type { ActivityRow } from "@/lib/tasks/queries";

type Props = {
  rows: ActivityRow[];
};

function relative(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

/**
 * Renders pre-rendered activity rows (the trigger writes the human-readable
 * `summary` string at insert time). Server component — no interactivity.
 */
export function ActivityFeed({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-6 w-6" />}
        title="No activity yet"
        description="Changes to this task will appear here."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id} className="flex gap-3 text-sm">
          <OwnerAvatar owner={row.actor} size="sm" className="mt-0.5" />
          <div className="flex-1">
            <p className="leading-snug">
              <span className="font-medium">
                {row.actor?.display_name ?? "Someone"}
              </span>{" "}
              <span className="text-muted-foreground">{row.summary}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              {relative(row.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
