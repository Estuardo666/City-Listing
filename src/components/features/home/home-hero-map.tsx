'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Loader2, LocateFixed, Search, Sparkles, X, Map as MapIcon } from 'lucide-react'
import { PROXIMITY_STEPS, type ExploreEvent, type ExploreItem, type ExploreMapMarker, type ExploreVenue } from '@/types/explore'

const ExploreMapPanel = dynamic(
  () => import('@/components/features/explore/explore-map-panel').then((mod) => mod.ExploreMapPanel),
  { 
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/20">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-sm">
          <MapIcon className="h-8 w-8 text-primary animate-pulse" />
          <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/20 animate-ping" />
        </div>
      </div>
    )
  }
)

type HomeHeroMapProps = {
  venues: ExploreVenue[]
  events: ExploreEvent[]
  mapboxToken: string
  mapStyle: string
}

function buildMarkers(items: ExploreItem[]): ExploreMapMarker[] {
  return items
    .filter((item) => item.lat !== null && item.lng !== null)
    .map((item) => ({
      id: item.id,
      type: item._type,
      lat: item.lat as number,
      lng: item.lng as number,
      name: item._type === 'venue' ? item.name : item.title,
      slug: item.slug,
      category: item.category.name,
      categoryIcon: item.category.icon,
    }))
}

function matchesSearch(item: ExploreItem, query: string): boolean {
  const text = [
    item._type === 'venue' ? item.name : item.title,
    item.location,
    item.address ?? '',
    item.category.name,
    item.description,
  ]
    .join(' ')
    .toLowerCase()

  return text.includes(query.toLowerCase())
}

