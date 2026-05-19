import { format } from "date-fns";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  /** Target instant in UTC. The widget renders the delta against `now`. */
  target: Date;
  /** Pre-label like "Keys to" or "Last day at". */
  label: string;
  /** Address line, e.g. "74 Addison Way". */
  address: string;
  /** Accent tone — clay (keys) or slate (move-out). */
  tone?: "clay" | "slate";
  /** Total window length in days, used to size the dot strip. */
  windowDays?: number;
  /** Optional caption shown under the big number when the date is upcoming. */
  caption?: string;
};

/**
 * Big numeric countdown card. Shows days + hours until `target`; when the
 * target is past, switches to a "Done" state ("Keys collected ✓" /
 * "Move-out complete ✓"). Matches the design reference layout: accent bar,
 * uppercase label, address line, large tabular-nums number, hours caption,
 * and a tiny dot progress strip.
 */
export function CountdownWidget({
  target,
  label,
  address,
  tone = "clay",
  windowDays = 30,
  caption,
}: Props) {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const totalHours = Math.max(0, Math.floor(diffMs / (60 * 60 * 1000)));
  const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const isPast = diffMs <= 0;

  const dateLabel = format(target, "EEE, d MMM yyyy");

  // Build a 30-dot strip. Filled = remaining proportion of the window.
  const dots = 30;
  const remainingPct = isPast
    ? 0
    : Math.min(1, Math.max(0, days / windowDays));
  const onDots = Math.round(dots * remainingPct);

  const accent =
    tone === "clay"
      ? "bg-[var(--mv-clay,#C25A3F)]"
      : "bg-[var(--mv-slate,#5C7A8E)]";
  const wash = tone === "clay" ? "from-orange-50/70 to-transparent" : "";

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border-stone-200/80 bg-[var(--mv-paper,#FBF7EE)] p-6 pt-5 shadow-none",
        tone === "clay" && "bg-gradient-to-b",
        wash
      )}
    >
      <div className="absolute right-5 top-5 text-[13px] tabular-nums text-stone-500">
        {dateLabel}
      </div>

      <div className={cn("mb-4 h-[3px] w-16 rounded-sm", accent)} />

      <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        {isPast
          ? tone === "clay"
            ? "Keys collected"
            : "Move-out complete"
          : label}
      </div>
      <div className="mt-1 text-[22px] font-semibold tracking-tight text-stone-900">
        {address}
      </div>

      {isPast ? (
        <div className="mt-4 text-[44px] font-semibold leading-none tracking-tight text-emerald-700">
          Done <span className="text-stone-500">✓</span>
        </div>
      ) : (
        <>
          <div className="mt-4 text-[72px] font-semibold leading-none tracking-[-0.04em] text-stone-900 tabular-nums sm:text-[88px]">
            {days}
            <span className="ml-2 align-middle text-[16px] font-medium tracking-normal text-stone-500">
              {days === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="mt-2 text-[13px] text-stone-500 tabular-nums">
            {totalHours.toLocaleString()} hours
            {caption ? ` · ${caption}` : ""}
          </div>
        </>
      )}

      <div className="mt-5 flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: dots }).map((_, i) => {
          const on = i < onDots;
          return (
            <span
              key={i}
              className={cn(
                "h-[6px] w-[6px] rounded-full",
                on
                  ? tone === "clay"
                    ? "bg-[var(--mv-clay,#C25A3F)] opacity-90"
                    : "bg-[var(--mv-slate,#5C7A8E)] opacity-90"
                  : "bg-stone-300/60"
              )}
            />
          );
        })}
      </div>
    </Card>
  );
}
