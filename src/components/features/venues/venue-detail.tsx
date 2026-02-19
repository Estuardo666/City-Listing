import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Edit, Globe, ImageIcon, MapPin, Phone, ShieldCheck, Sparkles, Store, UserCircle2 } from 'lucide-react'
import { VenuesMap } from '@/components/features/venues/venues-map'
import { formatDateTime } from '@/lib/utils'
import type { VenueWithRelations } from '@/types/venue'

type VenueDetailProps = {
  venue: VenueWithRelations
}

export function VenueDetail({ venue }: VenueDetailProps) {
  const mapQuery = encodeURIComponent(venue.address ?? venue.location)
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
        {venue.image ? (
          <Image
            src={venue.image}
            alt={venue.name}
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
        {venue.featured ? (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Destacado
          </span>
        ) : null}
      </div>

      {/* Main info card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
            {venue.category.icon ?? '🏬'} {venue.category.name}
          </span>
          <span className="badge-emerald">
            <ShieldCheck className="h-3 w-3" /> Verificado
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            {venue.name}
          </h1>
          <Link
            href={`/locales/${venue.slug}/editar`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
          >
            <Edit className="h-3 w-3" />
            Editar
          </Link>
        </div>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{venue.description}</p>

        <div className="mt-6 grid gap-3 border-t border-border/50 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-coral-subtle text-coral">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Dirección</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-foreground underline decoration-dotted underline-offset-4 hover:text-primary"
              >
                {venue.address ?? venue.location}
              </a>
            </div>
          </div>

          {venue.phone ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <Phone className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Teléfono</p>
                <p className="text-sm font-medium text-foreground">{venue.phone}</p>
              </div>
            </div>
          ) : null}

          {venue.website ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <Globe className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Sitio web</p>
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary underline decoration-dotted underline-offset-4 hover:text-primary/80"
                >
                  {venue.website}
                </a>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <UserCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">Publicado por</p>
              <p className="text-sm font-medium text-foreground">{venue.user.name ?? venue.user.email ?? 'Usuario'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {venue.content ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <h2 className="text-base font-semibold text-foreground">Sobre este local</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{venue.content}</p>
        </div>
      ) : null}

      {/* Upcoming events */}
      {venue.events.length > 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Store className="h-4 w-4 text-coral" />
            Próximos eventos aquí
          </h2>
          <ul className="mt-4 space-y-2">
            {venue.events.map((event) => (
              <li
                key={event.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/30 p-3.5 transition-colors hover:border-primary/20 hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {formatDateTime(event.startDate)}
                  </p>
                </div>
                <Link
                  href={`/eventos/${event.slug}`}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Ver <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Map */}
      {venue.lat !== null && venue.lng !== null ? (
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Ubicación en mapa</h2>
          <VenuesMap
            venues={[
              {
                id: venue.id,
                name: venue.name,
                slug: venue.slug,
                location: venue.location,
                address: venue.address,
                lat: venue.lat,
                lng: venue.lng,
                category: { name: venue.category.name },
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
