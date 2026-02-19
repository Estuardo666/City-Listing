'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutList,
  Map as MapIcon,
  Loader2,
  Search,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { ExploreFiltersPanel } from './explore-filters'
import { ExploreFilterDrawer } from './explore-filter-drawer'
import { ExploreCard } from './explore-card'
import { ExploreMapPanel } from './explore-map-panel'
import { cn } from '@/lib/utils'
import type {
  ExploreFilters,
  ExploreItem,
  ExploreMapMarker,
  ExploreVenue,
  ExploreEvent,
  MapBounds,
  UserLocation,
} from '@/types/explore'
import { PROXIMITY_STEPS } from '@/types/explore'

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
}

type ExploreClientProps = {
  initialVenues: ExploreVenue[]
  initialEvents: ExploreEvent[]
  categories: Category[]
  mapboxToken: string
  mapStyle: string
}

type ExploreSearchPageInfo = {
  hasMoreVenues: boolean
  hasMoreEvents: boolean
  nextVenueSkip: number
  nextEventSkip: number
}

type ExploreSearchResponse = {
  venues?: ExploreVenue[]
  events?: ExploreEvent[]
  pageInfo?: ExploreSearchPageInfo
}

const DEFAULT_FILTERS: ExploreFilters = {
  q: '',
  type: 'all',
  category: '',
  featured: false,
}

const SEARCH_TAKE = 60
const SEARCH_DEBOUNCE_MS = 500

function buildMarkers(items: ExploreItem[]): ExploreMapMarker[] {
  return items
    .filter((i) => i.lat !== null && i.lng !== null)
    .map((i) => ({
      id: i.id,
      type: i._type,
      lat: i.lat as number,
      lng: i.lng as number,
      name: i._type === 'venue' ? i.name : i.title,
      slug: i.slug,
      category: i.category.name,
      categoryIcon: i.category.icon,
    }))
}

/** Count how many filter values differ from default (excluding q which has its own UI) */
function countActiveFilters(filters: ExploreFilters): number {
  let count = 0
  if (filters.type !== 'all') count++
  if (filters.featured) count++
  if (filters.category !== '') count++
  if (filters.q !== '') count++
  return count
}

