import { Skeleton } from "@/components/ui/skeleton";

export default function UtilitiesLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </header>

      <div className="overflow-hidden rounded-md border">
        {/* Header row */}
        <div className="grid grid-cols-8 gap-3 border-b bg-muted/40 px-3 py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-8 gap-3 border-b px-3 py-3 last:border-b-0">
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton key={j} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
