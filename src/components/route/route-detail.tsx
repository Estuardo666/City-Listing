'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { trackDirections } from '@/lib/track-directions'
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Footprints,
  MapPin,
  Mountain,
  Route as RouteIcon,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RouteMap, type RouteMapPoint } from '@/components/route/route-map'
import type { RouteStopWithVenue, RouteWithStops } from '@/types/route'

interface RouteDetailProps {
  route: RouteWithStops
  mapboxToken?: string
  mapStyle?: string
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

function stopCoordinates(stop: RouteStopWithVenue) {
  const lat = stop.lat ?? stop.venue?.lat
  const lng = stop.lng ?? stop.venue?.lng
  return lat != null && lng != null ? { lat, lng } : null
}

export function RouteDetail({ route, mapboxToken = '', mapStyle }: RouteDetailProps) {
  const days = itineraryDays(route)
  const [selectedDay, setSelectedDay] = useState(days[0] ?? 1)
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const isMultiDay = days.length > 1

  const sortedStops = useMemo(() => {
    const stops = isMultiDay ? route.stops.filter((stop) => stop.day === selectedDay) : route.stops
    return [...stops].sort((a, b) => a.day - b.day || a.order - b.order)
  }, [isMultiDay, route.stops, selectedDay])

  const mapPoints = useMemo<RouteMapPoint[]>(
    () =>
      sortedStops.flatMap((stop) => {
        const coordinates = stopCoordinates(stop)
        if (!coordinates) return []

        return [
          {
            id: stop.id,
            title: stop.venue?.name ?? stop.title,
            order: stop.order,
            lat: coordinates.lat,
            lng: coordinates.lng,
            slug: stop.venue?.slug,
            location: stop.venue?.location,
          },
        ]
      }),
    [sortedStops]
  )
  const selectedStopIsMappable = selectedStopId != null && mapPoints.some((point) => point.id === selectedStopId)
  const activeStopId = selectedStopIsMappable ? selectedStopId : mapPoints[0]?.id ?? sortedStops[0]?.id ?? null
  const activeMapPointId = mapPoints.some((point) => point.id === activeStopId) ? activeStopId : mapPoints[0]?.id ?? null

  return (
    <div className="space-y-8">
      {route.image && (
        <div className="group relative aspect-[16/7] overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted shadow-sm">
          <img
            src={route.image}
            alt={route.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Una taza a la vez
          </div>
        </div>
      )}

      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{TYPE_LABELS[route.type] ?? route.type}</Badge>
          {route.difficulty ? <Badge variant="outline">{route.difficulty}</Badge> : null}
        </div>

        <div className="max-w-4xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{route.title}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{route.description}</p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground" aria-label="Resumen de la ruta">
          <span className="inline-flex items-center gap-2">
            <User className="h-4 w-4" aria-hidden="true" />
            {route.user.name ?? 'Anónimo'}
          </span>
          {route.duration ? (
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {route.duration}
            </span>
          ) : null}
          {isMultiDay ? (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {days.length} días
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {route.stops.length} paradas
          </span>
          {route.distanceMeters ? (
            <span className="inline-flex items-center gap-2">
              <Footprints className="h-4 w-4" aria-hidden="true" />
              {formatDistance(route.distanceMeters)}
            </span>
          ) : null}
          {route.estimatedMinutes ? (
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {formatMinutes(route.estimatedMinutes)} de recorrido
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <Mountain className="h-4 w-4" aria-hidden="true" />
            {route._count.favorites} favoritos
          </span>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(360px,1.14fr)]">
        <aside className="space-y-4 lg:order-2 lg:sticky lg:top-24">
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-3 shadow-sm sm:p-4">
            <div className="mb-3 flex items-start justify-between gap-4 px-1 sm:px-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Orientación</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Síguela parada a parada</h2>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {mapPoints.length}/{sortedStops.length} ubicadas
              </span>
            </div>

            <RouteMap
              points={mapPoints}
              mapboxToken={mapboxToken}
              mapStyle={mapStyle}
              selectedPointId={activeMapPointId}
              onSelectPoint={setSelectedStopId}
            />

            <p className="px-1 pt-3 text-xs leading-5 text-muted-foreground sm:px-2">
              La línea conecta las paradas en el orden recomendado. Toca un número para centrar el mapa.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Tip de ruta:</span> confirma horarios y disponibilidad antes de salir.
          </div>
        </aside>

        <div className="min-w-0 space-y-8 lg:order-1">
          {route.content ? (
            <section className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6" aria-labelledby="route-story-title">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">El plan</p>
              <h2 id="route-story-title" className="mt-2 text-xl font-semibold tracking-tight text-foreground">Una ruta para saborear Loja</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{route.content}</p>
            </section>
          ) : null}

          <section aria-labelledby="route-stops-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Tu recorrido</p>
                <h2 id="route-stops-title" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {isMultiDay ? 'Itinerario' : 'Paradas de la ruta'}
                </h2>
              </div>
              <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                {sortedStops.length} {sortedStops.length === 1 ? 'parada' : 'paradas'} en esta vista
              </span>
            </div>

            {isMultiDay ? (
              <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Días del itinerario">
                {days.map((day) => (
                  <Button
                    key={day}
                    role="tab"
                    aria-selected={day === selectedDay}
                    variant={day === selectedDay ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedDay(day)
                      setSelectedStopId(null)
                    }}
                  >
                    Día {day}
                  </Button>
                ))}
              </div>
            ) : null}

            {sortedStops.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                Este día aún no tiene paradas.
              </p>
            ) : (
              <div className="mt-5 space-y-1">
                {sortedStops.map((stop, index) => {
                  const coordinates = stopCoordinates(stop)
                  const isSelected = stop.id === activeStopId
                  const stopName = stop.venue?.name ?? stop.title

                  return (
                    <div key={stop.id} className="flex gap-3 sm:gap-4">
                      <div className="flex w-9 shrink-0 flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (coordinates) setSelectedStopId(stop.id)
                          }}
                          disabled={!coordinates}
                          className={cn(
                            'relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed motion-reduce:transition-none',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : coordinates
                                ? 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
                                : 'border-border/60 bg-muted/40 text-muted-foreground'
                          )}
                          aria-label={coordinates ? `Seleccionar parada ${index + 1}: ${stopName}` : `Parada ${index + 1}: ${stopName}, ubicación pendiente`}
                          aria-pressed={isSelected}
                        >
                          {index + 1}
                        </button>
                        {index < sortedStops.length - 1 ? <div className="w-px flex-1 bg-border/80" /> : null}
                      </div>

                      <div className="min-w-0 flex-1 pb-5">
                        {stop.venue ? (
                          <Link
                            href={`/locales/${stop.venue.slug}`}
                            onFocus={() => setSelectedStopId(stop.id)}
                            aria-current={isSelected ? 'step' : undefined}
                            className={cn(
                              'group block rounded-2xl border p-3 transition-[border-color,background-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none sm:p-4',
                              isSelected
                                ? 'border-primary/55 bg-primary/[0.04] shadow-sm'
                                : 'border-border/70 bg-card hover:border-primary/35 hover:bg-muted/30'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {stop.venue.image ? (
                                <img src={stop.venue.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16" />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:h-16 sm:w-16">
                                  <MapPin className="h-5 w-5" aria-hidden="true" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="font-semibold text-foreground">{stopName}</p>
                                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                                </div>
                                <p className="mt-1 truncate text-xs text-muted-foreground">{stop.venue.location ?? 'Loja, Ecuador'}</p>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className="rounded-2xl border border-border/70 bg-card p-4">
                            <p className="font-semibold text-foreground">{stopName}</p>
                          </div>
                        )}

                        <div className="px-1 pt-2">
                          {stop.notes ? <p className="text-sm leading-6 text-muted-foreground">{stop.notes}</p> : null}
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            {stop.startTime || stop.duration ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                {[stop.startTime, stop.duration].filter(Boolean).join(' · ')}
                              </span>
                            ) : null}
                            {stop.travelMinutes ? <span>{formatMinutes(stop.travelMinutes)} desde la parada anterior</span> : null}
                            {coordinates ? (
                              <button
                                type="button"
                                onClick={() => setSelectedStopId(stop.id)}
                                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              >
                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                Ver en mapa
                              </button>
                            ) : (
                              <span className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground/80">
                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                Ubicación pendiente
                              </span>
                            )}
                            {coordinates ? (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=walking`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center rounded-lg font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                onClick={() => trackDirections('route', route.id)}
                              >
                                Cómo llegar
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