export function ExploreClient({
  initialVenues,
  initialEvents,
  categories,
  mapboxToken,
  mapStyle,
}: ExploreClientProps) {
  const [filters, setFilters] = useState<ExploreFilters>(DEFAULT_FILTERS)
  const [venues, setVenues] = useState<ExploreVenue[]>(initialVenues)
  const [events, setEvents] = useState<ExploreEvent[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [proximityRadius, setProximityRadius] = useState<number | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const mapRef = useRef<{ flyTo: (opts: { center: [number, number]; zoom: number; duration: number }) => void } | null>(null)
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null)
  const [pagination, setPagination] = useState<ExploreSearchPageInfo>({
    hasMoreVenues: initialVenues.length >= SEARCH_TAKE,
    hasMoreEvents: initialEvents.length >= SEARCH_TAKE,
    nextVenueSkip: initialVenues.length,
    nextEventSkip: initialEvents.length,
  })

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters])

  // All items from search/filter results
  const allItems = useMemo<ExploreItem[]>(() => {
    const v: ExploreItem[] = venues.map((v) => ({ ...v, _type: 'venue' as const }))
    const e: ExploreItem[] = events.map((e) => ({ ...e, _type: 'event' as const }))
    return [...v, ...e]
  }, [venues, events])

  // Haversine distance in meters
  const haversine = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }, [])

  // Items filtered by proximity OR map bounds
  const items = useMemo<ExploreItem[]>(() => {
    let result = allItems
    if (userLocation && proximityRadius !== null) {
      result = result.filter((item) => {
        if (item.lat === null || item.lng === null) return false
        return haversine(userLocation.lat, userLocation.lng, item.lat, item.lng) <= proximityRadius
      })
    } else if (mapBounds) {
      result = result.filter((item) => {
        if (item.lat === null || item.lng === null) return false
        return (
          item.lat <= mapBounds.north &&
          item.lat >= mapBounds.south &&
          item.lng <= mapBounds.east &&
          item.lng >= mapBounds.west
        )
      })
    }
    return result
  }, [allItems, mapBounds, userLocation, proximityRadius, haversine])

  // Markers always from all items (so off-screen markers still show on map)
  const markers = useMemo(() => buildMarkers(allItems), [allItems])

  const handleBoundsChange = useCallback((bounds: MapBounds | null) => {
    setMapBounds(bounds)
  }, [])

  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setProximityRadius(PROXIMITY_STEPS[1]) // default 1km
        setLocationLoading(false)
        mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 14, duration: 800 })
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const handleClearLocation = useCallback(() => {
    setUserLocation(null)
    setProximityRadius(null)
  }, [])

  const handleProximityChange = useCallback((meters: number) => {
    setProximityRadius(meters)
  }, [])

  const fetchResults = useCallback(async (f: ExploreFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: f.q,
        type: f.type,
        category: f.category,
        featured: String(f.featured),
        take: String(SEARCH_TAKE),
        venueSkip: '0',
        eventSkip: '0',
      })
      const res = await fetch(`/api/explore/search?${params}`)
      const data = (await res.json()) as ExploreSearchResponse
      const nextVenues = data.venues ?? []
      const nextEvents = data.events ?? []

      setVenues(nextVenues)
      setEvents(nextEvents)
      setPagination(
        data.pageInfo ?? {
          hasMoreVenues: nextVenues.length >= SEARCH_TAKE,
          hasMoreEvents: nextEvents.length >= SEARCH_TAKE,
          nextVenueSkip: nextVenues.length,
          nextEventSkip: nextEvents.length,
        }
      )
    } catch {
      // keep previous results
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMoreResults = useCallback(async () => {
    const hasMoreForType =
      filters.type === 'venues'
        ? pagination.hasMoreVenues
        : filters.type === 'events'
          ? pagination.hasMoreEvents
          : pagination.hasMoreVenues || pagination.hasMoreEvents

    if (!hasMoreForType) return

    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        q: filters.q,
        type: filters.type,
        category: filters.category,
        featured: String(filters.featured),
        take: String(SEARCH_TAKE),
        venueSkip: String(pagination.nextVenueSkip),
        eventSkip: String(pagination.nextEventSkip),
      })
      const res = await fetch(`/api/explore/search?${params}`)
      const data = (await res.json()) as ExploreSearchResponse
      const nextVenues = data.venues ?? []
      const nextEvents = data.events ?? []

      setVenues((prev) => [...prev, ...nextVenues])
      setEvents((prev) => [...prev, ...nextEvents])
      setPagination(
        data.pageInfo ?? {
          hasMoreVenues: nextVenues.length >= SEARCH_TAKE,
          hasMoreEvents: nextEvents.length >= SEARCH_TAKE,
          nextVenueSkip: pagination.nextVenueSkip + nextVenues.length,
          nextEventSkip: pagination.nextEventSkip + nextEvents.length,
        }
      )
    } catch {
      // keep previous results
    } finally {
      setLoadingMore(false)
    }
  }, [filters, pagination])

  const handleFilterChange = useCallback(
    (partial: Partial<ExploreFilters>) => {
      const next = { ...filters, ...partial }
      setFilters(next)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchResults(next), SEARCH_DEBOUNCE_MS)
    },
    [filters, fetchResults]
  )

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    fetchResults(DEFAULT_FILTERS)
  }, [fetchResults])

  const hasMoreResults =
    filters.type === 'venues'
      ? pagination.hasMoreVenues
      : filters.type === 'events'
        ? pagination.hasMoreEvents
        : pagination.hasMoreVenues || pagination.hasMoreEvents

  useEffect(() => {
    const root = listScrollRef.current
    const sentinel = loadMoreSentinelRef.current
    if (!root || !sentinel || !hasMoreResults || loadingMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        void fetchMoreResults()
      },
      {
        root,
        rootMargin: '240px',
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchMoreResults, hasMoreResults, loading, loadingMore])

  const handleMarkerClick = useCallback((id: string) => {
    setActiveId(id)
    const el = cardRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [])

  const handleCardHover = useCallback((id: string | null) => {
    setActiveId(id)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {/* ── Mobile top bar ── */}
        <div className="flex flex-col gap-2 border-b border-border/50 bg-card px-4 py-2 sm:hidden">
          {/* Row 1: search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => handleFilterChange({ q: e.target.value })}
              placeholder="Buscar lugares, eventos..."
              className="h-9 w-full rounded-xl border border-border/60 bg-secondary/40 pl-9 pr-8 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
            <AnimatePresence>
              {filters.q && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={() => handleFilterChange({ q: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Row 2: filters button + list/map toggle */}
          <div className="flex items-center justify-between">
            {/* Filters button with badge */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="relative flex items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.span
                    key={activeFilterCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Lista / Mapa toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-secondary/40 p-0.5">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  mobileView === 'list'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => setMobileView('map')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  mobileView === 'map'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Mapa
              </button>
            </div>
          </div>
        </div>

        {/* ── Desktop: 3-column layout | Mobile: stacked ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* ── LEFT: Filters sidebar (desktop) ── */}
          <motion.div
            initial={false}
            animate={{
              width: sidebarOpen ? 256 : 0,
              opacity: sidebarOpen ? 1 : 0,
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="hidden shrink-0 flex-col overflow-hidden border-r border-border/50 bg-card sm:flex"
            style={{ minWidth: 0 }}
          >
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-full flex-col px-4 py-5"
                >
                  <ExploreFiltersPanel
                    filters={filters}
                    categories={categories}
                    totalResults={items.length}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                    variant="sidebar"
                    userLocation={userLocation}
                    proximityRadius={proximityRadius}
                    onRequestLocation={handleRequestLocation}
                    onClearLocation={handleClearLocation}
                    onProximityChange={handleProximityChange}
                    locationLoading={locationLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── MIDDLE: Results list ── */}
          <div
            className={cn(
              'flex min-h-0 flex-col overflow-hidden',
              // Mobile visibility
              mobileView === 'list' ? 'flex' : 'hidden',
              // Desktop: always visible, takes remaining space
              'sm:flex sm:flex-1'
            )}
          >
            {/* Results header — also holds desktop sidebar toggle */}
            <div className="flex items-center justify-between border-b border-border/50 bg-card/80 px-4 py-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                {/* Desktop sidebar toggle button */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  className={cn(
                    'relative hidden items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex',
                  )}
                  aria-label={sidebarOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
                  title={sidebarOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                  {/* Badge when sidebar is closed and filters are active */}
                  <AnimatePresence>
                    {!sidebarOpen && activeFilterCount > 0 && (
                      <motion.span
                        key={activeFilterCount}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
                      >
                        {activeFilterCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{items.length}</span>{' '}
                  {items.length === 1 ? 'resultado' : 'resultados'}
                </p>

                <AnimatePresence>
                  {mapBounds && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                    >
                      <MapIcon className="h-2.5 w-2.5" />
                      en área del mapa
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {loading && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Buscando...
                </motion.span>
              )}
            </div>

            {/* Cards */}
            <div ref={listScrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex gap-3.5 rounded-2xl border border-border/50 bg-card p-3"
                      >
                        <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-accent sm:h-28 sm:w-28" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 w-16 animate-pulse rounded-full bg-accent" />
                          <div className="h-4 w-3/4 animate-pulse rounded-full bg-accent" />
                          <div className="h-3 w-full animate-pulse rounded-full bg-accent" />
                          <div className="h-3 w-2/3 animate-pulse rounded-full bg-accent" />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : items.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 py-20 text-center"
                  >
                    <span className="text-4xl">🗺️</span>
                    <p className="text-base font-semibold text-foreground">Sin resultados</p>
                    <p className="text-sm text-muted-foreground">
                      Prueba con otros filtros o amplía la búsqueda.
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-2 rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      Limpiar filtros
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="results" className="space-y-3">
                    {items.map((item, i) => (
                      <div
                        key={item.id}
                        ref={(el) => {
                          cardRefs.current[item.id] = el
                        }}
                        className="relative"
                      >
                        <ExploreCard
                          item={item}
                          isActive={activeId === item.id}
                          onHover={handleCardHover}
                          index={i}
                        />
                      </div>
                    ))}

                    {hasMoreResults && <div ref={loadMoreSentinelRef} className="h-8" />}

                    {loadingMore && (
                      <div className="flex items-center justify-center pt-2 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Cargando más resultados...
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── RIGHT: Map (50% on desktop) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              // Mobile: full screen when map view selected
              mobileView === 'map' ? 'flex min-h-0 flex-1' : 'hidden',
              // Desktop: always visible, fixed 50% width
              'sm:flex sm:min-h-0 sm:w-1/2 sm:shrink-0'
            )}
          >
            <ExploreMapPanel
              markers={markers}
              items={allItems}
              activeId={activeId}
              onMarkerClick={handleMarkerClick}
              onBoundsChange={handleBoundsChange}
              mapboxToken={mapboxToken}
              mapStyle={mapStyle}
              userLocation={userLocation}
              proximityRadius={proximityRadius}
              onMapRef={(ref) => { mapRef.current = ref }}
              className="h-full w-full"
            />
          </motion.div>
        </div>
      </div>

      {/* ── Mobile filter drawer (bottom sheet) ── */}
      <ExploreFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        categories={categories}
        totalResults={items.length}
        onChange={handleFilterChange}
        onReset={handleReset}
        userLocation={userLocation}
        proximityRadius={proximityRadius}
        onRequestLocation={handleRequestLocation}
        onClearLocation={handleClearLocation}
        onProximityChange={handleProximityChange}
        locationLoading={locationLoading}
      />
    </>
  )
}
