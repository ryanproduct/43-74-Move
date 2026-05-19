import { formatDistanceToNow, parseISO } from "date-fns";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OwnerAvatar } from "@/components/OwnerAvatar";
import type { DashboardActivity } from "@/lib/dashboard/queries";

type Props = {
  rows: DashboardActivity[];
};

function relative(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

/**
 * "Recently changed" widget: last 10 rows of the `activity` table. The
 * `summary` column is pre-rendered server-side by the activity triggers, so we
 * just render it verbatim with the actor avatar and a relative timestamp.
 */
export function RecentActivityWidget({ rows }: Props) {
  return (
    <Card className="rounded-2xl border-stone-200/80 bg-[var(--mv-paper,#FBF7EE)] shadow-none">
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0 px-5 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-stone-500">
          Recently changed
        </h2>
        <span className="text-xs text-stone-400">Last {rows.length}</span>
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-0">
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-stone-500">
            No activity yet — make a change and it&rsquo;ll appear here.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-stone-200/60">
            {rows.map((row) => (
              <li
                key={row.id}
                className="grid grid-cols-[24px_1fr_auto] items-start gap-3 px-3 py-2"
              >
                <OwnerAvatar owner={row.actor} size="sm" className="mt-0.5" />
                <p className="text-[14px] leading-snug text-stone-700">
                  <span className="font-semibold text-stone-900">
                    {row.actor?.display_name ?? "Someone"}
                  </span>{" "}
                  {row.summary}
                </p>
                <span className="whitespace-nowrap text-[11px] tabular-nums text-stone-400">
                  {relative(row.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
