import { Skeleton } from '@/components/ui/skeleton';

/**
 * Streaming skeleton — shown while the Server Component fetch is in flight.
 * Next.js renders this automatically thanks to the file's name, no router
 * config needed. Mirrors the real layout so the page doesn't shift on
 * transition.
 */
export default function ProjectsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card/50 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-9 flex-1 lg:max-w-sm" />
          <Skeleton className="h-9 lg:w-[180px]" />
          <Skeleton className="h-9 lg:w-[140px]" />
          <Skeleton className="h-9 lg:w-[120px]" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
