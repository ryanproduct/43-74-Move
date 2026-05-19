import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PropertyPill } from "@/components/PropertyPill";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/types";
import type { DashboardProject } from "@/lib/dashboard/queries";

type Props = {
  projects: DashboardProject[];
};

function pct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

/**
 * "Project progress" widget: one row per active project (status != done),
 * with done/total task count, a percentage, and a thin progress bar.
 * Whole row links to the project workspace.
 */
export function ProjectProgressWidget({ projects }: Props) {
  return (
    <Card className="rounded-2xl border-stone-200/80 bg-[var(--mv-paper,#FBF7EE)] shadow-none">
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0 px-5 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-stone-500">
          Project progress
        </h2>
        <span className="text-xs text-stone-400">
          {projects.length === 1 ? "1 active" : `${projects.length} active`}
        </span>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {projects.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-stone-500">
            No active projects.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-stone-200/60">
            {projects.map((p) => {
              const percent = pct(p.task_count_done, p.task_count_total);
              const tone =
                percent >= 66
                  ? "bg-emerald-600"
                  : percent >= 33
                    ? "bg-sky-600"
                    : "bg-[var(--mv-clay,#C25A3F)]";
              return (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex flex-col gap-1.5 rounded-lg px-3 py-3 transition-colors hover:bg-stone-100/60"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[15px] font-medium text-stone-900">
                          {p.name}
                        </span>
                        <PropertyPill value={p.property} />
                      </div>
                      <span className="whitespace-nowrap text-sm tabular-nums text-stone-500">
                        {p.task_count_done} / {p.task_count_total} · {percent}%
                      </span>
                    </div>
                    <div className="relative h-[6px] overflow-hidden rounded-full bg-stone-200/70">
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full",
                          tone
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {PROJECT_STATUS_LABELS[p.status]}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
