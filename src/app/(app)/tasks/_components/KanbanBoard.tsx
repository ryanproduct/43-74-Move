"use client";

import * as React from "react";

import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { TASK_STATUSES, STATUS_LABELS, type TaskStatus } from "@/lib/tasks/types";

type Props = {
  tasks: TaskCardData[];
};

/**
 * Kanban view: four columns (todo, in_progress, blocked, done). The "done"
 * column collapses to a summary count by default to keep the board scannable.
 * Click the "+ N done" affordance to expand.
 */
export function KanbanBoard({ tasks }: Props) {
  const [doneExpanded, setDoneExpanded] = React.useState(false);

  const byStatus = React.useMemo(() => {
    const groups: Record<TaskStatus, TaskCardData[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    for (const t of tasks) groups[t.status].push(t);
    return groups;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const items = byStatus[status];
        const isDone = status === "done";
        return (
          <div key={status} className="flex flex-col gap-2">
            <header className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {STATUS_LABELS[status]}{" "}
                <span className="ml-1 text-foreground/60">({items.length})</span>
              </h2>
            </header>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted/20 px-2 py-3 text-center text-[11px] text-muted-foreground">
                  Nothing here
                </p>
              ) : isDone && !doneExpanded ? (
                <button
                  type="button"
                  onClick={() => setDoneExpanded(true)}
                  className="rounded-md border border-dashed bg-muted/20 px-2 py-3 text-center text-xs text-muted-foreground hover:bg-muted/40"
                >
                  + {items.length} done
                </button>
              ) : (
                items.map((task) => (
                  <TaskCard key={task.id} task={task} hideStatus />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
