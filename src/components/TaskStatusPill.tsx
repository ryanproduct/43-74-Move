import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/tasks/types";
import { STATUS_LABELS } from "@/lib/tasks/types";

const STYLES: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-sky-100 text-sky-800 border-sky-200",
  blocked: "bg-rose-100 text-rose-800 border-rose-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function TaskStatusPill({
  value,
  className,
}: {
  value: TaskStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STYLES[value],
        className
      )}
    >
      {STATUS_LABELS[value]}
    </span>
  );
}
