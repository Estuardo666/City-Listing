'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl'
import { CalendarDays, MapPin, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import type { EventMapItem } from '@/types/event'
import type { VenueMapItem } from '@/types/venue'

type EventsVenuesMapProps = {
  events: EventMapItem[]
  venues: VenueMapItem[]
  mapboxToken: string
  mapStyle?: string
  className?: string
}

const defaultCenter = {
  latitude: -3.99313,
  longitude: -79.20422,
  zoom: 12,
}

function hasEventCoordinates(event: EventMapItem): event is EventMapItem & { lat: number; lng: number } {
  return event.lat !== null && event.lng !== null
}

function hasVenueCoordinates(venue: VenueMapItem): venue is VenueMapItem & { lat: number; lng: number } {
  return venue.lat !== null && venue.lng !== null
}

export function EventsVenuesMap({ events, venues, mapboxToken, mapStyle, className }: EventsVenuesMapProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'event' | 'venue' | null>(null)

  const eventPoints = useMemo(() => events.filter(hasEventCoordinates), [events])
  const venuePoints = useMemo(() => venues.filter(hasVenueCoordinates), [venues])

  const allPoints = useMemo(() => [...eventPoints, ...venuePoints], [eventPoints, venuePoints])

  const initialViewState = useMemo(() => {
    if (allPoints.length === 0) {
      return defaultCenter
    }

    const latitude = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length
    const longitude = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length

    return {
      latitude,
      longitude,
      zoom: 12,
    }
  }, [allPoints])

  const selectedEvent = useMemo(
    () => eventPoints.find((event) => event.id === selectedItemId && selectedType === 'event') ?? null,
    [eventPoints, selectedItemId, selectedType]
  )

  const selectedVenue = useMemo(
    () => venuePoints.find((venue) => venue.id === selectedItemId && selectedType === 'venue') ?? null,
    [venuePoints, selectedItemId, selectedType]
  )

  if (!mapboxToken) {
    return (
      <div className={cn('rounded-2xl border border-dashed border-border/80 bg-card/70 p-4 text-sm text-muted-foreground', className)}>
        Configura MAPBOX_ACCESS_TOKEN o NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN para activar el mapa interactivo.
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative h-[360px] overflow-hidden rounded-2xl border border-border/70">
        <Map
          mapboxAccessToken={mapboxToken}
          mapStyle={mapStyle ?? 'mapbox://styles/mapbox/light-v11'}
          initialViewState={initialViewState}
          reuseMaps
        >
          <NavigationControl position="top-right" />

          {eventPoints.map((event) => (
            <Marker key={`event-${event.id}`} longitude={event.lng} latitude={event.lat} anchor="bottom">
              <button
                type="button"
                onClick={() => {
                  setSelectedItemId(event.id)
                  setSelectedType('event')
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/35 bg-white text-blue-500 shadow"
                aria-label={`Ver evento ${event.title}`}
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </Marker>
          ))}

          {venuePoints.map((venue) => (
            <Marker key={`venue-${venue.id}`} longitude={venue.lng} latitude={venue.lat} anchor="bottom">
              <button
                type="button"
                onClick={() => {
                  setSelectedItemId(venue.id)
                  setSelectedType('venue')
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-green-500/35 bg-white text-green-500 shadow"
                aria-label={`Ver local ${venue.name}`}
              >
                <Building className="h-4 w-4" />
              </button>
            </Marker>
          ))}

          {selectedEvent ? (
            <Popup
              anchor="top"
              longitude={selectedEvent.lng}
              latitude={selectedEvent.lat}
              onClose={() => {
                setSelectedItemId(null)
                setSelectedType(null)
              }}
              closeButton
              closeOnClick={false}
              maxWidth="280px"
            >
              <div className="space-y-2 p-1">
                <p className="text-sm font-semibold text-foreground">{selectedEvent.title}</p>
                <p className="text-xs text-muted-foreground">{selectedEvent.category.name}</p>
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTime(selectedEvent.startDate)}
                </p>
                <p className="text-xs text-muted-foreground">{selectedEvent.address ?? selectedEvent.location}</p>
                <Button asChild className="h-8 px-3 text-xs">
                  <Link href={`/eventos/${selectedEvent.slug}`}>Ver evento</Link>
                </Button>
              </div>
            </Popup>
          ) : null}

          {selectedVenue ? (
            <Popup
              anchor="top"
              longitude={selectedVenue.lng}
              latitude={selectedVenue.lat}
              onClose={() => {
                setSelectedItemId(null)
                setSelectedType(null)
              }}
              closeButton
              closeOnClick={false}
              maxWidth="280px"
            >
              <div className="space-y-2 p-1">
                <p className="text-sm font-semibold text-foreground">{selectedVenue.name}</p>
                <p className="text-xs text-muted-foreground">{selectedVenue.category.name}</p>
                <p className="text-xs text-muted-foreground">{selectedVenue.address ?? selectedVenue.location}</p>
                <Button asChild className="h-8 px-3 text-xs">
                  <Link href={`/locales/${selectedVenue.slug}`}>Ver local</Link>
                </Button>
              </div>
            </Popup>
          ) : null}
        </Map>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{eventPoints.length} {eventPoints.length === 1 ? 'evento' : 'eventos'} con coordenadas</span>
          <span>{venuePoints.length} {venuePoints.length === 1 ? 'local' : 'locales'} con coordenadas</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full border border-blue-500/35 bg-blue-500" />
            <span>Eventos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full border border-green-500/35 bg-green-500" />
            <span>Locales</span>
          </div>
        </div>
      </div>
    </div>
  )
}
