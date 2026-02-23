export function HomePromoGridSkeleton() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-video bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    </section>
  )
}
