export function HomeCategoriesGridSkeleton() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    </section>
  )
}
