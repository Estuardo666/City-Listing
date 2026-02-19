import Image from 'next/image'
import Link from 'next/link'
import {
  Building2, CalendarDays, Clock3, DollarSign, Edit, ExternalLink,
  ImageIcon, MapPin, ShieldCheck, Sparkles, UserCircle2
} from 'lucide-react'
import { EventsMap } from '@/components/features/events/events-map'
import { EventShareButton } from '@/components/features/events/event-share-button'
import { formatDateTime } from '@/lib/utils'
import type { EventWithRelations } from '@/types/event'

type EventDetailProps = {
  event: EventWithRelations
}

export function EventDetail({ event }: EventDetailProps) {
  const mapQuery = encodeURIComponent(event.address ?? event.location)
  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  return (
    <article className="space-y-0">

      {/* ── Hero full-bleed ── */}
      <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-accent sm:h-[420px]">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 90vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent">
            <ImageIcon className="h-20 w-20 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Badges over hero */}
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
            {event.category.icon ?? '🎟️'} {event.category.name}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" /> Aprobado
          </span>
          {event.featured && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-sm font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" /> Destacado
            </span>
          )}
        </div>

        {/* Title over hero bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <h1 className="text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-2 line-clamp-2 text-sm text-white/75 sm:text-base">
            {event.description}
          </p>
        </div>
      </div>

      {/* ── 2-column body ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">

        {/* LEFT: content */}
        <div className="space-y-5">

          {/* Quick meta row */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Inicio</p>
                <p className="text-sm font-semibold text-foreground">{formatDateTime(event.startDate)}</p>
              </div>
            </div>
            {event.endDate && (
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
                <Clock3 className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Fin</p>
                  <p className="text-sm font-semibold text-foreground">{formatDateTime(event.endDate)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-rose-500" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Lugar</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  {event.address ?? event.location}
                </a>
              </div>
            </div>
            {event.price !== null && (
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
                <DollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Precio</p>
                  <p className="text-sm font-semibold text-foreground">
                    {event.price === 0 ? 'Gratis' : `$${event.price.toFixed(2)}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Content body */}
          {event.content && (
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-lg font-bold text-foreground">Detalles del evento</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {event.content}
              </p>
            </div>
          )}

          {/* Map */}
          {event.lat !== null && event.lng !== null && (
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
              <div className="border-b border-border/50 px-5 py-4">
                <h2 className="text-lg font-bold text-foreground">📍 Ubicación en el mapa</h2>
              </div>
              <EventsMap
                events={[{
                  id: event.id,
                  title: event.title,
                  slug: event.slug,
                  startDate: event.startDate,
                  location: event.location,
                  address: event.address,
                  lat: event.lat,
                  lng: event.lng,
                  category: { name: event.category.name },
                }]}
                mapboxToken={mapboxToken}
                mapStyle={mapStyle}
              />
            </div>
          )}
        </div>

        {/* RIGHT: sticky sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/eventos/${event.slug}/editar`}
              className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <Edit className="h-4 w-4" /> Editar
            </Link>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4" /> Cómo llegar
            </a>
            <EventShareButton title={event.title} />
          </div>

          {/* Info card */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Información</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de inicio</p>
                  <p className="text-sm font-semibold text-foreground">{formatDateTime(event.startDate)}</p>
                </div>
              </div>

              {event.endDate && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de fin</p>
                    <p className="text-sm font-semibold text-foreground">{formatDateTime(event.endDate)}</p>
                  </div>
                </div>
              )}

              {event.price !== null && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Precio</p>
                    <p className="text-sm font-semibold text-foreground">
                      {event.price === 0 ? 'Gratis' : `$${event.price.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-500">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Ubicación</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {event.address ?? event.location}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <UserCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Publicado por</p>
                  <p className="text-sm font-semibold text-foreground">
                    {event.user.name ?? event.user.email ?? 'Usuario'}
                  </p>
                </div>
              </div>

              {event.venue && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Local asociado</p>
                    <Link
                      href={`/locales/${event.venue.slug}`}
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-500"
                    >
                      {event.venue.name}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category pill */}
          <Link
            href={`/explorar?q=${encodeURIComponent(event.category.name)}`}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:bg-accent"
          >
            <span className="text-3xl">{event.category.icon ?? '🎟️'}</span>
            <div>
              <p className="text-xs text-muted-foreground">Categoría</p>
              <p className="text-sm font-bold text-foreground">{event.category.name}</p>
            </div>
          </Link>
        </aside>
      </div>
    </article>
  )
}
