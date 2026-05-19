import Link from "next/link";
import { format, parseISO } from "date-fns";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OwnerAvatar } from "@/components/OwnerAvatar";
import { PropertyPill } from "@/components/PropertyPill";
import { TaskStatusPill } from "@/components/TaskStatusPill";
import type { DashboardTask } from "@/lib/dashboard/queries";

type Props = {
  tasks: DashboardTask[];
};

/**
 * "This week" widget: tasks with due_date in (today, today+7]. A compact list
 * of one-line rows (smaller than the TaskCard used in Today). Mirrors the
 * design reference's `.row-week` template: avatar / day / title / pills.
 */
export function ThisWeekWidget({ tasks }: Props) {
  return (
    <Card className="rounded-2xl border-stone-200/80 bg-[var(--mv-paper,#FBF7EE)] shadow-none">
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0 px-5 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-stone-500">
          This week
        </h2>
        <span className="text-xs tabular-nums text-stone-400">
          {tasks.length === 1 ? "1 · ends Sun" : `${tasks.length} · ends Sun`}
        </span>
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-0">
        {tasks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-stone-500">
            Nothing scheduled in the next seven days.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-stone-200/60">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="grid grid-cols-[24px_36px_1fr_auto_auto] items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-stone-100/60"
                >
                  <OwnerAvatar owner={task.owner} size="sm" />
                  <span className="text-xs tabular-nums text-stone-500">
                    {task.due_date
                      ? format(parseISO(task.due_date), "EEE")
                      : "—"}
                  </span>
                  <span className="truncate text-[14px] font-medium leading-snug text-stone-900">
                    {task.title}
                  </span>
                  <PropertyPill value={task.property} />
                  <TaskStatusPill value={task.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
