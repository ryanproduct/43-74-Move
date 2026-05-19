import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </header>

      {/* Add-item bar */}
      <Skeleton className="h-12 w-full rounded-md" />

      {/* Three room sections, each with a handful of rows */}
      {Array.from({ length: 3 }).map((_, r) => (
        <section key={r} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </section>
      ))}
    </div>
  );
}
