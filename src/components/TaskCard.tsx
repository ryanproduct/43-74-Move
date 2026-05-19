import Link from "next/link";

import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus, Property, ProfileLite } from "@/lib/tasks/types";
import { DatePill } from "./DatePill";
import { OwnerAvatar } from "./OwnerAvatar";
import { PropertyPill } from "./PropertyPill";
import { TaskStatusPill } from "./TaskStatusPill";

type TaskCardData = {
  id: string;
  title: string;
  status: TaskStatus;
  property: Property;
  due_date: string | null;
  priority: TaskPriority;
  owner: ProfileLite | null;
};

type Props = {
  task: TaskCardData;
  /** When true, hide the status pill (e.g. in a kanban column). */
  hideStatus?: boolean;
  className?: string;
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "bg-rose-500",
  med: "bg-amber-500",
  low: "bg-slate-300",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: "High priority",
  med: "Medium priority",
  low: "Low priority",
};

/**
 * Compact task card used in the /tasks list, kanban columns, and the
 * dashboard "Today" widget. Whole card is a link to the detail page.
 */
export function TaskCard({ task, hideStatus = false, className }: Props) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className={cn(
        "group flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors hover:border-foreground/20 hover:bg-accent/50",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
            PRIORITY_DOT[task.priority]
          )}
          aria-label={PRIORITY_LABEL[task.priority]}
          title={PRIORITY_LABEL[task.priority]}
        />
        <p className="flex-1 font-medium leading-snug text-foreground">
          {task.title}
        </p>
        <OwnerAvatar owner={task.owner} size="sm" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PropertyPill value={task.property} />
        {!hideStatus && <TaskStatusPill value={task.status} />}
        {task.due_date && <DatePill date={task.due_date} />}
      </div>
    </Link>
  );
}

export type { TaskCardData };
