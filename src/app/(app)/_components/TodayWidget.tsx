import { format } from "date-fns";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TaskCard } from "@/components/TaskCard";
import type { DashboardTask } from "@/lib/dashboard/queries";

type Props = {
  tasks: DashboardTask[];
  /** Europe/London "today" as YYYY-MM-DD — shown in the card header. */
  today: string;
};

type Group = {
  ownerKey: string;
  ownerName: string;
  tasks: DashboardTask[];
};

/** Bucket tasks by owner_id, preserving display name. Unassigned last. */
function groupByOwner(tasks: DashboardTask[]): Group[] {
  const buckets = new Map<string, Group>();
  for (const t of tasks) {
    const key = t.owner?.id ?? "_unassigned";
    const existing = buckets.get(key);
    if (existing) {
      existing.tasks.push(t);
    } else {
      buckets.set(key, {
        ownerKey: key,
        ownerName: t.owner?.display_name ?? "Unassigned",
        tasks: [t],
      });
    }
  }
  return Array.from(buckets.values()).sort((a, b) => {
    if (a.ownerKey === "_unassigned") return 1;
    if (b.ownerKey === "_unassigned") return -1;
    return a.ownerName.localeCompare(b.ownerName);
  });
}

/**
 * Dashboard "Today" widget: tasks with `due_date = today` (Europe/London),
 * grouped by owner. Each task is rendered with the existing TaskCard so the
 * dashboard inherits the same compact treatment used elsewhere.
 */
export function TodayWidget({ tasks, today }: Props) {
  const groups = groupByOwner(tasks);
  // Format "Today · Mon 19 May" to mirror the design header.
  const dateLabel = format(new Date(`${today}T12:00:00Z`), "EEE d MMM");

  return (
    <Card className="rounded-2xl border-stone-200/80 bg-[var(--mv-paper,#FBF7EE)] shadow-none">
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0 px-5 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-stone-500">
          Today · {dateLabel}
        </h2>
        <span className="text-xs tabular-nums text-stone-400">
          {tasks.length === 1 ? "1 task" : `${tasks.length} tasks`}
        </span>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {tasks.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-stone-500">
            Nothing due today. Take a breath.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <section key={group.ownerKey} className="flex flex-col gap-1.5">
                <h3 className="px-2 text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  {group.ownerName}
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.tasks.map((task) => (
                    <li key={task.id}>
                      <TaskCard task={task} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
