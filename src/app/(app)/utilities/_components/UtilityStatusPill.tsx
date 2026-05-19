import { cn } from "@/lib/utils";
import {
  UTILITY_STATUS_LABELS,
  type UtilityStatus,
} from "@/lib/utilities/types";

const STYLES: Record<UtilityStatus, string> = {
  not_started: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-sky-100 text-sky-800 border-sky-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function UtilityStatusPill({
  value,
  className,
}: {
  value: UtilityStatus;
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
      {UTILITY_STATUS_LABELS[value]}
    </span>
  );
}
