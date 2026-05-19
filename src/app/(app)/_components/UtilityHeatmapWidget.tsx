import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardUtility } from "@/lib/dashboard/queries";
import {
  UTILITY_STATUS_LABELS,
  UTILITY_TYPE_LABELS,
  type UtilityStatus,
} from "@/lib/utilities/types";

type Props = {
  utilities: DashboardUtility[];
};

const TILE_STYLES: Record<UtilityStatus, string> = {
  not_started:
    "bg-[var(--mv-paper,#FBF7EE)] border-stone-200 text-stone-700",
  in_progress:
    "bg-amber-50 border-amber-300/60 text-amber-900",
  done:
    "bg-emerald-50 border-emerald-300/60 text-emerald-900",
};

const DOT_STYLES: Record<UtilityStatus, string> = {
  not_started: "bg-stone-400",
  in_progress: "bg-amber-500",
  done: "bg-emerald-600",
};

/**
 * Utility heatmap: a coloured tile per utility. Colour comes from `status`
 * (not_started = neutral, in_progress = amber, done = emerald, per the
 * Prompt 6 brief). Hover tooltip via `title` shows name + type; tap navigates
 * to /utilities/[id].
 */
export function UtilityHeatmapWidget({ utilities }: Props) {
  return (
    <Card className="rounded-2xl border-stone-200/80 bg-[var(--mv-paper,#FBF7EE)] shadow-none">
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0 px-5 py-4">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-stone-500">
            Utilities
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Status across both properties — tap a tile for the detail page.
          </p>
        </div>
        <div className="hidden items-center gap-4 text-xs text-stone-500 md:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-stone-400" />
            Not started
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            In progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Done
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-1">
        {utilities.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            No utilities added yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {utilities.map((u) => (
              <Link
                key={u.id}
                href={`/utilities/${u.id}`}
                title={`${u.name} · ${UTILITY_TYPE_LABELS[u.type]}`}
                className={cn(
                  "group flex aspect-square flex-col justify-between rounded-xl border p-3 text-[13px] font-medium transition-transform hover:-translate-y-px",
                  TILE_STYLES[u.status]
                )}
              >
                <div className="leading-tight">
                  <div className="line-clamp-2">{u.name}</div>
                  <div className="mt-0.5 text-[11px] font-normal text-stone-500">
                    {UTILITY_TYPE_LABELS[u.type]}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-normal">
                  <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[u.status])} />
                  {UTILITY_STATUS_LABELS[u.status]}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
