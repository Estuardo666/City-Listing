'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Mountain, User, CalendarDays, Footprints } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RouteStopWithVenue, RouteWithStops } from '@/types/route'

interface RouteDetailProps {
  route: RouteWithStops
}

const TYPE_LABELS: Record<string, string> = {
  gastronomic: 'Gastronómica',
  cultural: 'Cultural',
  adventure: 'Aventura',
  nightlife: 'Vida nocturna',
  nature: 'Naturaleza',
}

/** Days present in the itinerary, honouring `route.days` even if a day is empty. */
function itineraryDays(route: RouteWithStops): number[] {
  const highest = route.stops.reduce((max, stop) => Math.max(max, stop.day), 1)
  const total = Math.max(route.days, highest, 1)
  return Array.from({ length: total }, (_, index) => index + 1)
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export function RouteDetail({ route }: RouteDetailProps) {
  const days = itineraryDays(route)
  const [selectedDay, setSelectedDay] = useState(days[0] ?? 1)
  const isMultiDay = days.length > 1
  // Single-day itineraries show every stop, so the old routes keep rendering
  // exactly as they did before days existed.
  const visibleStops: RouteStopWithVenue[] = isMultiDay
    ? route.stops.filter((stop) => stop.day === selectedDay)
    : [...route.stops]
  const sortedStops = visibleStops.sort((a, b) => a.day - b.day || a.order - b.order)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>{TYPE_LABELS[route.type] ?? route.type}</Badge>
          {route.difficulty && (
            <Badge variant="outline">{route.difficulty}</Badge>
          )}
        </div>
        <h1 className="text-2xl font-medium">{route.title}</h1>
        <p className="text-muted-foreground mt-2">{route.description}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-4 w-4" />
          {route.user.name ?? 'Anónimo'}
        </span>
        {route.duration && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {route.duration}
          </span>
        )}
        {isMultiDay && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {days.length} días
          </span>
        )}
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {route.stops.length} paradas
        </span>
        {route.distanceMeters ? (
          <span className="flex items-center gap-1">
            <Footprints className="h-4 w-4" />
            {formatDistance(route.distanceMeters)}
          </span>
        ) : null}
        {route.estimatedMinutes ? (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatMinutes(route.estimatedMinutes)}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <Mountain className="h-4 w-4" />
          {route._count.favorites} favoritos
        </span>
      </div>

      {/* Content */}
      {route.content && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p>{route.content}</p>
        </div>
      )}

      {/* Stops */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {isMultiDay ? 'Itinerario' : 'Paradas de la ruta'}
        </h2>

        {isMultiDay && (
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Días del itinerario">
            {days.map((day) => (
              <Button
                key={day}
                role="tab"
                aria-selected={day === selectedDay}
                variant={day === selectedDay ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay(day)}
              >
                Día {day}
              </Button>
            ))}
          </div>
        )}

        {sortedStops.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground">
            Este día aún no tiene paradas.
          </p>
        )}
        <div className="space-y-4">
          {sortedStops.map((stop, index) => (
            <div key={stop.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                {index < sortedStops.length - 1 && (
                  <div className="w-0.5 flex-1 bg-muted mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                {stop.venue ? (
                  <Link
                    href={`/locales/${stop.venue.slug}`}
                    className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {stop.venue.image && (
                        <img
                          src={stop.venue.image}
                          alt={stop.venue.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm">{stop.venue.name}</p>
                        <p className="text-xs text-muted-foreground">{stop.venue.location}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm">{stop.title}</p>
                  </div>
                )}
                {stop.notes && (
                  <p className="text-xs text-muted-foreground mt-1 ml-3">{stop.notes}</p>
                )}
                {(stop.startTime || stop.duration) && (
                  <p className="text-xs text-muted-foreground mt-0.5 ml-3 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {[stop.startTime, stop.duration].filter(Boolean).join(' · ')}
                  </p>
                )}
                {stop.travelMinutes ? (
                  <p className="text-xs text-muted-foreground mt-0.5 ml-3">
                    {formatMinutes(stop.travelMinutes)} desde la parada anterior
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
