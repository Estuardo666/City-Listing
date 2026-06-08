'use client'

import { useCallback, useRef, useState } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl'
import type { MapRef, MapMouseEvent } from 'react-map-gl'
import { motion } from 'framer-motion'
import { MapPin, LocateFixed, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type LocationPickerMapProps = {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  onClear?: () => void
  mapboxToken: string
  mapStyle?: string
  className?: string
}

const DEFAULT_CENTER = { latitude: -3.99313, longitude: -79.20422, zoom: 13 }

export function LocationPickerMap({
  lat,
  lng,
  onChange,
  onClear,
  mapboxToken,
  mapStyle,
  className,
}: LocationPickerMapProps) {
  const mapRef = useRef<MapRef | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const hasPin = lat !== null && lng !== null

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      onChange(e.lngLat.lat, e.lngLat.lng)
    },
    [onChange]
  )

  const handleRecenter = useCallback(() => {
    if (!hasPin) return
    mapRef.current?.flyTo({
      center: [lng!, lat!],
      zoom: 15,
      duration: 600,
    })
  }, [hasPin, lat, lng])

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border/60', className)}>
      {/* Instruction banner */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between gap-2 bg-card/90 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          {hasPin
            ? `${lat!.toFixed(6)}, ${lng!.toFixed(6)}`
            : 'Haz clic en el mapa para fijar la ubicación'}
        </div>
        <div className="flex items-center gap-1">
          {hasPin && (
            <>
              <motion.button
                type="button"
                onClick={handleRecenter}
                whileTap={{ scale: 0.9 }}
                title="Centrar en el pin"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LocateFixed className="h-3.5 w-3.5" />
              </motion.button>
              {onClear && (
                <motion.button
                  type="button"
                  onClick={onClear}
                  whileTap={{ scale: 0.9 }}
                  title="Quitar ubicación"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        mapStyle={mapStyle ?? 'mapbox://styles/mapbox/light-v11'}
        initialViewState={
          hasPin
            ? { latitude: lat!, longitude: lng!, zoom: 15 }
            : DEFAULT_CENTER
        }
        reuseMaps
        style={{ width: '100%', height: '100%' }}
        cursor={isDragging ? 'grabbing' : 'crosshair'}
        onClick={handleMapClick}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {hasPin && (
          <Marker
            longitude={lng!}
            latitude={lat!}
            anchor="bottom"
            draggable
            onDragEnd={(e) => {
              onChange(e.lngLat.lat, e.lngLat.lng)
            }}
          >
            <motion.div
              initial={{ scale: 0.4, y: -12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="flex flex-col items-center"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-primary text-white shadow-lg">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="h-2 w-0.5 bg-primary/60" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            </motion.div>
          </Marker>
        )}
      </Map>
    </div>
  )
}
