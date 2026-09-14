export function HomeHeroMapSkeleton() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden border-y border-border/60 bg-background animate-pulse sm:h-[85vh]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted-foreground/20 mx-auto">
            <div className="animate-spin w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
      
      {/* Search bar placeholder */}
      <div className="absolute bottom-2 left-4 right-4 h-44 rounded-[2rem] bg-card shadow-md sm:bottom-6 sm:left-6 sm:right-auto sm:h-56 sm:w-[460px]" />
      
      {/* Quick search placeholders */}
      <div className="absolute bottom-8 left-8 right-8 flex gap-2 overflow-hidden sm:bottom-12 sm:left-10 sm:right-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 bg-card rounded-lg flex-shrink-0" />
        ))}
      </div>
    </div>
  )
}
