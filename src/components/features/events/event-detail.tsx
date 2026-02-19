import Image from 'next/image'
import Link from 'next/link'
import { Building2, CalendarDays, Clock3, Edit, ImageIcon, MapPin, ShieldCheck, Sparkles, UserCircle2 } from 'lucide-react'
import { EventsMap } from '@/components/features/events/events-map'
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
    <article className="space-y-4">
      {/* Hero image */}
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-border/60 bg-accent sm:h-80">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-accent to-secondary">
            <ImageIcon className="h-16 w-16 text-muted-foreground/25" />
            <span className="mt-3 text-sm text-muted-foreground/40">Sin imagen</span>
          </div>
        )}
        {event.featured ? (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Destacado
          </span>
        ) : null}
      </div>

      {/* Main info card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
            {event.category.icon ?? '📍'} {event.category.name}
          </span>
          <span className="badge-emerald">
            <ShieldCheck className="h-3 w-3" /> Aprobado
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            {event.title}
          </h1>
          <Link
            href={`/eventos/${event.slug}/editar`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
          >
            <Edit className="h-3 w-3" />
            Editar
          </Link>
        </div>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{event.description}</p>

        <div className="mt-6 grid gap-3 border-t border-border/50 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Inicio</p>
              <p className="font-medium text-foreground">{formatDateTime(event.startDate)}</p>
            </div>
          </div>

          {event.endDate ? (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <Clock3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Fin</p>
                <p className="font-medium text-foreground">{formatDateTime(event.endDate)}</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-coral-subtle text-coral">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Ubicación</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline decoration-dotted underline-offset-4 hover:text-primary"
              >
                {event.address ?? event.location}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <UserCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Publicado por</p>
              <p className="font-medium text-foreground">{event.user.name ?? event.user.email ?? 'Usuario'}</p>
            </div>
          </div>

          {event.venue ? (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground sm:col-span-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-subtle text-emerald">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Local asociado</p>
                <Link
                  href={`/locales/${event.venue.slug}`}
                  className="font-medium text-emerald underline decoration-dotted underline-offset-4 hover:text-emerald/80"
                >
                  {event.venue.name}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      {event.content ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <h2 className="text-base font-semibold text-foreground">Detalles del evento</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{event.content}</p>
        </div>
      ) : null}

      {/* Map */}
      {event.lat !== null && event.lng !== null ? (
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Ubicación en mapa</h2>
          <EventsMap
            events={[
              {
                id: event.id,
                title: event.title,
                slug: event.slug,
                startDate: event.startDate,
                location: event.location,
                address: event.address,
                lat: event.lat,
                lng: event.lng,
                category: { name: event.category.name },
              },
            ]}
            mapboxToken={mapboxToken}
            mapStyle={mapStyle}
          />
        </div>
      ) : null}
    </article>
  )
}
