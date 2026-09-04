'use client'

import { useMemo } from 'react'
import type { VenueBusinessHours } from '@prisma/client'
import { openStatus, lojaNowParts } from '@/lib/loja-day'

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface BusinessHoursDisplayProps {
  hours: VenueBusinessHours[]
  className?: string
}

export function BusinessHoursDisplay({ hours, className = '' }: BusinessHoursDisplayProps) {
  // Un solo calculo compartido con el backend: hora de Loja, cruce de medianoche
  // y horarios de 24 h incluidos.
  const status = useMemo(() => openStatus(hours), [hours])

  const groupedByDay = useMemo(() => {
    const map = new Map<number, { openTime: string; closeTime: string }[]>()
    for (const h of hours) {
      if (h.isClosed) {
        map.set(h.dayOfWeek, [])
      } else {
        const existing = map.get(h.dayOfWeek) || []
        existing.push({ openTime: h.openTime, closeTime: h.closeTime })
        map.set(h.dayOfWeek, [...existing].sort((a, b) => a.openTime.localeCompare(b.openTime)))
      }
    }
    return map
  }, [hours])

  const today = lojaNowParts().weekday

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
