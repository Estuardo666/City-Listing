export function HomeLatestVenuesSkeleton() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 space-y-3 w-64">
            <div className="aspect-square bg-muted rounded-2xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
