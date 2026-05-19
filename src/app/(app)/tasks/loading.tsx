import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </header>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-md" />
        ))}
      </div>

      {/* Task rows */}
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-16 rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}
