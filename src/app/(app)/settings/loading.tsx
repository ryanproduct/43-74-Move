import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6 md:px-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
      </div>

      <Skeleton className="h-9 w-32 rounded-md" />

      <div className="space-y-3 border-t border-border pt-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
    </div>
  );
}
