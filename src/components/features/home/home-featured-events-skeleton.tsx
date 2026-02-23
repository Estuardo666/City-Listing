export function HomeFeaturedEventsSkeleton() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-video bg-muted rounded-2xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
