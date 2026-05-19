import { cn } from "@/lib/utils";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

type Props = {
  date: string | null;
  className?: string;
  showRelative?: boolean;
};

/**
 * Renders a due date as `15 May` plus a muted tail like `in 3 days` /
 * `overdue 2 days` / `today`. Returns null when there is no date.
 */
export function DatePill({ date, className, showRelative = true }: Props) {
  if (!date) return null;

  let parsed: Date;
  try {
    parsed = parseISO(date);
  } catch {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(parsed, today);

  let relative = "";
  let tone = "text-muted-foreground";
  if (showRelative) {
    if (diff === 0) {
      relative = "today";
      tone = "text-amber-700";
    } else if (diff > 0) {
      relative = `in ${diff} day${diff === 1 ? "" : "s"}`;
    } else {
      const overdue = Math.abs(diff);
      relative = `overdue ${overdue} day${overdue === 1 ? "" : "s"}`;
      tone = "text-rose-700";
    }
  }

  const formatted = format(parsed, "d MMM");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        className
      )}
    >
      <span className="rounded-full border bg-background px-2 py-0.5">
        {formatted}
      </span>
      {relative && <span className={tone}>{relative}</span>}
    </span>
  );
}
