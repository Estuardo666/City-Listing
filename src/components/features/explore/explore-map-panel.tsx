'use client'

import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl'
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, CheckSquare, MapPin, Square, X } from 'lucide-react'
import { useMapThemeStyle } from '@/components/theme/use-map-theme-style'
import { cn } from '@/lib/utils'
import type { ExploreMapMarker, ExploreItem, MapBounds, UserLocation } from '@/types/explore'

type ExploreMapPanelProps = {
  markers: ExploreMapMarker[]
  items: ExploreItem[]
  activeId: string | null
  onMarkerClick: (id: string) => void
  onBoundsChange: (bounds: MapBounds | null) => void
  onZoomChange?: (zoom: number) => void
  markerRenderMode?: 'dom' | 'canvas'
  mapboxToken: string
  mapStyle?: string
  userLocation?: UserLocation | null
  proximityRadius?: number | null
  onMapRef?: (ref: { flyTo: (opts: { center: [number, number]; zoom: number; duration: number }) => void } | null) => void
  showSearchOnMoveToggle?: boolean
  className?: string
}

const DEFAULT_CENTER = { latitude: -3.99313, longitude: -79.20422, zoom: 13 }
const CANVAS_CLUSTER_LAYER_ID = 'canvas-clusters'
const CANVAS_CLUSTER_COUNT_LAYER_ID = 'canvas-cluster-count'
const CANVAS_UNCLUSTERED_LAYER_ID = 'canvas-unclustered-points'
const CANVAS_UNCLUSTERED_ICON_LAYER_ID = 'canvas-unclustered-icons'
const EMOJI_IMAGE_IDS = [
  'venue-restaurant',
  'venue-hotel',
  'venue-cafe',
  'venue-bar',
  'venue-health',
  'venue-shop',
  'venue-default',
  'event-music',
  'event-sports',
  'event-art',
  'event-default',
] as const
const emojiMissingListenerAttached = new WeakSet<object>()

