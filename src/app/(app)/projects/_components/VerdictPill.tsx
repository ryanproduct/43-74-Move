import { cn } from "@/lib/utils";

type Verdict = "considering" | "shortlist" | "chosen" | "rejected";

const STYLES: Record<Verdict, string> = {
  considering: "bg-slate-100 text-slate-700 border-slate-200",
  shortlist: "bg-amber-100 text-amber-800 border-amber-200",
  chosen: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

const LABELS: Record<Verdict, string> = {
  considering: "Considering",
  shortlist: "Shortlist",
  chosen: "Chosen",
  rejected: "Rejected",
};

/**
 * Tiny contractor verdict pill, used only inside the projects route to render
 * the "Contractors considered" section. The Contractors database owns its own
 * version (in `/contractors/`) — we deliberately keep a parallel local copy
 * here to avoid editing shared components owned by another agent.
 */
export function VerdictPill({
  value,
  className,
}: {
  value: Verdict;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        STYLES[value],
        className
      )}
    >
      {LABELS[value]}
    </span>
  );
}
