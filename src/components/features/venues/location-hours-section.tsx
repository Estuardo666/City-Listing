'use client'

import { useMemo } from 'react'
import { MapPin, Clock } from 'lucide-react'
import { VenuesMap } from '@/components/features/venues/venues-map'
import type { VenueBusinessHours } from '@prisma/client'
import type { VenueMapItem } from '@/types/venue'

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

interface OperatingHoursLegacy {
  mon: string | null
  tue: string | null
  wed: string | null
  thu: string | null
  fri: string | null
  sat: string | null
  sun: string | null
  notes: string | null
}

interface LocationHoursSectionProps {
  venue: {
    id: string
    name: string
    slug: string
    location: string
    address: string | null
    lat: number | null
    lng: number | null
    venueCategories: { category: { name: string } }[]
  }
  businessHours: VenueBusinessHours[]
  operatingHours: OperatingHoursLegacy | null
  mapboxToken: string
  mapStyle: string
}

export function LocationHoursSection({
  venue,
  businessHours,
  operatingHours,
  mapboxToken,
  mapStyle,
}: LocationHoursSectionProps) {
  const hasHours = businessHours.length > 0 || operatingHours !== null

  const status = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentMin = now.getHours() * 60 + now.getMinutes()

    if (businessHours.length > 0) {
      const todaySlots = businessHours.filter((h) => h.dayOfWeek === dayOfWeek && !h.isClosed)
      for (const slot of todaySlots) {
        const open = timeToMinutes(slot.openTime)
        const close = timeToMinutes(slot.closeTime)
        if (currentMin >= open && currentMin < close) {
          return { isOpen: true, closesAt: slot.closeTime }
        }
      }
      const sorted = todaySlots.sort((a, b) => timeToMinutes(a.openTime) - timeToMinutes(b.openTime))
      const nextSlot = sorted.find((s) => timeToMinutes(s.openTime) > currentMin)
      if (nextSlot) return { isOpen: false, opensAt: nextSlot.openTime }
      return { isOpen: false }
    }

    if (operatingHours) {
      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      const todayKey = dayKeys[dayOfWeek] as keyof OperatingHoursLegacy
      const todaySchedule = operatingHours[todayKey]
      if (!todaySchedule) return { isOpen: false }
      const ranges = todaySchedule.split(',').map((r) => {
        const [start, end] = r.split('-')
        return { start, end }
      })
      for (const { start, end } of ranges) {
        const [sH, sM] = start.split(':').map(Number)
        const [eH, eM] = end.split(':').map(Number)
        if (currentMin >= sH * 60 + sM && currentMin < eH * 60 + eM) {
          return { isOpen: true, closesAt: end }
        }
      }
      return { isOpen: false }
    }

    return { isOpen: false }
  }, [businessHours, operatingHours])

  const groupedByDay = useMemo(() => {
    if (businessHours.length > 0) {
      const map = new Map<number, { openTime: string; closeTime: string }[]>()
      for (const h of businessHours) {
        if (h.isClosed) {
          map.set(h.dayOfWeek, [])
        } else {
          const existing = map.get(h.dayOfWeek) || []
          existing.push({ openTime: h.openTime, closeTime: h.closeTime })
          map.set(h.dayOfWeek, existing.sort((a, b) => a.openTime.localeCompare(b.openTime)))
        }
      }
      return map
    }
    return null
  }, [businessHours])

  const today = new Date().getDay()

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="border-b border-border/50 px-5 py-4">
        <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Locación y Horarios
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Map */}
        <div className="relative min-h-[280px]">
          {venue.lat !== null && venue.lng !== null ? (
            <VenuesMap
              venues={[{
                id: venue.id,
                name: venue.name,
                slug: venue.slug,
                location: venue.location,
                address: venue.address,
                lat: venue.lat,
                lng: venue.lng,
                venueCategories: venue.venueCategories,
              }] as VenueMapItem[]}
              mapboxToken={mapboxToken}
              mapStyle={mapStyle}
              className="h-full [&>div]:h-full [&>div>div]:h-full [&_.rounded-2xl]:rounded-none [&_.rounded-2xl]:border-0"
            />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center bg-muted/30 p-6">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Sin ubicación en mapa</p>
              </div>
            </div>
          )}
        </div>

        {/* Hours */}
        <div className="border-t border-border/50 md:border-t-0 md:border-l border-border/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                status.isOpen
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {status.isOpen ? `Abierto ahora · Cierra a las ${status.closesAt}` : status.opensAt ? `Cerrado · Abre a las ${status.opensAt}` : 'Cerrado'}
            </span>
          </div>

          {hasHours ? (
            <div className="space-y-1.5">
              {Array.from({ length: 7 }, (_, i) => {
                const isToday = i === today

                if (groupedByDay) {
                  const daySlots = groupedByDay.get(i)
                  const isClosed = businessHours.some((h) => h.dayOfWeek === i && h.isClosed)
                  return (
                    <div key={i} className={`flex justify-between text-sm ${isToday ? 'font-semibold' : ''}`}>
                      <span className={isToday ? 'text-foreground' : 'text-muted-foreground'}>{DAY_LABELS[i]}</span>
                      <span className={isClosed ? 'text-muted-foreground' : isToday ? 'text-foreground' : 'text-muted-foreground'}>
                        {isClosed || !daySlots || daySlots.length === 0
                          ? 'Cerrado'
                          : daySlots.map((s) => `${s.openTime} – ${s.closeTime}`).join(', ')}
                      </span>
                    </div>
                  )
                }

                if (operatingHours) {
                  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
                  const dayKey = dayKeys[i === 0 ? 6 : i - 1] as keyof OperatingHoursLegacy
                  const schedule = operatingHours[dayKey]
                  return (
                    <div key={i} className={`flex justify-between text-sm ${isToday ? 'font-semibold' : ''}`}>
                      <span className={isToday ? 'text-foreground' : 'text-muted-foreground'}>{DAY_LABELS[i]}</span>
                      <span className={schedule ? (isToday ? 'text-foreground' : 'text-muted-foreground') : 'text-muted-foreground'}>
                        {schedule ? schedule.replace(/,/g, ', ') : 'Cerrado'}
                      </span>
                    </div>
                  )
                }

                return (
                  <div key={i} className={`flex justify-between text-sm ${isToday ? 'font-semibold' : ''}`}>
                    <span className={isToday ? 'text-foreground' : 'text-muted-foreground'}>{DAY_LABELS[i]}</span>
                    <span className="text-muted-foreground">Sin horario</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {Array.from({ length: 7 }, (_, i) => {
                const isToday = i === today
                return (
                  <div key={i} className={`flex justify-between text-sm ${isToday ? 'font-semibold' : ''}`}>
                    <span className={isToday ? 'text-foreground' : 'text-muted-foreground'}>{DAY_LABELS[i]}</span>
                    <span className="text-muted-foreground">Sin horario</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
