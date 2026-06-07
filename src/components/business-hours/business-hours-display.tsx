'use client'

import { useMemo } from 'react'
import type { VenueBusinessHours } from '@prisma/client'

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function minutesNow(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

interface BusinessHoursDisplayProps {
  hours: VenueBusinessHours[]
  className?: string
}

export function BusinessHoursDisplay({ hours, className = '' }: BusinessHoursDisplayProps) {
  const status = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentMin = minutesNow()
    const todaySlots = hours.filter((h) => h.dayOfWeek === dayOfWeek && !h.isClosed)

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

    const tomorrow = (dayOfWeek + 1) % 7
    const tomorrowSlots = hours.filter((h) => h.dayOfWeek === tomorrow && !h.isClosed)
    if (tomorrowSlots.length > 0) {
      const earliest = tomorrowSlots.sort((a, b) => timeToMinutes(a.openTime) - timeToMinutes(b.openTime))[0]
      return { isOpen: false, opensAt: `${earliest.openTime} (mañana)` }
    }

    return { isOpen: false }
  }, [hours])

  const groupedByDay = useMemo(() => {
    const map = new Map<number, { openTime: string; closeTime: string }[]>()
    for (const h of hours) {
      if (h.isClosed) {
        map.set(h.dayOfWeek, [])
      } else {
        const existing = map.get(h.dayOfWeek) || []
        existing.push({ openTime: h.openTime, closeTime: h.closeTime })
        map.set(h.dayOfWeek, existing.sort((a, b) => a.openTime.localeCompare(b.openTime)))
      }
    }
    return map
  }, [hours])

  const today = new Date().getDay()

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-sm">Horarios</h3>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            status.isOpen
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {status.isOpen ? `Abierto · Cierra a las ${status.closesAt}` : status.opensAt ? `Cerrado · Abre a las ${status.opensAt}` : 'Cerrado'}
        </span>
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: 7 }, (_, i) => {
          const daySlots = groupedByDay.get(i)
          const isClosed = hours.some((h) => h.dayOfWeek === i && h.isClosed)
          const isToday = i === today

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
        })}
      </div>
    </div>
  )
}
