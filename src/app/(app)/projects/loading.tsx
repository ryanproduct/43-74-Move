import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </header>

      {Array.from({ length: 2 }).map((_, g) => (
        <section key={g} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-24" />
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-32 rounded-md" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
