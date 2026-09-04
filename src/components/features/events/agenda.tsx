'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { AgendaPeriod } from '@/lib/agenda-window'

type AgendaEvent = { id: string; slug: string; title: string; image: string | null; startDate: string; location: string; price: number | null }
const tabs: [AgendaPeriod, string][] = [['today', 'Hoy'], ['tomorrow', 'Mañana'], ['weekend', 'Fin de semana'], ['upcoming', 'Próximos 30 días']]
const dateFormat = new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric', month: 'long' })
const timeFormat = new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' })

export function Agenda() {
  const [period, setPeriod] = useState<AgendaPeriod>('today')
  const [events, setEvents] = useState<AgendaEvent[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setEvents(null); setError(false)
    fetch(`/api/mobile/v1/agenda?period=${period}`, { signal: controller.signal, cache: 'no-store' })
      .then(async r => { if (!r.ok) throw new Error('agenda'); return r.json() })
      .then(r => setEvents(r.data)).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [period, attempt])
  const groups = new Map<string, AgendaEvent[]>()
  for (const event of events ?? []) {
    const day = dateFormat.format(new Date(event.startDate))
    groups.set(day, [...(groups.get(day) ?? []), event])
  }
  return <section aria-labelledby="agenda-title" className="space-y-6">
    <h2 id="agenda-title" className="text-3xl font-semibold">Tu próxima salida</h2>
    <div className="flex flex-wrap gap-2" aria-label="Fecha de los eventos">{tabs.map(([key, label]) => <button key={key}
      onClick={() => setPeriod(key)} aria-pressed={period === key}
      className={`rounded-full border px-5 py-3 font-semibold ${period === key ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>{label}</button>)}</div>
    {error ? <p role="alert">No pudimos cargar la agenda. <button className="underline" onClick={() => setAttempt(v => v + 1)}>Reintentar</button></p>
      : !events ? <p role="status">Cargando agenda…</p> : !events.length ? <p>No hay eventos publicados para estas fechas.</p> : null}
    {Array.from(groups, ([date, items]) => <section key={date} className="space-y-3"><h3 className="text-lg font-semibold capitalize">{date}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(event => <Link key={event.id} href={`/eventos/${event.slug}`} className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-48 bg-muted">{event.image && <Image src={event.image} fill alt="" sizes="(max-width: 640px) 90vw, 33vw" className="object-cover" />}</div>
        <div className="space-y-2 p-5"><p className="font-semibold text-primary">{timeFormat.format(new Date(event.startDate))} · {event.price === 0 ? 'Gratis' : event.price == null ? 'Consultar precio' : `$${event.price.toFixed(2)}`}</p>
          <h4 className="text-xl font-semibold">{event.title}</h4><p className="text-sm text-muted-foreground">{event.location || 'Lugar por confirmar'}</p></div>
      </Link>)}</div></section>)}
  </section>
}
