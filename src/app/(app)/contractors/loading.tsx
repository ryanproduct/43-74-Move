import { Skeleton } from "@/components/ui/skeleton";

export default function ContractorsLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </header>

      {/* Two trade groups, each with three cards */}
      {Array.from({ length: 2 }).map((_, g) => (
        <section key={g} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2 border-b pb-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8 rounded-full" />
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-44 rounded-md" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
