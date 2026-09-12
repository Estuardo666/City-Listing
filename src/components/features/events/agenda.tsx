'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RotateCcw,
} from 'lucide-react'
import type { AgendaPeriod } from '@/lib/agenda-window'

type AgendaEvent = {
  id: string
  slug: string
  title: string
  image: string | null
  startDate: string
  location: string
  price: number | null
}

const tabs: [AgendaPeriod, string][] = [
  ['today', 'Hoy'],
  ['tomorrow', 'Mañana'],
  ['weekend', 'Fin de semana'],
  ['upcoming', 'Próximos 30 días'],
]

const TZ = 'America/Guayaquil'
const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const weekdayFormat = new Intl.DateTimeFormat('es-EC', { timeZone: TZ, weekday: 'short' })
const dayNumberFormat = new Intl.DateTimeFormat('es-EC', { timeZone: TZ, day: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('es-EC', { timeZone: TZ, month: 'short' })
const longDateFormat = new Intl.DateTimeFormat('es-EC', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const shortDateFormat = new Intl.DateTimeFormat('es-EC', {
  timeZone: TZ,
  weekday: 'short',
  day: 'numeric',
})
const timeFormat = new Intl.DateTimeFormat('es-EC', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
})

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function priceLabel(price: number | null) {
  if (price === 0) return 'Gratis'
  if (price == null) return 'Consultar'
  return `$${price.toFixed(2)}`
}

function stripDot(value: string) {
  return value.replace(/\.$/, '')
}

function AgendaCard({ event }: { event: AgendaEvent }) {
  const [imageError, setImageError] = useState(false)
  const usable = event.image && isValidHttpUrl(event.image) && !imageError
  const free = event.price === 0

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-accent">
        {usable ? (
          <Image
            src={event.image as string}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-accent to-coral/15">
            <CalendarDays className="h-7 w-7 text-primary/50" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold capitalize text-white backdrop-blur-sm">
          {shortDateFormat.format(new Date(event.startDate))} · {timeFormat.format(new Date(event.startDate))}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            free ? 'bg-emerald text-emerald-foreground' : 'bg-white/90 text-neutral-900'
          }`}
        >
          {priceLabel(event.price)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h4 className="line-clamp-2 text-base font-medium leading-snug text-foreground transition-colors duration-150 group-hover:text-primary">
          {event.title}
        </h4>
        <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-coral/70" />
          <span className="truncate">{event.location || 'Lugar por confirmar'}</span>
        </p>
      </div>
    </Link>
  )
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="aspect-[16/10] w-full animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  )
}

export function Agenda() {
  const [period, setPeriod] = useState<AgendaPeriod>('today')
  const [events, setEvents] = useState<AgendaEvent[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    setEvents(null)
    setError(false)
    setSelectedDay(null)
    fetch(`/api/mobile/v1/agenda?period=${period}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('agenda')
        return r.json()
      })
      .then((r) => setEvents(r.data))
      .catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
    return () => controller.abort()
  }, [period, attempt])

  // Dias con eventos dentro del periodo, en orden cronologico
  const days = useMemo(() => {
    const map = new Map<string, { key: string; date: Date; count: number }>()
    for (const event of events ?? []) {
      const date = new Date(event.startDate)
      const key = dayKeyFormat.format(date)
      const entry = map.get(key)
      if (entry) entry.count += 1
      else map.set(key, { key, date, count: 1 })
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
  }, [events])

  const visible = useMemo(() => {
    if (!events) return []
    if (!selectedDay) return events
    return events.filter((e) => dayKeyFormat.format(new Date(e.startDate)) === selectedDay)
  }, [events, selectedDay])

  const sorted = useMemo(
    () => [...visible].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [visible],
  )

  const selectedLabel = useMemo(() => {
    if (!selectedDay) return null
    const match = days.find((d) => d.key === selectedDay)
    return match ? longDateFormat.format(match.date) : null
  }, [days, selectedDay])

  const scrollRail = (direction: -1 | 1) => {
    railRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' })
  }

  return (
    <section aria-labelledby="agenda-title" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="eyebrow text-primary">Qué hacer y cuándo</span>
          <h2 id="agenda-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Tu próxima salida
          </h2>
        </div>
        <Link
          href="#todos-los-eventos"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Ver todos los eventos <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Rango de fechas */}
      <div
        role="tablist"
        aria-label="Rango de fechas"
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map(([key, label]) => {
          const active = period === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPeriod(key)}
              className={`shrink-0 cursor-pointer snap-start rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Carrusel de dias */}
      {!error && days.length > 1 && (
        <div className="relative">
          <div
            ref={railRef}
            className="-mx-4 flex snap-x gap-2 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              aria-pressed={selectedDay === null}
              className={`flex h-[68px] w-[68px] shrink-0 snap-start cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selectedDay === null
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Todos
            </button>

            {days.map(({ key, date, count }) => {
              const active = selectedDay === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(active ? null : key)}
                  aria-pressed={active}
                  className={`flex h-[68px] w-[68px] shrink-0 snap-start cursor-pointer flex-col items-center justify-center rounded-2xl border leading-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/60 bg-card text-foreground hover:border-primary/30'
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}
                  >
                    {stripDot(weekdayFormat.format(date))}
                  </span>
                  <span className="my-1 text-xl font-semibold">{dayNumberFormat.format(date)}</span>
                  <span
                    className={`text-[10px] font-medium uppercase ${
                      active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}
                  >
                    {stripDot(monthFormat.format(date))} · {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Flechas (desktop) */}
          <div className="pointer-events-none absolute -top-12 right-0 hidden gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              aria-label="Ver fechas anteriores"
              className="pointer-events-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              aria-label="Ver fechas siguientes"
              className="pointer-events-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Estados */}
      {error && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-6 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-muted-foreground">No pudimos cargar la agenda.</p>
          <button
            type="button"
            onClick={() => setAttempt((v) => v + 1)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2 font-medium transition-colors hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" /> Reintentar
          </button>
        </div>
      )}

      {!error && !events && (
        <div
          className="grid grid-cols-2 gap-4 lg:grid-cols-3"
          role="status"
          aria-label="Cargando agenda"
        >
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!error && events && events.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
          <CalendarDays className="h-7 w-7 text-muted-foreground/60" />
          <p className="font-medium text-foreground">Sin eventos para estas fechas</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Prueba con otro rango o revisa el mapa para descubrir qué hay cerca de ti.
          </p>
        </div>
      )}

      {/* Eventos */}
      {!error && events && events.length > 0 && (
        <div className="space-y-3">
          {selectedLabel && (
            <div className="flex items-baseline gap-3">
              <h3 className="text-sm font-semibold capitalize text-foreground">{selectedLabel}</h3>
              <span className="h-px flex-1 bg-border/70" />
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="shrink-0 cursor-pointer text-xs font-medium text-primary hover:text-primary/80"
              >
                Ver todas las fechas
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {sorted.map((event) => (
              <AgendaCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

    </section>
  )
}
