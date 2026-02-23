export function HomeHeroMapSkeleton() {
  return (
    <div className="relative w-full h-[500px] sm:h-[600px] rounded-3xl overflow-hidden bg-muted animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted-foreground/20 mx-auto">
            <div className="animate-spin w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
      
      {/* Search bar placeholder */}
      <div className="absolute top-4 left-4 right-4 h-12 bg-card rounded-xl shadow-md" />
      
      {/* Quick search placeholders */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 bg-card rounded-lg flex-shrink-0" />
        ))}
      </div>
    </div>
  )
}
