'use client'

import { useMemo } from 'react'

interface OperatingHoursData {
  mon: string | null
  tue: string | null
  wed: string | null
  thu: string | null
  fri: string | null
  sat: string | null
  sun: string | null
  notes: string | null
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

function parseTimeRanges(schedule: string | null): { start: string; end: string }[] {
  if (!schedule) return []
  return schedule.split(',').map((range) => {
    const [start, end] = range.split('-')
    return { start, end }
  })
}

function isCurrentlyOpen(hours: OperatingHoursData): boolean {
  const now = new Date()
  const dayIndex = now.getDay()
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const todayKey = dayKeys[dayIndex] as keyof OperatingHoursData
  const todaySchedule = hours[todayKey]

  if (!todaySchedule) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const ranges = parseTimeRanges(todaySchedule)

  return ranges.some(({ start, end }) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  })
}

function formatTimeRange(schedule: string | null): string {
  if (!schedule) return 'Cerrado'
  return schedule.replace(/,/g, ', ')
}

interface OpenStatusBadgeProps {
  hours: OperatingHoursData
  className?: string
}

export function OpenStatusBadge({ hours, className = '' }: OpenStatusBadgeProps) {
  const open = useMemo(() => isCurrentlyOpen(hours), [hours])

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        open
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-400'
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          open ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />
      {open ? 'Abierto ahora' : 'Cerrado'}
    </span>
  )
}

interface OperatingHoursDisplayProps {
  hours: OperatingHoursData
  className?: string
}

export function OperatingHoursDisplay({ hours, className = '' }: OperatingHoursDisplayProps) {
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-sm">Horarios</h3>
        <OpenStatusBadge hours={hours} />
      </div>
      <div className="space-y-1.5">
        {dayKeys.map((day) => (
          <div key={day} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{DAY_LABELS[day]}</span>
            <span className={hours[day] ? 'font-medium' : 'text-muted-foreground'}>
              {formatTimeRange(hours[day])}
            </span>
          </div>
        ))}
      </div>
      {hours.notes && (
        <p className="mt-3 text-xs text-muted-foreground italic">{hours.notes}</p>
      )}
    </div>
  )
}
