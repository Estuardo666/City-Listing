'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { getTodayInLoja } from '@/lib/today'

type Today = Awaited<ReturnType<typeof getTodayInLoja>>
const paths: Record<string, string> = { event: 'eventos', venue: 'locales', route: 'rutas', collection: 'colecciones' }

export function TodayInLoja() {
  const [data, setData] = useState<Today | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const slider = useRef<HTMLDivElement>(null)
  const move = (direction: number) => slider.current?.scrollBy({ left: direction * slider.current.clientWidth, behavior: 'auto' })
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch('/api/mobile/v1/today', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('today')
        const payload = await response.json()
        setData(payload.data); setError(false)
      } catch { if (!controller.signal.aborted) setError(true) }
    }
    void load()
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void load() }, 60_000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [attempt])

  return <section aria-labelledby="today-title" className="space-y-6 rounded-3xl border border-border bg-card p-5 sm:p-8">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">Tu ciudad, a tu ritmo</p>
        <h2 id="today-title" className="text-3xl font-semibold tracking-tight">Hoy en Loja</h2></div>
      {data && <time className="text-sm text-muted-foreground" dateTime={data.date}>{new Intl.DateTimeFormat('es-EC', {
        timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric', month: 'long',
      }).format(new Date(`${data.date}T12:00:00-05:00`))}</time>}
    </header>
    {error ? <div role="status">No pudimos actualizar los planes. <button className="underline" onClick={() => setAttempt(n => n + 1)}>Reintentar</button></div>
      : !data ? <p role="status">Buscando planes para hoy…</p> : null}
    {data && !error && <div className="space-y-8">
      {[
        { title: 'En la agenda de hoy', items: data.events, empty: 'No hay eventos publicados para lo que queda de hoy.', href: '/eventos' },
        { title: 'Abiertos ahora', items: data.openVenues, empty: 'No hay horarios confirmados para este momento.', href: '/locales' },
        { title: 'Una ruta de hasta tres horas', items: data.routes, empty: 'Pronto encontrarás rutas cortas para recorrer Loja.', href: '/rutas' },
        { title: 'Colecciones de locales', items: data.collections, empty: 'Estamos preparando selecciones de lugares con consejos locales.', href: '/explorar' },
      ].map(section => <section key={section.title} className="space-y-3">
        <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">{section.title}</h3>
          {section.items === data.events && data.events.length > 1 && <div className="flex gap-2">
            <button type="button" aria-label="Evento anterior" onClick={() => move(-1)} className="rounded-full border px-4 py-2">←</button>
            <button type="button" aria-label="Evento siguiente" onClick={() => move(1)} className="rounded-full border px-4 py-2">→</button>
          </div>}
        </div>
        {!section.items.length ? <p className="text-sm text-muted-foreground">{section.empty} <Link className="underline" href={section.href}>Explorar</Link></p>
          : <div ref={section.items === data.events ? slider : undefined}
            aria-label={section.title} tabIndex={section.items === data.events ? 0 : undefined}
            className={section.items === data.events ? 'flex snap-x snap-mandatory overflow-x-auto rounded-2xl' : 'grid grid-cols-2 gap-4 lg:grid-cols-3'}>{section.items.map(item => <Link key={item.id}
            href={`/${paths[item.kind]}/${encodeURIComponent(item.slug)}`}
            className={`group overflow-hidden rounded-2xl border border-border bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${item.kind === 'event' ? 'w-full shrink-0 snap-start' : ''}`}>
            <div className={`relative bg-muted ${item.kind === 'event' ? 'h-64 sm:h-96' : 'h-40'}`}>
              {item.image ? <Image src={item.image} alt="" fill sizes={item.kind === 'event' ? '90vw' : '(max-width: 640px) 45vw, 30vw'} className="object-cover" />
                : <span className="flex h-full items-center justify-center text-sm text-muted-foreground">{item.kind === 'route' ? 'Recorre Loja' : 'Vive Loja'}</span>}
            </div>
            <div className="space-y-1 p-4"><p className={`font-semibold group-hover:underline ${item.kind === 'event' ? 'text-2xl sm:text-3xl' : ''}`}>{item.title}</p>
              {item.subtitle && <p className="line-clamp-2 text-sm text-muted-foreground">{item.subtitle}</p>}
              {'startDate' in item && <p className="text-sm">{new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' }).format(new Date(item.startDate))}
                {' · '}{item.price === 0 ? 'Gratis' : item.price != null ? `$${item.price}` : 'Consultar precio'}</p>}
              {'author' in item && <p className="text-xs text-muted-foreground">Por {item.author ?? 'Equipo Vive Loja'} · {item.itemCount} locales</p>}
            </div></Link>)}</div>}
      </section>)}
      <p className="text-xs text-muted-foreground">Horarios publicados por los locales; pueden cambiar en feriados. Confirma antes de salir.</p>
    </div>}
  </section>
}
