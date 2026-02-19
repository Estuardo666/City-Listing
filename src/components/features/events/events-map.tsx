'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl'
import { CalendarDays, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMapThemeStyle } from '@/components/theme/use-map-theme-style'
import { cn, formatDateTime } from '@/lib/utils'
import type { EventMapItem } from '@/types/event'

type EventsMapProps = {
  events: EventMapItem[]
  mapboxToken: string
  mapStyle?: string
  className?: string
}

const defaultCenter = {
  latitude: -3.99313,
  longitude: -79.20422,
  zoom: 12,
}

function hasCoordinates(event: EventMapItem): event is EventMapItem & { lat: number; lng: number } {
  return event.lat !== null && event.lng !== null
}

export function EventsMap({ events, mapboxToken, mapStyle, className }: EventsMapProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const themedMapStyle = useMapThemeStyle(mapStyle)

  const points = useMemo(() => events.filter(hasCoordinates), [events])

  const initialViewState = useMemo(() => {
    if (points.length === 0) {
      return defaultCenter
    }

    const latitude = points.reduce((sum, event) => sum + event.lat, 0) / points.length
    const longitude = points.reduce((sum, event) => sum + event.lng, 0) / points.length

    return {
      latitude,
      longitude,
      zoom: 12,
    }
  }, [points])

  const selectedEvent = useMemo(
    () => points.find((event) => event.id === selectedEventId) ?? null,
    [points, selectedEventId]
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
          mapStyle={themedMapStyle}
          initialViewState={initialViewState}
          reuseMaps
        >
          <NavigationControl position="top-right" />

          {points.map((event) => (
            <Marker key={event.id} longitude={event.lng} latitude={event.lat} anchor="bottom">
              <button
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/35 bg-white text-primary shadow"
                aria-label={`Ver ${event.title}`}
              >
                <MapPin className="h-4 w-4" />
              </button>
            </Marker>
          ))}

          {selectedEvent ? (
            <Popup
              anchor="top"
              longitude={selectedEvent.lng}
              latitude={selectedEvent.lat}
              onClose={() => setSelectedEventId(null)}
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
        </Map>
      </div>

      <p className="text-xs text-muted-foreground">
        {points.length} {points.length === 1 ? 'evento con coordenadas' : 'eventos con coordenadas'} en el mapa.
      </p>
    </div>
  )
}
