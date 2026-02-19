import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays, Edit, ExternalLink, Globe,
  ImageIcon, MapPin, Phone, ShieldCheck, Sparkles, UserCircle2
} from 'lucide-react'
import { VenuesMap } from '@/components/features/venues/venues-map'
import { VenueShareButton } from '@/components/features/venues/venue-share-button'
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
    <article className="space-y-0">

      {/* ── Hero full-bleed ── */}
      <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-accent sm:h-[420px]">
        {venue.image ? (
          <Image
            src={venue.image}
            alt={venue.name}
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

        {/* Badges */}
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
            {venue.category.icon ?? '🏬'} {venue.category.name}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" /> Verificado
          </span>
          {venue.featured && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-sm font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" /> Destacado
            </span>
          )}
        </div>

        {/* Title over hero bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <h1 className="text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl">
            {venue.name}
          </h1>
          <p className="mt-2 line-clamp-2 text-sm text-white/75 sm:text-base">
            {venue.description}
          </p>
        </div>
      </div>

      {/* ── 2-column body ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">

        {/* LEFT: content */}
        <div className="space-y-5">

          {/* Quick meta pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-rose-500" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dirección</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  {venue.address ?? venue.location}
                </a>
              </div>
            </div>
            {venue.phone && (
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-semibold text-foreground">{venue.phone}</p>
                </div>
              </div>
            )}
            {venue.website && (
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
                <Globe className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Web</p>
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    {venue.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {venue.content && (
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-lg font-bold text-foreground">Sobre este local</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {venue.content}
              </p>
            </div>
          )}

          {/* Upcoming events as cards */}
          {venue.events.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <h2 className="text-lg font-bold text-foreground">🎉 Próximos eventos aquí</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {venue.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.slug}`}
                    className="group flex gap-3 rounded-xl border border-border/50 bg-background p-3 transition-all hover:border-primary/30 hover:bg-accent/40"
                  >
                    <div className="flex min-w-0 flex-col justify-center gap-1">
                      <p className="text-sm font-bold text-foreground line-clamp-1">{event.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        {formatDateTime(event.startDate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {venue.lat !== null && venue.lng !== null && (
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
              <div className="border-b border-border/50 px-5 py-4">
                <h2 className="text-lg font-bold text-foreground">📍 Ubicación en el mapa</h2>
              </div>
              <VenuesMap
                venues={[{
                  id: venue.id,
                  name: venue.name,
                  slug: venue.slug,
                  location: venue.location,
                  address: venue.address,
                  lat: venue.lat,
                  lng: venue.lng,
                  category: { name: venue.category.name },
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
          <div className="flex gap-2">
            <Link
              href={`/locales/${venue.slug}/editar`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <Edit className="h-4 w-4" /> Editar
            </Link>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4" /> Cómo llegar
            </a>
            <VenueShareButton name={venue.name} />
          </div>

          {/* Info card */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Información</h3>
            <div className="space-y-3">

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-500">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {venue.address ?? venue.location}
                  </a>
                </div>
              </div>

              {venue.phone && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-semibold text-foreground">{venue.phone}</p>
                  </div>
                </div>
              )}

              {venue.website && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Globe className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Sitio web</p>
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-primary hover:text-primary/80"
                    >
                      {venue.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <UserCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Publicado por</p>
                  <p className="text-sm font-semibold text-foreground">
                    {venue.user.name ?? venue.user.email ?? 'Usuario'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category pill */}
          <Link
            href={`/explorar?q=${encodeURIComponent(venue.category.name)}`}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:bg-accent"
          >
            <span className="text-3xl">{venue.category.icon ?? '🏬'}</span>
            <div>
              <p className="text-xs text-muted-foreground">Categoría</p>
              <p className="text-sm font-bold text-foreground">{venue.category.name}</p>
            </div>
          </Link>
        </aside>
      </div>
    </article>
  )
}
