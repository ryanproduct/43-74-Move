import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OwnerAvatar } from "@/components/OwnerAvatar";
import { TaskStatusPill } from "@/components/TaskStatusPill";
import type { DashboardTask } from "@/lib/dashboard/queries";

type Props = {
  tasks: DashboardTask[];
};

/**
 * "Blocked" widget: tasks with status = blocked, showing blocked_reason
 * inline beneath the title. The whole card is washed amber per the design
 * reference so it's spottable in peripheral vision.
 */
export function BlockedWidget({ tasks }: Props) {
  return (
    <Card className="rounded-2xl border-amber-300/40 bg-amber-50/60 shadow-none">
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0 px-5 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-amber-700">
          Blocked
        </h2>
        <span className="text-xs tabular-nums text-stone-500">
          {tasks.length}
        </span>
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-0">
        {tasks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-stone-500">
            Nothing blocked. Keep going.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-stone-200/60">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="grid grid-cols-[24px_1fr_auto] items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-amber-100/40"
                >
                  <OwnerAvatar owner={task.owner} size="sm" className="mt-0.5" />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium leading-snug text-stone-900">
                      {task.title}
                    </div>
                    {task.blocked_reason && (
                      <div className="mt-0.5 line-clamp-2 text-xs text-stone-600">
                        {task.blocked_reason}
                      </div>
                    )}
                  </div>
                  <TaskStatusPill value={task.status} className="mt-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
