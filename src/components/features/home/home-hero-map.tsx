'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Loader2, LocateFixed, Search, Sparkles, X } from 'lucide-react'
import { ExploreMapPanel } from '@/components/features/explore/explore-map-panel'
import { PROXIMITY_STEPS, type ExploreEvent, type ExploreItem, type ExploreMapMarker, type ExploreVenue } from '@/types/explore'

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
  const [variant, setVariant] = useState<'clean' | 'emotional'>('clean')
  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [proximityRadius, setProximityRadius] = useState<number | null>(null)
  const quickSearches = ['Cafe', 'Conciertos', 'Brunch', 'Rooftop', 'Pet friendly']
  const mapRef = useRef<{ flyTo: (opts: { center: [number, number]; zoom: number; duration: number }) => void } | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem('home-hero-variant')
    if (stored === 'clean' || stored === 'emotional') {
      setVariant(stored)
      return
    }
    const next = Math.random() > 0.5 ? 'clean' : 'emotional'
    setVariant(next)
    window.localStorage.setItem('home-hero-variant', next)
  }, [])

  const allItems = useMemo<ExploreItem[]>(() => {
    const venueItems: ExploreItem[] = venues.map((venue) => ({ ...venue, _type: 'venue' as const }))
    const eventItems: ExploreItem[] = events.map((event) => ({ ...event, _type: 'event' as const }))
    return [...venueItems, ...eventItems]
  }, [venues, events])

  const visibleItems = useMemo(() => {
    if (!q.trim()) return allItems
    return allItems.filter((item) => matchesSearch(item, q))
  }, [allItems, q])

  const markers = useMemo(() => buildMarkers(visibleItems), [visibleItems])
  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (term.length < 2) return []

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

  const handleSearchSubmit = () => {
    if (!q.trim()) {
      router.push('/explorar')
      return
    }
    router.push(`/explorar?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <section className="relative h-[80vh] w-full overflow-hidden border-y border-border/60">
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
        className="h-full w-full"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="pointer-events-none absolute inset-x-3 bottom-4 z-20 mx-auto w-full max-w-3xl sm:bottom-6"
      >
        <div
          className={`pointer-events-auto rounded-2xl border border-border/80 p-3 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 md:p-4 ${
            variant === 'clean' ? 'bg-background/95' : 'bg-gradient-to-br from-background/95 via-background/90 to-primary/10'
          }`}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3 px-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              <Sparkles className="h-3 w-3" />
              {variant === 'clean' ? 'Descubre Loja en vivo' : 'Tu próximo plan está aquí'}
            </span>
            <p className="text-sm text-foreground md:text-base">
              {variant === 'clean' ? '¿Qué plan quieres hacer hoy?' : 'Hoy puede ser una noche épica en Loja'}
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit()
              }}
              placeholder="Busca lugares, eventos o categorías en el mapa"
              aria-label="Buscar lugares, eventos o categorías"
              className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 md:h-14 md:text-lg"
            />
            <AnimatePresence>
              {q.length > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQ('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="mt-3 rounded-xl border border-border bg-card p-2"
              >
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => setQ(suggestion.label)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <span>{suggestion.label}</span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {suggestion.type === 'venue' ? 'Local' : 'Evento'}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 px-1">
            {quickSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQ(term)}
                className="rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                {term}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2.5 px-1">
            <button
              type="button"
              onClick={handleRequestLocation}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {locationLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
              Cerca de mí
            </button>

            {userLocation && (
              <>
                {PROXIMITY_STEPS.map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setProximityRadius(step)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      proximityRadius === step
                        ? 'border-primary/50 bg-primary text-primary-foreground'
                        : 'border-border bg-secondary/70 text-foreground hover:bg-accent'
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
                  className="rounded-full border border-border bg-secondary/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Quitar proximidad
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 px-1 pt-3 text-xs text-foreground md:text-sm">
            <span>{visibleItems.length} resultados en tiempo real</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
            <span>{venueCount} locales</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
            <span>{eventCount} eventos</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="font-semibold text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary"
            >
              {variant === 'clean' ? 'Ver resultados completos' : 'Quiero descubrir ahora'}
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
