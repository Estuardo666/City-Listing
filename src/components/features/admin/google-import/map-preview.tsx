'use client'

import { useEffect, useRef } from 'react'

interface MapPreviewProps {
  lat: number
  lng: number
  radius?: number
  className?: string
}

export function MapPreview({ lat, lng, radius = 5000, className = '' }: MapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      const mapboxgl = await import('mapbox-gl')
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!token || cancelled || !mapContainerRef.current) return

      mapboxgl.default.accessToken = token

      if (mapRef.current) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: getZoomForRadius(radius) })

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat])
        }

        updateCircle(mapRef.current, lat, lng, radius)
        return
      }

      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: getZoomForRadius(radius),
        interactive: true,
      })

      map.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

      map.on('load', () => {
        if (cancelled) return
        mapRef.current = map

        const marker = new mapboxgl.default.Marker({ color: '#6366f1' })
          .setLngLat([lng, lat])
          .addTo(map)
        markerRef.current = marker

        updateCircle(map, lat, lng, radius)
      })
    }

    initMap()

    return () => {
      cancelled = true
    }
  }, [lat, lng, radius])

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-[250px] rounded-lg border ${className}`}
      style={{ minHeight: 250 }}
    />
  )
}

function getZoomForRadius(radiusMeters: number): number {
  if (radiusMeters <= 1000) return 14
  if (radiusMeters <= 5000) return 12
  if (radiusMeters <= 10000) return 11
  if (radiusMeters <= 20000) return 10
  return 9
}

function updateCircle(map: any, lat: number, lng: number, radius: number) {
  const sourceId = 'radius-circle'
  const fillLayerId = 'radius-circle-fill'
  const lineLayerId = 'radius-circle-line'

  const points = 64
  const coords: [number, number][] = []
  const earthRadius = 6371000
  const d = radius / earthRadius

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points
    const latRad = (lat * Math.PI) / 180
    const lngRad = (lng * Math.PI) / 180
    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(angle)
    )
    const newLng =
      lngRad +
      Math.atan2(
        Math.sin(angle) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(newLat)
      )
    coords.push([(newLng * 180) / Math.PI, (newLat * 180) / Math.PI])
  }

  const geojson = {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(geojson)
  } else {
    map.addSource(sourceId, { type: 'geojson', data: geojson })
    map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: { 'fill-color': '#6366f1', 'fill-opacity': 0.1 },
    })
    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      paint: { 'line-color': '#6366f1', 'line-width': 2, 'line-dasharray': [4, 2] },
    })
  }
}
