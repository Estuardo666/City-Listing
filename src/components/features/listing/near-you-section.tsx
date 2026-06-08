'use client'

import { useCallback, useEffect, useState } from 'react'
import { Locate, Loader2, MapPin } from 'lucide-react'
import { VenueCard } from '@/components/features/venues/venue-card'
import { EventCard } from '@/components/features/events/event-card'
import type { VenueListItem } from '@/types/venue'
import type { EventListItem } from '@/types/event'

type NearYouSectionProps = {
  type: 'venues' | 'events'
  mapboxToken: string
}

type ExploreSearchResult = {
  venues?: VenueListItem[]
  events?: EventListItem[]
}

export function NearYouSection({ type, mapboxToken }: NearYouSectionProps) {
  const [items, setItems] = useState<VenueListItem[] | EventListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [hasLocation, setHasLocation] = useState(false)
  const [requested, setRequested] = useState(false)

  const fetchNearby = useCallback(
    async (lat: number, lng: number) => {
      setLoading(true)
      try {
        const radius = 3000
        const res = await fetch(
          `/api/explore/search?type=${type}&lat=${lat}&lng=${lng}&radius=${radius}&take=6`
        )
        const data: ExploreSearchResult = await res.json()
        setItems(type === 'venues' ? data.venues ?? [] : data.events ?? [])
      } catch {
        // keep empty
      } finally {
        setLoading(false)
      }
    },
    [type]
  )

  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setRequested(true)
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setHasLocation(true)
        setLocationLoading(false)
        fetchNearby(latitude, longitude)
      },
      () => {
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [fetchNearby])

  if (!requested) {
    return (
      <section className="space-y-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Descubre
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground">
            <MapPin className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Cerca de ti
          </h2>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-secondary/20 py-10 text-center">
          <Locate className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Activa tu ubicacion para ver {type === 'venues' ? 'locales' : 'eventos'} cercanos.
          </p>
          <button
            type="button"
            onClick={handleRequestLocation}
            disabled={locationLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Locate className="h-4 w-4" />
            )}
            Usar mi ubicacion
          </button>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="space-y-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Descubre
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground">
            <MapPin className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Cerca de ti
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border/50 p-4">
              <div className="h-44 w-full animate-pulse rounded-xl bg-accent" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-accent" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-accent" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="space-y-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Descubre
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground">
            <MapPin className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Cerca de ti
          </h2>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-secondary/20 py-10 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No se encontraron {type === 'venues' ? 'locales' : 'eventos'} cercanos a tu ubicacion.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        Descubre
      </span>
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">
          <MapPin className="h-5 w-5" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Cerca de ti
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {type === 'venues'
          ? (items as VenueListItem[]).map((v) => <VenueCard key={v.id} venue={v} />)
          : (items as EventListItem[]).map((e) => <EventCard key={e.id} event={e} />)}
      </div>
    </section>
  )
}
