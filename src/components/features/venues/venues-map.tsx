'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMapThemeStyle } from '@/components/theme/use-map-theme-style'
import { cn } from '@/lib/utils'
import type { VenueMapItem } from '@/types/venue'

type VenuesMapProps = {
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

function hasCoordinates(venue: VenueMapItem): venue is VenueMapItem & { lat: number; lng: number } {
  return venue.lat !== null && venue.lng !== null
}

export function VenuesMap({ venues, mapboxToken, mapStyle, className }: VenuesMapProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const themedMapStyle = useMapThemeStyle(mapStyle)

  const points = useMemo(() => venues.filter(hasCoordinates), [venues])

  const initialViewState = useMemo(() => {
    if (points.length === 0) {
      return defaultCenter
    }

    const latitude = points.reduce((sum, venue) => sum + venue.lat, 0) / points.length
    const longitude = points.reduce((sum, venue) => sum + venue.lng, 0) / points.length

    return {
      latitude,
      longitude,
      zoom: 12,
    }
  }, [points])

  const selectedVenue = useMemo(
    () => points.find((venue) => venue.id === selectedVenueId) ?? null,
    [points, selectedVenueId]
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

          {points.map((venue) => (
            <Marker key={venue.id} longitude={venue.lng} latitude={venue.lat} anchor="bottom">
              <button
                type="button"
                onClick={() => setSelectedVenueId(venue.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/35 bg-white text-primary shadow"
                aria-label={`Ver ${venue.name}`}
              >
                <MapPin className="h-4 w-4" />
              </button>
            </Marker>
          ))}

          {selectedVenue ? (
            <Popup
              anchor="top"
              longitude={selectedVenue.lng}
              latitude={selectedVenue.lat}
              onClose={() => setSelectedVenueId(null)}
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

      <p className="text-xs text-muted-foreground">
        {points.length} {points.length === 1 ? 'local con coordenadas' : 'locales con coordenadas'} en el mapa.
      </p>
    </div>
  )
}
