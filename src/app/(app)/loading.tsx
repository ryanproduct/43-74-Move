import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading state. Mirrors the eight-widget layout of the live page
 * (two countdowns row, then today/week/blocked, projects/activity, utilities)
 * so the swap-in feels stable. Pure visual — no data.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-6 md:px-7 md:py-7">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </header>

      {/* Countdowns */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </section>

      {/* Today / Week / Blocked */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <Skeleton className="h-64 md:col-span-5 rounded-xl" />
        <Skeleton className="h-64 md:col-span-4 rounded-xl" />
        <Skeleton className="h-64 md:col-span-3 rounded-xl" />
      </section>

      {/* Projects / Activity */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <Skeleton className="h-56 md:col-span-7 rounded-xl" />
        <Skeleton className="h-56 md:col-span-5 rounded-xl" />
      </section>

      {/* Utility heatmap */}
      <section>
        <Skeleton className="h-40 rounded-xl" />
      </section>
    </div>
  );
}