function normalizeCategory(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function getCategoryKey(category: string, type: 'venue' | 'event') {
  const c = normalizeCategory(category)
  if (type === 'event') {
    if (c.includes('musica') || c.includes('concierto')) return 'event-music'
    if (c.includes('deporte') || c.includes('futbol') || c.includes('gym')) return 'event-sports'
    if (c.includes('arte') || c.includes('cultura') || c.includes('teatro')) return 'event-art'
    return 'event-default'
  }

  if (c.includes('rest') || c.includes('comida')) return 'venue-restaurant'
  if (c.includes('hotel') || c.includes('hostal')) return 'venue-hotel'
  if (c.includes('cafe') || c.includes('coffee')) return 'venue-cafe'
  if (c.includes('bar') || c.includes('pub') || c.includes('night')) return 'venue-bar'
  if (c.includes('farmacia') || c.includes('clinica') || c.includes('salud')) return 'venue-health'
  if (c.includes('shop') || c.includes('tienda') || c.includes('market')) return 'venue-shop'
  return 'venue-default'
}

// Generate emoji image for Mapbox synchronously (required for styleimagemissing flow)
function createEmojiImage(emoji: string, size: number = 64): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return new ImageData(size, size)

  ctx.clearRect(0, 0, size, size)
  ctx.font = `${size * 0.82}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2)

  return ctx.getImageData(0, 0, size, size)
}

function getCategoryEmoji(categoryKey: string): string {
  const emojiMap: Record<string, string> = {
    'venue-restaurant': '🍽️',
    'venue-hotel': '🛏️',
    'venue-cafe': '☕',
    'venue-bar': '🍻',
    'venue-health': '🏥',
    'venue-shop': '🛍️',
    'venue-default': '📍',
    'event-music': '🎵',
    'event-sports': '⚽',
    'event-art': '🎨',
    'event-default': '🎫',
  }
  return emojiMap[categoryKey] ?? '📍'
}

// ── Cluster helpers ────────────────────────────────────────────────────────────

type MarkerGroup = {
  key: string
  lat: number
  lng: number
  markers: ExploreMapMarker[]
}

function groupByPosition(markers: ExploreMapMarker[]): MarkerGroup[] {
  const acc: Record<string, ExploreMapMarker[]> = {}
  for (const m of markers) {
    const key = `${m.lat.toFixed(5)},${m.lng.toFixed(5)}`
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
  }
  return Object.entries(acc).map(([key, ms]) => ({
    key,
    lat: ms[0].lat,
    lng: ms[0].lng,
    markers: ms,
  }))
}

// Distribute N items in a circle around a center point
// radius in degrees: ~40px at zoom 14 (1px ≈ 0.000005° at z14)
function circleOffsets(
  count: number,
  zoom: number
): Array<{ dlat: number; dlng: number }> {
  // Tight spiderfy: pins very close to cluster center
  const pixelRadius = count <= 3 ? 18 : count <= 6 ? 22 : 26
  const degPerPixel = 360 / (256 * Math.pow(2, zoom))
  const r = pixelRadius * degPerPixel
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    // lat = north/south = cos, lng = east/west = sin
    return { dlat: r * Math.cos(angle), dlng: r * Math.sin(angle) }
  })
}

// ── Pin button ─────────────────────────────────────────────────────────────────

type PinButtonProps = {
  marker: ExploreMapMarker
  isActive: boolean
  delay: number
  renderLat: number
  renderLng: number
  onClickPin: (id: string, lat: number, lng: number) => void
}

const PinButton = memo(function PinButton({ marker, isActive, delay, renderLat, renderLng, onClickPin }: PinButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClickPin(marker.id, renderLat, renderLng)
      }}
      initial={{ opacity: 0, scale: 0.3, y: -8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: isActive ? 1.28 : 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.2, y: -6, filter: 'blur(3px)' }}
      whileHover={{ scale: isActive ? 1.28 : 1.18, y: -2 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        opacity: { duration: 0.12, delay },
        filter:  { duration: 0.15, delay },
        y:       { type: 'spring', stiffness: 520, damping: 28, delay },
        scale:   { type: 'spring', stiffness: 520, damping: 28, delay },
      }}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm shadow-md transition-colors',
        marker.type === 'venue'
          ? isActive
            ? 'border-emerald bg-emerald text-white'
            : 'border-emerald/60 bg-white text-emerald hover:bg-emerald hover:text-white'
          : isActive
            ? 'border-coral bg-coral text-white'
            : 'border-coral/60 bg-white text-coral hover:bg-coral hover:text-white'
      )}
      aria-label={marker.name}
    >
      <span className="text-base leading-none">
        {marker.categoryIcon ?? (marker.type === 'venue' ? '🏬' : '📍')}
      </span>

      <AnimatePresence>
        {isActive && (
          <motion.span
            key="ring"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className={cn(
              'pointer-events-none absolute inset-0 rounded-full ring-4',
              marker.type === 'venue' ? 'ring-emerald/35' : 'ring-coral/35'
            )}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && (
          <motion.span
            key="pulse"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'pointer-events-none absolute inset-0 rounded-full',
              marker.type === 'venue' ? 'bg-emerald/20' : 'bg-coral/20'
            )}
          />
        )}
      </AnimatePresence>
    </motion.button>
  )
})

// ── Cluster badge ──────────────────────────────────────────────────────────────

type ClusterButtonProps = {
  group: MarkerGroup
  delay: number
  onClickCluster: (group: MarkerGroup) => void
}

const ClusterButton = memo(function ClusterButton({ group, delay, onClickCluster }: ClusterButtonProps) {
  const count = group.markers.length
  const venueCount = group.markers.filter((m) => m.type === 'venue').length
  const dominant = venueCount >= count / 2 ? 'venue' : 'event'

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClickCluster(group)
      }}
      initial={{ opacity: 0, scale: 0.3, y: -8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.2, y: -6, filter: 'blur(3px)' }}
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        opacity: { duration: 0.12, delay },
        filter:  { duration: 0.15, delay },
        y:       { type: 'spring', stiffness: 520, damping: 28, delay },
        scale:   { type: 'spring', stiffness: 520, damping: 28, delay },
      }}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg',
        dominant === 'venue'
          ? 'border-emerald bg-emerald text-white'
          : 'border-coral bg-coral text-white'
      )}
      aria-label={`${count} elementos aquí — clic para expandir`}
    >
      {count}
      {/* static ring */}
      <span className={cn(
        'pointer-events-none absolute inset-0 rounded-full ring-[3px]',
        dominant === 'venue' ? 'ring-emerald/30' : 'ring-coral/30'
      )} />
      {/* pulsing ring to hint it's expandable */}
      <motion.span
        animate={{ scale: [1, 1.65], opacity: [0.4, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full',
          dominant === 'venue' ? 'bg-emerald/25' : 'bg-coral/25'
        )}
      />
    </motion.button>
  )
})

// ── Main panel ─────────────────────────────────────────────────────────────────

// Build a GeoJSON circle polygon for the proximity radius overlay
function buildCircleGeoJSON(
  lat: number,
  lng: number,
  radiusMeters: number,
  steps = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const dLat = (radiusMeters / 111320) * Math.cos(angle)
    const dLng = (radiusMeters / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle)
    coords.push([lng + dLng, lat + dLat])
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} }
}

export function ExploreMapPanel({
  markers,
  items,
  activeId,
  onMarkerClick,
  onBoundsChange,
  onZoomChange,
  markerRenderMode = 'dom',
  mapboxToken,
  mapStyle,
  userLocation,
  proximityRadius,
  onMapRef,
  showSearchOnMoveToggle = true,
  className,
}: ExploreMapPanelProps) {
  const themedMapStyle = useMapThemeStyle(mapStyle)
  const safeUserLocation = userLocation ?? null
  const safeProximityRadius = proximityRadius ?? null

  const [popupId, setPopupId]             = useState<string | null>(null)
  const [popupPos, setPopupPos]           = useState<{ lat: number; lng: number } | null>(null)
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [searchOnMove, setSearchOnMove]   = useState(true)
  const [spiderfiedKey, setSpiderfiedKey] = useState<string | null>(null)
  const [exitingKey, setExitingKey]       = useState<string | null>(null)
  const [exitingOffsets, setExitingOffsets] = useState<Array<{ dlat: number; dlng: number }>>() 
  const [zoom, setZoom]                   = useState(DEFAULT_CENTER.zoom)
  const [canvasMarkers, setCanvasMarkers] = useState<ExploreMapMarker[]>(markers)
  const [canvasLayerOpacity, setCanvasLayerOpacity] = useState(1)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const containerRef                      = useRef<HTMLDivElement | null>(null)
  const mapRef                            = useRef<MapRef | null>(null)
  const exitTimerRef                      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const markerSwapTimerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef                     = useRef<{ x: number; y: number; distance: number } | null>(null)
  // Tracks the Mapbox numeric feature id of the currently hovered marker (for setFeatureState)
  const prevHoveredFeatureRef             = useRef<number | string | undefined | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobileViewport(media.matches)
    update()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }

    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  const markerSignature = useMemo(
    () => [...markers.map((m) => m.id)].sort().join('|'),
    [markers]
  )
  const canvasSignatureRef = useRef(markerSignature)

  useEffect(() => {
    if (markerRenderMode !== 'canvas') {
      setCanvasMarkers(markers)
      setCanvasLayerOpacity(1)
      canvasSignatureRef.current = markerSignature
      return
    }

    if (canvasSignatureRef.current === markerSignature) {
      setCanvasMarkers(markers)
      return
    }

    if (markerSwapTimerRef.current) clearTimeout(markerSwapTimerRef.current)

    setCanvasLayerOpacity(0)
    markerSwapTimerRef.current = setTimeout(() => {
      setCanvasMarkers(markers)
      canvasSignatureRef.current = markerSignature
      requestAnimationFrame(() => setCanvasLayerOpacity(1))
      markerSwapTimerRef.current = null
    }, 130)

    return () => {
      if (markerSwapTimerRef.current) {
        clearTimeout(markerSwapTimerRef.current)
        markerSwapTimerRef.current = null
      }
    }
  }, [markerRenderMode, markerSignature, markers])

  // Expose flyTo to parent via onMapRef callback
  useEffect(() => {
    if (!onMapRef) return
    onMapRef(mapRef.current ? {
      flyTo: (opts) => mapRef.current?.flyTo(opts),
    } : null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMapRef])

  // Auto-zoom when proximity radius changes: less distance = more zoom
  useEffect(() => {
    if (!userLocation || !proximityRadius) return
    // Map radius → zoom: 500m=15, 1km=14, 2km=13, 3km=12.5, 5km=12
    const zoomMap: Record<number, number> = { 500: 15, 1000: 14, 2000: 13, 3000: 12.5, 5000: 12 }
    const targetZoom = zoomMap[proximityRadius] ?? 13
    mapRef.current?.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: targetZoom,
      duration: 600,
    })
  }, [proximityRadius, userLocation])

  const [animatedRadius, setAnimatedRadius] = useState(0)
  const prevRadiusRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const [renderProximity, setRenderProximity] = useState(false)
  const lastLocationRef = useRef<UserLocation | null>(null)
  const lastRadiusRef = useRef<number | null>(null)
  const overlayRafRef = useRef<number | null>(null)
  const overlayOpacityRef = useRef(0)

  const proximityActive = Boolean(safeUserLocation && safeProximityRadius !== null)

  useEffect(() => {
    if (proximityActive) {
      lastLocationRef.current = safeUserLocation
      lastRadiusRef.current = safeProximityRadius
      setRenderProximity(true)
    }
  }, [proximityActive, safeUserLocation, safeProximityRadius])

  useEffect(() => {
    const duration = 260
    const start = performance.now()

    if (overlayRafRef.current !== null) cancelAnimationFrame(overlayRafRef.current)

    const from = overlayOpacityRef.current
    const to = proximityActive ? 1 : 0

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3) * (1 + 2.5 * t)
      const raw = from + (to - from) * ease
      const current = Math.max(0, Math.min(1, raw))
      setOverlayOpacity(current)
      overlayOpacityRef.current = current

      if (t < 1) {
        overlayRafRef.current = requestAnimationFrame(animate)
        return
      }

      overlayRafRef.current = null
      if (!proximityActive) {
        setRenderProximity(false)
        lastLocationRef.current = null
        lastRadiusRef.current = null
        prevRadiusRef.current = 0
        setAnimatedRadius(0)
      }
    }

    overlayRafRef.current = requestAnimationFrame(animate)
    return () => {
      if (overlayRafRef.current !== null) cancelAnimationFrame(overlayRafRef.current)
    }
  }, [proximityActive])

  useEffect(() => {
    const loc = proximityActive ? safeUserLocation : lastLocationRef.current
    const radius = proximityActive ? safeProximityRadius : lastRadiusRef.current
    if (!loc || radius === null) {
      setAnimatedRadius(0)
      prevRadiusRef.current = 0
      return
    }
    const from = prevRadiusRef.current === 0 ? 0 : prevRadiusRef.current
    const to = radius
    const duration = 500 // ms
    const start = performance.now()

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // cubic-bezier(0.16, 1, 0.3, 1) — iOS spring / design system curve
      // Approximated: fast start, overshoots slightly, settles elegantly
      const ease = 1 - Math.pow(1 - t, 3) * (1 + 2.5 * t)
      const current = from + (to - from) * ease
      setAnimatedRadius(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevRadiusRef.current = to
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [proximityActive, safeUserLocation, safeProximityRadius])

  const overlayLocation = useMemo(() => {
    if (!renderProximity) return null
    return safeUserLocation ?? lastLocationRef.current
  }, [renderProximity, safeUserLocation])

  const circleGeoJSON = useMemo(() => {
    if (!overlayLocation || animatedRadius === 0) return null
    return buildCircleGeoJSON(overlayLocation.lat, overlayLocation.lng, animatedRadius)
  }, [overlayLocation, animatedRadius])

  const activeMarker = markers.find((m) => m.id === popupId)
  const activeItem   = items.find((i) => i.id === popupId)

  const markerGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: canvasMarkers.map((marker) => ({
      type: 'Feature' as const,
      properties: {
        id: marker.id,
        slug: marker.slug,
        type: marker.type,
        name: marker.name,
        category: marker.category,
        categoryIcon: marker.categoryIcon ?? null,
        categoryKey: getCategoryKey(marker.category, marker.type),
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [marker.lng, marker.lat] as [number, number],
      },
    })),
  }), [canvasMarkers])

  const groups = useMemo(() => groupByPosition(markers), [markers])

  const spiderfiedGroup = spiderfiedKey
    ? (groups.find((g) => g.key === spiderfiedKey) ?? null)
    : null

  const ensureEmojiImage = useCallback((map: any, imageId: string) => {
    if (!(imageId.startsWith('venue-') || imageId.startsWith('event-'))) return
    if (map.hasImage(imageId)) return

    const emoji = getCategoryEmoji(imageId)
    const imageData = createEmojiImage(emoji, 64)
    if (!map.hasImage(imageId)) {
      map.addImage(imageId, imageData)
    }
  }, [])

  const ensureAllEmojiImages = useCallback((map: any) => {
    EMOJI_IMAGE_IDS.forEach((imageId) => ensureEmojiImage(map, imageId))
  }, [ensureEmojiImage])

  const handleMapLoad = useCallback((event: any) => {
    const map = event?.target
    if (!map) return

    if (!emojiMissingListenerAttached.has(map)) {
      map.on('styleimagemissing', (e: { id: string }) => {
        ensureEmojiImage(map, e.id)
      })
      emojiMissingListenerAttached.add(map)
    }

    ensureAllEmojiImages(map)
  }, [ensureAllEmojiImages, ensureEmojiImage])

  const handleMapStyleData = useCallback((event: any) => {
    const map = event?.target
    if (!map || !map.isStyleLoaded()) return
    ensureAllEmojiImages(map)
  }, [ensureAllEmojiImages])

  const offsets = useMemo(
    () => spiderfiedGroup ? circleOffsets(spiderfiedGroup.markers.length, zoom) : [],
    [spiderfiedGroup, zoom]
  )

  const emitBounds = useCallback(() => {
    if (!searchOnMove) return
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    if (!b) return
    onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() })
  }, [searchOnMove, onBoundsChange])

  const handleMoveEnd = useCallback((e: ViewStateChangeEvent) => {
    setZoom(e.viewState.zoom)
    onZoomChange?.(e.viewState.zoom)
    emitBounds()
  }, [emitBounds, onZoomChange])

  const handleMapMouseMove = useCallback((e: any) => {
    if (markerRenderMode !== 'canvas') return
    const map = mapRef.current?.getMap()
    if (!map) return

    const interactiveLayers = [CANVAS_CLUSTER_LAYER_ID, CANVAS_UNCLUSTERED_LAYER_ID].filter((layerId) =>
      Boolean(map.getLayer(layerId))
    )
    if (interactiveLayers.length === 0) return

    const features = map.queryRenderedFeatures(e.point, { layers: interactiveLayers })
    const hoveredPoint = features.find((f) => f.layer?.id === CANVAS_UNCLUSTERED_LAYER_ID)

    // Clear previous hover via feature-state (enables Mapbox native transitions)
    if (prevHoveredFeatureRef.current != null) {
      map.setFeatureState(
        { source: 'canvas-markers', id: prevHoveredFeatureRef.current },
        { hover: false }
      )
    }

    if (hoveredPoint) {
      prevHoveredFeatureRef.current = hoveredPoint.id
      map.setFeatureState(
        { source: 'canvas-markers', id: hoveredPoint.id! },
        { hover: true }
      )
      // React state still used only for popup/cursor — not for paint expressions
      setHoveredMarkerId((prev) => {
        const next = (hoveredPoint.properties?.id as string | undefined) ?? null
        return prev === next ? prev : next
      })
    } else {
      prevHoveredFeatureRef.current = null
      setHoveredMarkerId(null)
    }

    map.getCanvas().style.cursor = hoveredPoint ? 'pointer' : ''
  }, [markerRenderMode])

  const handleMapMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (map) {
      if (prevHoveredFeatureRef.current != null) {
        map.setFeatureState(
          { source: 'canvas-markers', id: prevHoveredFeatureRef.current },
          { hover: false }
        )
        prevHoveredFeatureRef.current = null
      }
      map.getCanvas().style.cursor = ''
    }
    setHoveredMarkerId(null)
  }, [])

  // Touch handlers to disable pinch zoom
  const handleTouchStart = useCallback((e: any) => {
    if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length === 2) {
      touchStartRef.current = {
        x: e.originalEvent.touches[0].clientX,
        y: e.originalEvent.touches[0].clientY,
        distance: Math.hypot(
          e.originalEvent.touches[1].clientX - e.originalEvent.touches[0].clientX,
          e.originalEvent.touches[1].clientY - e.originalEvent.touches[0].clientY
        )
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: any) => {
    if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length === 2 && touchStartRef.current) {
      e.originalEvent.preventDefault()
      const currentDistance = Math.hypot(
        e.originalEvent.touches[1].clientX - e.originalEvent.touches[0].clientX,
        e.originalEvent.touches[1].clientY - e.originalEvent.touches[0].clientY
      )
      const scale = currentDistance / touchStartRef.current.distance
      // Prevent zoom if pinch gesture is detected
      if (Math.abs(scale - 1) > 0.1) {
        e.originalEvent.stopPropagation()
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null
  }, [])

  const openItemPopup = useCallback(
    (id: string, lat: number, lng: number) => {
      setSpiderfiedKey(null)
      setPopupId(id)
      setPopupPos({ lat, lng })
      onMarkerClick(id)
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: mapRef.current?.getZoom() ?? 14,
        duration: 400,
        offset: [0, 0],
      })
    },
    [isMobileViewport, onMarkerClick]
  )

  // Clicking map background (or canvas layer points/clusters) → handle interaction
  const handleMapClick = useCallback((e: any) => {
    if (markerRenderMode === 'canvas') {
      const map = mapRef.current?.getMap()
      if (map) {
        const queryLayers = [CANVAS_CLUSTER_LAYER_ID, CANVAS_UNCLUSTERED_LAYER_ID].filter((layerId) =>
          Boolean(map.getLayer(layerId))
        )

        if (queryLayers.length === 0) {
          setSpiderfiedKey(null)
          setPopupId(null)
          setPopupPos(null)
          return
        }

        const features = map.queryRenderedFeatures(e.point, {
          layers: queryLayers,
        })

        if (features.length > 0) {
          const clicked = features[0]

          if (clicked.layer?.id === CANVAS_CLUSTER_LAYER_ID) {
            const clusterId = clicked.properties?.cluster_id
            const [lng, lat] = clicked.geometry.type === 'Point'
              ? clicked.geometry.coordinates as [number, number]
              : [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude]

            if (clusterId !== undefined) {
              const source = map.getSource('canvas-markers') as any
              source?.getClusterExpansionZoom?.(clusterId, (err: unknown, clusterZoom: number) => {
                if (!err) {
                  map.easeTo({ center: [lng, lat], zoom: clusterZoom + 0.6, duration: 350 })
                }
              })
            }
            return
          }

          if (clicked.layer?.id === CANVAS_UNCLUSTERED_LAYER_ID) {
            const id = clicked.properties?.id as string | undefined
            const [lng, lat] = clicked.geometry.type === 'Point'
              ? clicked.geometry.coordinates as [number, number]
              : [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude]
            if (id) {
              openItemPopup(id, lat, lng)
              return
            }
          }
        }
      }
    }

    setSpiderfiedKey(null)
    setPopupId(null)
    setPopupPos(null)
    setHoveredMarkerId(null)
  }, [markerRenderMode, openItemPopup])

  const handlePinClick = useCallback(
    (id: string, lat: number, lng: number) => {
      openItemPopup(id, lat, lng)
    },
    [openItemPopup]
  )

  const handleClusterClick = useCallback((group: MarkerGroup, currentOffsets: Array<{ dlat: number; dlng: number }>) => {
    setSpiderfiedKey((prev) => {
      if (prev === group.key) {
        setExitingKey(group.key)
        setExitingOffsets(currentOffsets)
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
        exitTimerRef.current = setTimeout(() => {
          setExitingKey(null)
          setExitingOffsets([])
        }, 320)
        return null
      }
      setExitingKey(null)
      setExitingOffsets([])
      return group.key
    })
    setPopupId(null)
    setPopupPos(null)
    mapRef.current?.flyTo({ center: [group.lng, group.lat], zoom: mapRef.current?.getZoom() ?? 14, duration: 400 })
  }, [])

  useEffect(() => () => { if (exitTimerRef.current) clearTimeout(exitTimerRef.current) }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize()
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={cn('relative h-full w-full', className)}>
      {/* Search-on-move toggle */}
      {showSearchOnMoveToggle && (
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 max-w-[calc(100%-4rem)] px-2 sm:max-w-none">
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const next = !searchOnMove
              setSearchOnMove(next)
              if (next) emitBounds()
              else onBoundsChange(null)
            }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors',
              searchOnMove
                ? 'border-primary/30 bg-primary text-white'
                : 'border-border/60 bg-card/90 text-foreground hover:bg-card'
            )}
          >
            {searchOnMove
              ? <CheckSquare className="h-3.5 w-3.5" />
              : <Square className="h-3.5 w-3.5" />}
            Buscar al mover el mapa
          </motion.button>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        mapStyle={themedMapStyle}
        initialViewState={DEFAULT_CENTER}
        reuseMaps
        style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
        onLoad={handleMapLoad}
        onStyleData={handleMapStyleData}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        doubleClickZoom={false}
      >
        <NavigationControl position="top-right" />

        {/* ── Markers ─────────────────────────────────────────────────────── */}
        {markerRenderMode === 'canvas' ? (
          <Source
            id="canvas-markers"
            type="geojson"
            data={markerGeoJSON as any}
            cluster
            clusterMaxZoom={15}
            clusterRadius={50}
            generateId
          >
            <Layer
              id={CANVAS_CLUSTER_LAYER_ID}
              type="circle"
              filter={['has', 'point_count']}
              paint={{
                'circle-color': [
                  'step',
                  ['get', 'point_count'],
                  '#2563eb',
                  8,
                  '#1d4ed8',
                  20,
                  '#1e40af',
                ],
                'circle-radius': [
                  'step',
                  ['get', 'point_count'],
                  18,
                  8,
                  22,
                  20,
                  28,
                ],
                'circle-stroke-width': 2.5,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-opacity': canvasLayerOpacity,
                'circle-opacity': ['*', 0.96, canvasLayerOpacity],
                'circle-stroke-opacity-transition': { duration: 180, delay: 0 },
                'circle-opacity-transition': { duration: 180, delay: 0 },
              }}
            />
            <Layer
              id={CANVAS_CLUSTER_COUNT_LAYER_ID}
              type="symbol"
              filter={['has', 'point_count']}
              layout={{
                'text-field': ['get', 'point_count_abbreviated'],
                'text-size': 12,
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              }}
              paint={{
                'text-color': '#ffffff',
                'text-halo-color': 'rgba(0,0,0,0.28)',
                'text-halo-width': 1,
                'text-opacity': canvasLayerOpacity,
                'text-opacity-transition': { duration: 180, delay: 0 },
              }}
            />
            <Layer
              id={CANVAS_UNCLUSTERED_LAYER_ID}
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  11,
                  [
                    'case',
                    ['==', ['get', 'id'], popupId ?? ''], 20,
                    ['boolean', ['feature-state', 'hover'], false], 18,
                    16,
                  ],
                  14,
                  [
                    'case',
                    ['==', ['get', 'id'], popupId ?? ''], 26,
                    ['boolean', ['feature-state', 'hover'], false], 23,
                    20,
                  ],
                ],
                'circle-color': [
                  'match',
                  ['get', 'type'],
                  'venue', '#16a34a',
                  'event', '#f97316',
                  '#64748b',
                ],
                'circle-stroke-width': [
                  'case',
                  ['==', ['get', 'id'], popupId ?? ''], 4,
                  ['boolean', ['feature-state', 'hover'], false], 3.5,
                  3,
                ],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-opacity': [
                  '*',
                  [
                    'case',
                    ['==', ['get', 'id'], popupId ?? ''], 1,
                    ['boolean', ['feature-state', 'hover'], false], 1,
                    0.9,
                  ],
                  canvasLayerOpacity,
                ],
                'circle-opacity': [
                  '*',
                  [
                    'case',
                    ['==', ['get', 'id'], popupId ?? ''], 1,
                    ['boolean', ['feature-state', 'hover'], false], 1,
                    0.88,
                  ],
                  canvasLayerOpacity,
                ],
                'circle-radius-transition': { duration: 220, delay: 0 },
                'circle-stroke-width-transition': { duration: 200, delay: 0 },
                'circle-stroke-opacity-transition': { duration: 200, delay: 0 },
                'circle-opacity-transition': { duration: 200, delay: 0 },
              }}
            />
            <Layer
              id={CANVAS_UNCLUSTERED_ICON_LAYER_ID}
              type="symbol"
              filter={['!', ['has', 'point_count']]}
              layout={{
                'icon-image': ['get', 'categoryKey'],
                'icon-size': [
                  'interpolate', ['linear'], ['zoom'],
                  11, isMobileViewport ? 0.24 : 0.32,
                  14, isMobileViewport ? 0.36 : 0.46,
                ],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
              }}
              paint={{
                'icon-opacity': [
                  '*',
                  [
                    'case',
                    ['==', ['get', 'id'], popupId ?? ''], 1,
                    ['boolean', ['feature-state', 'hover'], false], 1,
                    0.90,
                  ],
                  canvasLayerOpacity,
                ],
                'icon-opacity-transition': { duration: 220, delay: 0 },
              }}
            />
          </Source>
        ) : (
          groups.flatMap((group, gi) => {
            const isExpanded = spiderfiedKey === group.key
            const isExiting  = exitingKey === group.key

            if (group.markers.length === 1 || isExpanded || isExiting) {
              const activeOffsets = isExpanded ? offsets : isExiting ? exitingOffsets : []
              return group.markers.map((marker, si) => {
                const isActive  = marker.id === (popupId ?? activeId)
                const offset    = (isExpanded || isExiting) ? activeOffsets?.[si] : null
                const renderLat = offset ? group.lat + offset.dlat : marker.lat
                const renderLng = offset ? group.lng + offset.dlng : marker.lng
                const delay     = isExpanded ? si * 0.04 : gi * 0.015

                return (
                  <Marker
                    key={`pin-${marker.id}`}
                    longitude={renderLng}
                    latitude={renderLat}
                    anchor="bottom"
                    style={{ zIndex: isActive ? 20 : (isExpanded || isExiting) ? 12 : 1 }}
                  >
                    <AnimatePresence mode="wait">
                      <PinButton
                        key={`pb-${marker.id}-${isExpanded ? 'x' : isExiting ? 'exit' : 'n'}`}
                        marker={marker}
                        isActive={isActive}
                        delay={delay}
                        renderLat={renderLat}
                        renderLng={renderLng}
                        onClickPin={handlePinClick}
                      />
                    </AnimatePresence>
                  </Marker>
                )
              })
            }

            return [
              <Marker
                key={`cluster-${group.key}`}
                longitude={group.lng}
                latitude={group.lat}
                anchor="bottom"
                style={{ zIndex: 10 }}
              >
                <AnimatePresence mode="wait">
                  <ClusterButton
                    key={`cb-${group.key}`}
                    group={group}
                    delay={gi * 0.015}
                    onClickCluster={(g) => handleClusterClick(g, offsets)}
                  />
                </AnimatePresence>
              </Marker>,
            ]
          })
        )}

        {/* ── User location marker ─────────────────────────────────────── */}
        {renderProximity && overlayLocation && (
          <Marker longitude={overlayLocation.lng} latitude={overlayLocation.lat} anchor="center" style={{ zIndex: 30 }}>
            <div className="relative flex items-center justify-center" style={{ opacity: overlayOpacity }}>
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute h-8 w-8 rounded-full bg-primary/40"
              />
              <div className="relative h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md" />
            </div>
          </Marker>
        )}

        {/* ── Proximity circle ─────────────────────────────────────────── */}
        {circleGeoJSON && (
          <Source id="proximity-circle" type="geojson" data={circleGeoJSON}>
            <Layer
              id="proximity-fill"
              type="fill"
              paint={{
                'fill-color': 'hsl(221, 83%, 45%)',
                'fill-opacity': 0.07 * overlayOpacity,
              }}
            />
            <Layer
              id="proximity-border"
              type="line"
              paint={{
                'line-color': 'hsl(221, 83%, 45%)',
                'line-width': 1.5,
                'line-opacity': 0.4 * overlayOpacity,
                'line-dasharray': [4, 3],
              }}
            />
          </Source>
        )}

        {/* ── Popup — last in DOM = always above markers ─────────────────── */}
        <AnimatePresence mode="wait">
          {activeMarker && activeItem && popupId && popupPos && (
            <Popup
              key={popupId}
              longitude={popupPos.lng}
              latitude={popupPos.lat}
              anchor="top"
              onClose={() => { setPopupId(null); setPopupPos(null) }}
              closeButton={false}
              closeOnClick={false}
              maxWidth="280px"
              offset={isMobileViewport ? 8 : 20}
              className="explore-popup"
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.88, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 6, scale: 0.92, filter: 'blur(2px)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.8 }}
                style={{
                  fontFamily: "'Google Sans', system-ui, -apple-system, sans-serif",
                  borderRadius: '20px',
                  border: `1.5px solid ${activeMarker.type === 'venue' ? 'hsl(158 64% 38% / 0.35)' : 'hsl(14 90% 55% / 0.35)'}`,
                  background: 'hsl(var(--card))',
                  overflow: 'hidden',
                  padding: '14px',
                  position: 'relative',
                  boxShadow: '0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)',
                }}
              >
                {/* Close button */}
                <motion.button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPopupId(null); setPopupPos(null) }}
                  whileTap={{ scale: 0.88 }}
                  style={{ position: 'absolute', right: '10px', top: '10px', width: '24px', height: '24px', borderRadius: '50%', background: 'hsl(var(--secondary))', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}
                >
                  <X style={{ width: '12px', height: '12px' }} />
                </motion.button>

                {/* Type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 600, background: activeMarker.type === 'venue' ? 'hsl(158 64% 38% / 0.12)' : 'hsl(14 90% 55% / 0.12)', color: activeMarker.type === 'venue' ? 'hsl(158 64% 32%)' : 'hsl(14 90% 45%)', border: `1px solid ${activeMarker.type === 'venue' ? 'hsl(158 64% 38% / 0.25)' : 'hsl(14 90% 55% / 0.25)'}` }}>
                    <span style={{ fontSize: '13px', lineHeight: 1 }}>{activeMarker.categoryIcon ?? (activeMarker.type === 'venue' ? '🏬' : '📍')}</span>
                    {activeMarker.type === 'venue' ? 'Local' : 'Evento'}
                  </span>
                </div>

                {/* Name */}
                <p style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3, color: 'hsl(var(--foreground))', paddingRight: '28px', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                  {activeMarker.name}
                </p>

                {/* Date (events) */}
                {'startDate' in activeItem && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>
                    <CalendarDays style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                    {new Date(activeItem.startDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                  </div>
                )}

                {/* Address */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>
                  <MapPin style={{ width: '12px', height: '12px', flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {activeItem.address ?? activeItem.location}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={activeMarker.type === 'venue' ? `/locales/${activeMarker.slug}` : `/eventos/${activeMarker.slug}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: '#fff', background: activeMarker.type === 'venue' ? 'hsl(158 64% 38%)' : 'hsl(14 90% 55%)', textDecoration: 'none', letterSpacing: '-0.01em', transition: 'opacity 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Ver {activeMarker.type === 'venue' ? 'local' : 'evento'}
                </Link>
              </motion.div>
            </Popup>
          )}
        </AnimatePresence>
      </Map>

      {/* Legend */}
      <div
        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card/90 px-3 py-2 backdrop-blur-sm"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
          Locales
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-coral" />
          Eventos
        </span>
      </div>
    </div>
  )
}
