'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl'
import { LocateFixed, MapPin, Route as RouteIcon } from 'lucide-react'
import { useMapThemeStyle } from '@/components/theme/use-map-theme-style'
import { useMapboxWorkerSetup } from '@/components/features/map/mapbox-worker-setup'
import { cn } from '@/lib/utils'

export type RouteMapPoint = {
  id: string
  title: string
  order: number
  lat: number
  lng: number
  slug?: string | null
  location?: string | null
}

type RouteMapProps = {
  points: RouteMapPoint[]
  mapboxToken: string
  mapStyle?: string
  selectedPointId?: string | null
  onSelectPoint?: (pointId: string) => void
}

const LOJA_CENTER = { latitude: -3.99313, longitude: -79.20422, zoom: 13 }

function getMapMotionDuration(): number {
  if (typeof window === 'undefined') return 0
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500
}

export function RouteMap({
  points,
  mapboxToken,
  mapStyle,
  selectedPointId,
  onSelectPoint,
}: RouteMapProps) {
  useMapboxWorkerSetup()
  const mapRef = useRef<MapRef>(null)
  const lastSelectedPointIdRef = useRef<string | undefined>(undefined)
  const [mapReady, setMapReady] = useState(false)
  const themedMapStyle = useMapThemeStyle(mapStyle)
  const validPoints = useMemo(() => points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)), [points])
  const selectedPoint = validPoints.find((point) => point.id === selectedPointId) ?? validPoints[0] ?? null

  const initialViewState = useMemo(() => {
    if (validPoints.length === 0) return LOJA_CENTER

    return {
      latitude: validPoints.reduce((sum, point) => sum + point.lat, 0) / validPoints.length,
      longitude: validPoints.reduce((sum, point) => sum + point.lng, 0) / validPoints.length,
      zoom: 13,
    }
  }, [validPoints])

  const routeGeoJson = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: validPoints.map((point) => [point.lng, point.lat]),
      },
    }),
    [validPoints]
  )

  const fitRoute = useCallback(() => {
    if (!mapRef.current || validPoints.length === 0) return

    if (validPoints.length === 1) {
      mapRef.current.flyTo({
        center: [validPoints[0].lng, validPoints[0].lat],
        zoom: 15,
        duration: getMapMotionDuration(),
      })
      return
    }

    const lngs = validPoints.map((point) => point.lng)
    const lats = validPoints.map((point) => point.lat)
    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: { top: 64, right: 64, bottom: 64, left: 64 }, duration: getMapMotionDuration() }
    )
  }, [validPoints])

  useEffect(() => {
    if (mapReady) fitRoute()
  }, [fitRoute, mapReady])

  useEffect(() => {
    if (!mapReady || !selectedPoint) return
    if (lastSelectedPointIdRef.current === undefined) {
      lastSelectedPointIdRef.current = selectedPoint.id
      return
    }
    if (lastSelectedPointIdRef.current === selectedPoint.id) return

    lastSelectedPointIdRef.current = selectedPoint.id
    mapRef.current?.flyTo({
      center: [selectedPoint.lng, selectedPoint.lat],
      zoom: Math.max(mapRef.current.getZoom(), 14),
      duration: getMapMotionDuration(),
    })
  }, [mapReady, selectedPoint])

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/70 p-6 text-center">
        <MapPin className="mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="max-w-sm text-sm font-medium text-foreground">El mapa de la ruta estará disponible pronto.</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">Mientras tanto, puedes seguir las paradas en orden desde la lista.</p>
      </div>
    )
  }

  if (validPoints.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/70 p-6 text-center">
        <RouteIcon className="mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="max-w-sm text-sm font-medium text-foreground">Esta ruta todavía no tiene ubicaciones en el mapa.</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">Las paradas seguirán disponibles en el itinerario.</p>
      </div>
    )
  }

  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-sm sm:h-[430px]">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        mapStyle={themedMapStyle}
        initialViewState={initialViewState}
        onLoad={() => setMapReady(true)}
        reuseMaps
        attributionControl
      >
        <NavigationControl position="top-right" showCompass={false} />

        {validPoints.length > 1 ? (
          <Source id="route-line" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-line-shadow"
              type="line"
              paint={{
                'line-color': '#0f172a',
                'line-width': 9,
                'line-opacity': 0.22,
                'line-blur': 1.5,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id="route-line-main"
              type="line"
              paint={{
                'line-color': '#2563eb',
                'line-width': 4,
                'line-opacity': 0.95,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </Source>
        ) : null}

        {validPoints.map((point) => {
          const isSelected = point.id === selectedPoint?.id
          return (
            <Marker key={point.id} longitude={point.lng} latitude={point.lat} anchor="center">
              <button
                type="button"
                onClick={() => onSelectPoint?.(point.id)}
                className={cn(
                  'inline-flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  isSelected
                    ? 'scale-110 border-white bg-primary text-primary-foreground'
                    : 'border-white bg-background text-primary hover:scale-105'
                )}
                aria-label={`Ver parada ${point.order}: ${point.title}`}
                aria-pressed={isSelected}
                title={point.title}
              >
                {point.order}
              </button>
            </Marker>
          )
        })}
      </Map>

      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3 sm:inset-x-4 sm:top-4">
        <div className="rounded-xl border border-white/30 bg-slate-950/75 px-3 py-2 text-white shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
            <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Ruta en el mapa
          </div>
          <p className="mt-0.5 text-sm font-medium">{validPoints.length} paradas conectadas</p>
        </div>
        <button
          type="button"
          onClick={fitRoute}
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-slate-950/75 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Ver toda la ruta"
          title="Ver toda la ruta"
        >
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {selectedPoint ? (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-white/35 bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur-md sm:inset-x-4 sm:bottom-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Parada {selectedPoint.order}
            </p>
            <p className="truncate text-sm font-semibold text-foreground">{selectedPoint.title}</p>
          </div>
          {selectedPoint.slug ? (
            <Link
              href={`/locales/${selectedPoint.slug}`}
              className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Ver local
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
