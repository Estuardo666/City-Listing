'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Building2, CalendarDays, Clock3, DollarSign, Edit, ExternalLink, Info, LogIn,
  ImageIcon, MapPin, Map, Repeat, ShieldCheck, Sparkles, Star, UserCircle2
} from 'lucide-react'
import { EventsMap } from '@/components/features/events/events-map'
import { MediaGallery } from '@/components/media/media-gallery'
import { ReviewForm } from '@/components/review/review-form'
import { ReviewList } from '@/components/review/review-list'
import { ShareButton } from '@/components/share/share-button'
import { WhatsAppButton } from '@/components/venues/whatsapp-button'
import { UberIcon } from '@/components/ui/uber-icon'
import { generateUberLink } from '@/lib/transport/uber-link'
import { CategoryGradientBg } from '@/components/ui/category-gradient-bg'
import { resolveIconEmoji } from '@/components/features/explore/explore-map-panel'
import { formatDateTime } from '@/lib/utils'
import type { EventWithRelations } from '@/types/event'

type EventDetailProps = {
  event: EventWithRelations
  currentUserId?: string
  userRole?: string
}

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  DAILY: 'Diario',
  YEARLY: 'Anual',
}

export function EventDetail({ event, currentUserId, userRole }: EventDetailProps) {
  const canEdit = currentUserId && (userRole === 'ADMIN' || currentUserId === event.userId)
  const [imageError, setImageError] = useState(false)
  const mapQuery = encodeURIComponent(event.address ?? event.location)
  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const hasMedia = event.media.length > 0
  const hasReviews = event.reviews.length > 0
  const hasRecurrence = event.isRecurring && event.recurrenceRule

  return (
    <article className="space-y-0">

      {/* ── Hero full-bleed ── */}
      <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-accent sm:h-[420px] mb-6">
        {event.image && !imageError ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 90vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <CategoryGradientBg
            categorySlug={event.eventCategories[0]?.category.slug}
            name={event.title}
            showInitials
            className="h-full w-full"
            initialsClassName="text-6xl sm:text-8xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Badges over hero */}
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
            {resolveIconEmoji(event.eventCategories[0]?.category.icon, 'event')} {event.eventCategories[0]?.category.name}
          </span>
          {event.featured && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-sm font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" /> Destacado
            </span>
          )}
          {hasRecurrence && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/90 px-3 py-1 text-sm font-semibold text-white">
              <Repeat className="h-3.5 w-3.5" /> Recurrente
            </span>
          )}
        </div>

        {/* Title over hero bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <h1 className="font-medium leading-tight text-white drop-shadow-sm" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.7rem)' }}>
            {event.title}
          </h1>
          <p className="mt-2 line-clamp-2 text-sm text-white/75 sm:text-base">
            {event.description}
          </p>
          {/* Rating in hero */}
          {event.avgRating !== null && event.reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(event.avgRating ?? 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-white/30 text-white/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-white/90">
                {(event.avgRating ?? 0).toFixed(1)}
              </span>
              <span className="text-xs text-white/60">
                ({event.reviewCount} {event.reviewCount === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Media Gallery ── */}
      {hasMedia && (
        <div className="mt-0">
          <MediaGallery media={event.media} />
        </div>
      )}

      {/* ── 2-column body ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">

        {/* LEFT: content */}
        <div className="space-y-5">

          {/* Quick meta row */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Inicio</p>
                <p className="text-sm font-semibold text-foreground" suppressHydrationWarning>{formatDateTime(event.startDate)}</p>
              </div>
            </div>
            {event.endDate && (
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Fin</p>
                  <p className="text-sm font-semibold text-foreground" suppressHydrationWarning>{formatDateTime(event.endDate)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
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
              <h2 className="text-lg font-medium text-foreground">Detalles del evento</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {event.content}
              </p>
            </div>
          )}

          {/* Recurrence info */}
          {hasRecurrence && event.recurrenceRule && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2"><Repeat className="h-5 w-5 text-primary" /> Evento recurrente</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Se repite {RECURRENCE_LABELS[event.recurrenceRule.frequency]?.toLowerCase() ?? event.recurrenceRule.frequency}
                {event.recurrenceRule.interval > 1 && ` cada ${event.recurrenceRule.interval} ${event.recurrenceRule.frequency === 'WEEKLY' ? 'semanas' : 'meses'}`}
              </p>
            </div>
          )}

          {/* Reviews */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> Reseñas {hasReviews && `(${event.reviews.length})`}
            </h2>
            {currentUserId ? (
              currentUserId !== event.userId && (
                <div className="mt-4 border-b border-border/50 pb-4">
                  <h3 className="text-sm font-medium mb-3">Deja tu reseña</h3>
                  <ReviewForm entityType="event" entityId={event.id} />
                </div>
              )
            ) : (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <LogIn className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Inicia sesión para dejar una reseña</p>
                  <p className="text-xs text-muted-foreground">Necesitas estar conectado para poder reseñar.</p>
                </div>
                <Link
                  href="/api/auth/signin"
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Entrar
                </Link>
              </div>
            )}
            <div className="mt-4">
              <ReviewList
                reviews={event.reviews}
                currentUserId={currentUserId}
                entityOwnerId={event.userId}
              />
            </div>
          </div>

          {/* Map */}
          {event.lat !== null && event.lng !== null && (
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
              <div className="border-b border-border/50 px-5 py-4">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-2"><Map className="h-5 w-5 text-primary" /> Ubicación en el mapa</h2>
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
                  eventCategories: [{ category: { name: event.eventCategories[0]?.category.name ?? '' } }],
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
            {canEdit && (
              <Link
                href={`/eventos/${event.slug}/editar`}
                className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <Edit className="h-4 w-4" /> Editar
              </Link>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4" /> Cómo llegar
            </a>
            <ShareButton url={`/eventos/${event.slug}`} title={event.title} className="flex-1 min-w-[140px]" />
          </div>

          {/* WhatsApp CTA */}
          {event.venue?.phone && (
            <WhatsAppButton
              phone={event.venue.phone}
              venueName={event.title}
            />
          )}

          {/* Uber */}
          {event.lat !== null && event.lng !== null && (
            <a
              href={generateUberLink({ latitude: event.lat, longitude: event.lng })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ir con Uber a ${event.title}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <UberIcon size={18} className="text-white" />
              Ir con Uber
            </a>
          )}

          {/* Info card */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Información</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de inicio</p>
                  <p className="text-sm font-semibold text-foreground" suppressHydrationWarning>{formatDateTime(event.startDate)}</p>
                </div>
              </div>

              {event.endDate && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de fin</p>
                    <p className="text-sm font-semibold text-foreground" suppressHydrationWarning>{formatDateTime(event.endDate)}</p>
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

              {event.user.role !== 'ADMIN' && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Publicado por</p>
                    <p className="text-sm font-semibold text-foreground">
                      {event.user.name ?? event.user.email ?? 'Usuario'}
                    </p>
                  </div>
                </div>
              )}

              {event.venue && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Local asociado</p>
                    <Link
                      href={`/locales/${event.venue.slug}`}
                      className="text-sm font-semibold text-primary hover:text-primary/80"
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
            href={`/explorar?q=${encodeURIComponent(event.eventCategories[0]?.category.name ?? '')}`}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:bg-accent"
          >
            <span className="text-3xl">{resolveIconEmoji(event.eventCategories[0]?.category.icon, 'event')}</span>
            <div>
              <p className="text-xs text-muted-foreground">Categoría</p>
              <p className="text-sm font-medium text-foreground">{event.eventCategories[0]?.category.name}</p>
            </div>
          </Link>
        </aside>
      </div>
    </article>
  )
}
