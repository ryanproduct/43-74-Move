import { cn } from "@/lib/utils";
import {
  VERDICT_LABELS,
  type ContractorVerdict,
} from "@/lib/contractors/types";

type Props = {
  value: ContractorVerdict;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Coloured pill that visually maps a contractor's verdict to one of four
 * states. Colours follow the design reference's verdict palette:
 *   considering → stone (neutral)
 *   shortlist   → slate (blue/grey)
 *   chosen      → clay (filled, satisfying — primary)
 *   rejected    → muted (dimmed)
 */
const VERDICT_CLASSES: Record<ContractorVerdict, string> = {
  considering:
    "border-stone-300 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300",
  shortlist:
    "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300",
  chosen:
    "border-orange-600 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-500",
  rejected:
    "border-stone-200 bg-stone-50 text-stone-500 line-through decoration-stone-400/40 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-500",
};

export function VerdictPill({ value, size = "sm", className }: Props) {
  const dim = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        dim,
        VERDICT_CLASSES[value],
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          value === "considering" && "bg-stone-500",
          value === "shortlist" && "bg-sky-600",
          value === "chosen" && "bg-white",
          value === "rejected" && "bg-stone-400"
        )}
        aria-hidden
      />
      {VERDICT_LABELS[value]}
    </span>
  );
}
