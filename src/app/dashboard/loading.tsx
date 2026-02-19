import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-7 w-12" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4">
              <Skeleton className="h-16 w-20 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
