"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CONTRACTOR_VERDICTS,
  VERDICT_HINTS,
  VERDICT_LABELS,
  type ContractorVerdict,
} from "@/lib/contractors/types";
import { setContractorVerdict } from "@/app/(app)/contractors/actions";

type Props = {
  contractorId: string;
  value: ContractorVerdict;
};

const SWATCH: Record<ContractorVerdict, string> = {
  considering: "bg-stone-400",
  shortlist: "bg-sky-500",
  chosen: "bg-orange-600",
  rejected: "bg-stone-300",
};

const PILL_CLASS: Record<ContractorVerdict, string> = {
  considering: "border-stone-300 bg-stone-100 text-stone-700",
  shortlist: "border-sky-300 bg-sky-100 text-sky-800",
  chosen: "border-orange-600 bg-orange-600 text-white shadow-sm",
  rejected: "border-stone-200 bg-stone-50 text-stone-500",
};

/**
 * The emotional centre of the detail page — a satisfying pill that opens a
 * dropdown menu with the four verdicts and their hint copy. Persists by
 * calling `setContractorVerdict` server-side and refreshing the route.
 */
export function VerdictPicker({ contractorId, value }: Props) {
  const router = useRouter();
  const [optimistic, setOptimistic] = React.useState<ContractorVerdict>(value);
  const [pending, startTransition] = React.useTransition();

  // Reset the optimistic value to match the server when the underlying prop
  // changes (e.g. after realtime refresh). Done during render to avoid the
  // cascading-render lint rule.
  const [trackedValue, setTrackedValue] = React.useState(value);
  if (value !== trackedValue) {
    setTrackedValue(value);
    setOptimistic(value);
  }

  function choose(next: ContractorVerdict) {
    if (next === optimistic) return;
    setOptimistic(next);
    startTransition(async () => {
      const result = await setContractorVerdict(contractorId, next);
      if (!result.ok) {
        // Roll back optimistic update on failure.
        setOptimistic(value);
        toast.error("Couldn't update verdict", { description: result.error });
        return;
      }
      toast.success(`Verdict set to ${VERDICT_LABELS[next].toLowerCase()}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Verdict
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70",
              PILL_CLASS[optimistic]
            )}
            aria-label={`Verdict: ${VERDICT_LABELS[optimistic]}. Click to change.`}
          >
            {optimistic === "chosen" && (
              <Check className="h-3.5 w-3.5" aria-hidden />
            )}
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                optimistic === "chosen" ? "bg-white" : SWATCH[optimistic]
              )}
              aria-hidden
            />
            <span>{VERDICT_LABELS[optimistic]}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[240px]">
          {CONTRACTOR_VERDICTS.map((v) => (
            <DropdownMenuItem
              key={v}
              onSelect={() => choose(v)}
              className="flex items-center gap-2"
            >
              <span
                className={cn("h-2 w-2 rounded-full", SWATCH[v])}
                aria-hidden
              />
              <span className="flex-1 font-medium">{VERDICT_LABELS[v]}</span>
              <span className="text-[11px] text-muted-foreground">
                {VERDICT_HINTS[v]}
              </span>
              {v === optimistic && (
                <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