export function HomeHeroMap({ venues, events, mapboxToken, mapStyle }: HomeHeroMapProps) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [proximityRadius, setProximityRadius] = useState<number | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(20) // Limit to 20 initial markers

  const quickSearches = [
    'Café', 'Restaurantes', 'Bares', 'Conciertos', 'Arte',
    'Naturaleza', 'Deportes', 'Rooftop', 'Brunch', 'Pet friendly'
  ]
  const mapRef = useRef<{ flyTo: (opts: { center: [number, number]; zoom: number; duration: number }) => void } | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q)
      setVisibleLimit(20) // Reset limit on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  const allItems = useMemo<ExploreItem[]>(() => {
    const venueItems: ExploreItem[] = venues.map((venue) => ({ ...venue, _type: 'venue' as const }))
    const eventItems: ExploreItem[] = events.map((event) => ({ ...event, _type: 'event' as const }))
    return [...venueItems, ...eventItems]
  }, [venues, events])

  const visibleItems = useMemo(() => {
    if (!debouncedQ.trim()) return allItems
    return allItems.filter((item) => matchesSearch(item, debouncedQ))
  }, [allItems, debouncedQ])

  const markers = useMemo(() => buildMarkers(visibleItems.slice(0, visibleLimit)), [visibleItems, visibleLimit])
  
  // Background load more markers
  useEffect(() => {
    if (visibleLimit < visibleItems.length) {
      const timer = setTimeout(() => {
        setVisibleLimit(prev => Math.min(prev + 30, visibleItems.length))
      }, 500) // Load more after initial render
      return () => clearTimeout(timer)
    }
  }, [visibleLimit, visibleItems.length])
  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (term.length < 3) return []

    return allItems
      .filter((item) => {
        const primary = item._type === 'venue' ? item.name : item.title
        return primary.toLowerCase().includes(term)
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        label: item._type === 'venue' ? item.name : item.title,
        type: item._type,
      }))
  }, [allItems, q])

  const venueCount = useMemo(
    () => visibleItems.filter((item) => item._type === 'venue').length,
    [visibleItems]
  )
  const eventCount = useMemo(
    () => visibleItems.filter((item) => item._type === 'event').length,
    [visibleItems]
  )

  const handleRequestLocation = () => {
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setProximityRadius(PROXIMITY_STEPS[1])
        setLocationLoading(false)
        mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 14, duration: 800 })
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const wheelHandler = (e: WheelEvent) => {
      const isScrollable = container.scrollWidth > container.clientWidth
      if (isScrollable) {
        e.preventDefault()
        e.stopPropagation()
        container.scrollLeft += e.deltaY
      }
    }

    container.addEventListener('wheel', wheelHandler, { passive: false })
    
    return () => {
      container.removeEventListener('wheel', wheelHandler)
    }
  }, [])

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0))
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 2
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleSearchSubmit = () => {
    if (!q.trim()) {
      router.push('/explorar')
      return
    }
    router.push(`/explorar?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <section className="relative h-[85vh] w-full overflow-hidden border-y border-border/60 bg-background">
      <ExploreMapPanel
        markers={markers}
        items={visibleItems}
        activeId={activeId}
        onMarkerClick={setActiveId}
        onBoundsChange={() => undefined}
        mapboxToken={mapboxToken}
        mapStyle={mapStyle}
        userLocation={userLocation}
        proximityRadius={proximityRadius}
        onMapRef={(ref) => {
          mapRef.current = ref
        }}
        showSearchOnMoveToggle={false}
        className="h-full w-full opacity-70 transition-opacity duration-500"
      />

      <motion.div
        layout
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-4 right-4 bottom-4 z-20 sm:left-6 sm:bottom-6 md:left-8 md:bottom-8 md:right-auto md:w-[460px] max-w-full"
      >
        <motion.div
          layout
          className="pointer-events-auto flex flex-col gap-3.5 sm:gap-4 rounded-[2rem] border border-border/50 bg-card p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-card sm:p-5"
          suppressHydrationWarning
        >
          {/* Header */}
          <motion.div layout className="flex flex-col gap-0.5 sm:gap-1">
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Tu próximo plan está aquí
              </h2>
            </div>
            <p className="text-sm font-medium text-muted-foreground pl-7">
              Hoy puede ser una noche épica en Loja
            </p>
          </motion.div>

          {/* Search Input */}
          <motion.div layout className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit()
              }}
              placeholder="Busca lugares, eventos o categorías en el mapa"
              aria-label="Buscar lugares, eventos o categorías"
              suppressHydrationWarning
              className="h-12 w-full rounded-2xl border border-border/50 bg-input pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground shadow-sm backdrop-blur-md transition-all focus:border-primary/50 focus:bg-input focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-input dark:focus:bg-input"
            />
            <AnimatePresence>
              {q.length > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setQ('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Suggestions AnimatePresence */}
          <AnimatePresence mode="popLayout">
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-2xl border border-border/50 bg-popover backdrop-blur-md shadow-md dark:border-white/10 dark:bg-popover"
              >
                <div className="p-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => setQ(suggestion.label)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground dark:hover:bg-white/10"
                    >
                      <span>{suggestion.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {suggestion.type === 'venue' ? 'Local' : 'Evento'}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tags (carousel style) */}
          <motion.div layout className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex w-full gap-1.5 overflow-x-auto pb-2 scrollbar-minimal scroll-smooth touch-pan-x cursor-grab active:cursor-grabbing select-none" 
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {quickSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQ(term)}
                  className="flex-shrink-0 rounded-xl border border-border/50 bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:scale-105 hover:bg-emerald/10 hover:text-emerald hover:border-emerald/20 dark:bg-white/5 dark:hover:bg-emerald/20"
                >
                  {term}
                </button>
              ))}
            </div>
            {/* Gradient edges for scroll effect */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-card to-transparent z-10" suppressHydrationWarning />
            <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-card to-transparent z-10" suppressHydrationWarning />
          </motion.div>

          {/* Location button and filters */}
          <motion.div layout className="flex items-center gap-1 pt-0.5 w-full overflow-hidden flex-nowrap">
            <button
              type="button"
              onClick={handleRequestLocation}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary/90 whitespace-nowrap"
            >
              {locationLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
              Cerca de mí
            </button>

            <AnimatePresence mode="popLayout">
              {userLocation && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-wrap items-center gap-1 w-full"
                >
                  {PROXIMITY_STEPS.map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setProximityRadius(step)}
                      className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold shadow-sm backdrop-blur-md transition-all hover:scale-105 whitespace-nowrap ${
                        proximityRadius === step
                          ? 'border-transparent bg-foreground text-background shadow-md'
                          : 'border-border/50 bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground dark:border-white/10 dark:bg-secondary dark:hover:bg-accent'
                      }`}
                    >
                      {step >= 1000 ? `${step / 1000} km` : `${step} m`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setUserLocation(null)
                      setProximityRadius(null)
                    }}
                    className="flex shrink-0 h-5 w-5 items-center justify-center rounded-full border border-border/50 bg-secondary text-secondary-foreground shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground dark:border-white/10 dark:bg-secondary dark:hover:bg-destructive"
                    aria-label="Quitar proximidad"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer stats */}
          <motion.div layout className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-1 text-[11px] sm:text-xs font-medium text-muted-foreground border-t border-border/50 dark:border-white/10">
            <span className="pt-1.5">{visibleItems.length} resultados</span>
            <span className="hidden sm:inline pt-1.5">•</span>
            <span className="pt-1.5">{venueCount} locales</span>
            <span className="hidden sm:inline pt-1.5">•</span>
            <span className="pt-1.5">{eventCount} eventos</span>
            <span className="hidden sm:inline pt-1.5">•</span>
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="font-bold text-primary transition-colors hover:text-primary/80 pt-1.5 ml-auto sm:ml-0"
            >
              Quiero descubrir ahora
            </button>
          </motion.div>

        </motion.div>
      </motion.div>
    </section>
  )
}
