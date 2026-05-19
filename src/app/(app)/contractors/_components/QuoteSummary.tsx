import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatGBPFromPence } from "@/lib/contractors/types";

type Props = {
  amountPence: number | null;
  includes: string | null;
  excludes: string | null;
  timeline?: string | null;
  className?: string;
};

/**
 * The quote summary block — big £ amount with a coloured underline accent,
 * and a two-column includes / excludes list. Renders as a compact stack on
 * narrow viewports.
 */
export function QuoteSummary({
  amountPence,
  includes,
  excludes,
  timeline,
  className,
}: Props) {
  const includesItems = splitLines(includes);
  const excludesItems = splitLines(excludes);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Quote
        </p>
        <div className="mt-2 inline-block">
          <p className="font-semibold leading-none tracking-tight text-foreground text-5xl sm:text-6xl tabular-nums">
            {amountPence === null ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              formatGBPFromPence(amountPence)
            )}
          </p>
          <span
            aria-hidden
            className="mt-2 block h-[3px] w-16 rounded-full bg-primary/90"
          />
        </div>
      </div>

      {(includesItems.length > 0 || excludesItems.length > 0) && (
        <div className="grid grid-cols-1 gap-6 border-t pt-4 sm:grid-cols-2 sm:gap-0">
          <div className="sm:pr-6">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Check className="h-3 w-3" />
              Includes
            </p>
            {includesItems.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Not yet specified.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {includesItems.map((line, i) => (
                  <li
                    key={i}
                    className="relative pl-4 text-sm leading-snug text-foreground/80"
                  >
                    <span className="absolute left-0 top-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="sm:border-l sm:pl-6">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <X className="h-3 w-3" />
              Excludes
            </p>
            {excludesItems.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Not yet specified.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {excludesItems.map((line, i) => (
                  <li
                    key={i}
                    className="relative pl-4 text-sm leading-snug text-foreground/80"
                  >
                    <span className="absolute left-[3px] top-[10px] inline-block h-[2px] w-2 rounded bg-stone-400" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {timeline && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Timeline
          </span>
          <span className="font-medium">{timeline}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Splits a free-form includes/excludes string into bullet items.
 * Accepts newline-delimited lists, or comma/semicolon-delimited single-liners.
 */
function splitLines(value: string | null): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  // Prefer newlines; fall back to semicolons; never split on commas because
  // people legitimately write "Removal & disposal, including skip hire".
  const lines = trimmed.includes("\n")
    ? trimmed.split(/\r?\n/)
    : trimmed.split(/;\s*/);
  return lines
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter((l) => l.length > 0);
}
