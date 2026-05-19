import { cn } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/projects/types";

const STYLES: Record<ProjectStatus, string> = {
  planning: "bg-slate-100 text-slate-700 border-slate-200",
  quoting: "bg-amber-100 text-amber-800 border-amber-200",
  scheduled: "bg-sky-100 text-sky-800 border-sky-200",
  in_progress: "bg-indigo-100 text-indigo-800 border-indigo-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

/**
 * Small coloured badge for `projects.status`. Mirrors the style of the
 * shared `TaskStatusPill` so the two databases feel coherent. Lives inside
 * the projects route — does NOT pollute the global `components/` folder.
 */
export function ProjectStatusPill({
  value,
  className,
}: {
  value: ProjectStatus;
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
      {PROJECT_STATUS_LABELS[value]}
    </span>
  );
}
