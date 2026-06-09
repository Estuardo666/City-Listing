'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays, Edit, ExternalLink, Globe, Info, Link2, LogIn,
  ImageIcon, MapPin, Phone, ShieldCheck, Sparkles, Star, Tag, Ticket, UserCircle2, DollarSign, Clock, Map
} from 'lucide-react'
import { resolveIconEmoji } from '@/components/features/explore/explore-map-panel'
import { MediaGallery } from '@/components/media/media-gallery'
import { LocationHoursSection } from '@/components/features/venues/location-hours-section'
import { AmenitiesSection } from '@/components/features/venues/amenities-section'
import { ProductsDisplay } from '@/components/features/venues/products-display'
import { MenuDisplayV2 } from '@/components/menu/menu-display-v2'
import { ReviewForm } from '@/components/review/review-form'
import { ReviewList } from '@/components/review/review-list'
import { PromotionCard } from '@/components/promotion/promotion-card'
import { ReservationForm } from '@/components/reservation/reservation-form'
import { ShareButton } from '@/components/share/share-button'
import { CheckInButton } from '@/components/checkin/checkin-button'
import { WhatsAppButton } from '@/components/venues/whatsapp-button'
import { MessageVenueButton } from '@/components/messaging/message-venue-button'
import { AddToCollectionButton } from '@/components/collections/add-to-collection-button'
import { UberIcon } from '@/components/ui/uber-icon'
import { generateUberLink } from '@/lib/transport/uber-link'
import { formatDateTime } from '@/lib/utils'
import { GASTRONOMIC_CATEGORY_SLUGS } from '@/lib/constants/services'
import type { VenueWithRelations } from '@/types/venue'
import { useState } from 'react'

type MenuItem = { id: string; name: string; description: string | null; price: number | null; image: string | null; isAvailable: boolean; isFeatured: boolean }
type MenuCategory = { id: string; name: string; items: MenuItem[] }

type UserCollection = { id: string; name: string; icon: string | null; _count: { items: number } }

type VenueDetailProps = {
  venue: VenueWithRelations
  currentUserId?: string
  userRole?: string
  menu?: MenuCategory[]
  userCollections?: UserCollection[]
}

export function VenueDetail({ venue, currentUserId, userRole, menu = [], userCollections = [] }: VenueDetailProps) {
  const canEdit = currentUserId && (userRole === 'ADMIN' || currentUserId === venue.userId)
  const [imageError, setImageError] = useState(false)
  
  const mapQuery = encodeURIComponent(venue.address ?? venue.location)
  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const hasServices = venue.services.filter((s) => s.isActive).length > 0
  const hasMedia = venue.media.length > 0
  const hasReviews = venue.reviews.length > 0
  const hasPromotions = venue.promotions.length > 0
  const hasProducts = venue.products.length > 0
  const acceptsReservations = venue.reservationSettings?.acceptsReservations ?? false
  const isGastronomic = venue.venueCategories.some((vc) => GASTRONOMIC_CATEGORY_SLUGS.includes(vc.category.slug))

  return (
    <article className="space-y-0">

      {/* ── Hero full-bleed ── */}
      {venue.image && !imageError ? (
        <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-accent sm:h-[420px] mb-6">
          <Image
            src={venue.image}
            alt={venue.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 90vw"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
              {resolveIconEmoji(venue.venueCategories[0]?.category.icon, 'venue')} {venue.venueCategories[0]?.category.name}
            </span>
            {venue.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300 backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5" /> Verificado
              </span>
            )}
            {venue.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-sm font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" /> Destacado
              </span>
            )}
            {venue.priceRange && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-sm font-medium text-emerald-300 backdrop-blur-md">
                <DollarSign className="h-3.5 w-3.5" /> {venue.priceRange}
              </span>
            )}
          </div>

          {/* Title over hero bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <h1 className="font-medium leading-tight text-white drop-shadow-sm" style={{ fontSize: 'clamp(2.16rem, 6vw, 3.24rem)' }}>
              {venue.name}
            </h1>
            <p className="mt-2 line-clamp-2 text-sm text-white/75 sm:text-base">
              {venue.description}
            </p>
            {/* Rating in hero */}
            {venue.avgRating !== null && venue.reviewCount > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(venue.avgRating ?? 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-white/30 text-white/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-white/90">
                  {(venue.avgRating ?? 0).toFixed(1)}
                </span>
                <span className="text-xs text-white/60">
                  ({venue.reviewCount} {venue.reviewCount === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-accent px-3 py-1 text-sm font-semibold text-foreground">
              {resolveIconEmoji(venue.venueCategories[0]?.category.icon, 'venue')} {venue.venueCategories[0]?.category.name}
            </span>
            {venue.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Verificado
              </span>
            )}
            {venue.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-sm font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" /> Destacado
              </span>
            )}
            {venue.priceRange && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-accent px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-3.5 w-3.5" /> {venue.priceRange}
              </span>
            )}
          </div>
          <h1 className="font-medium leading-tight text-foreground" style={{ fontSize: 'clamp(2.16rem, 6vw, 3.24rem)' }}>
            {venue.name}
          </h1>
          {venue.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground sm:text-base">
              {venue.description}
            </p>
          )}
          {venue.avgRating !== null && venue.reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(venue.avgRating ?? 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted-foreground/30 text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">
                {(venue.avgRating ?? 0).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({venue.reviewCount} {venue.reviewCount === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Media Gallery ── */}
      {hasMedia && (
        <div className="mt-0">
          <MediaGallery media={venue.media} />
        </div>
      )}

      {/* ── 2-column body ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">

        {/* LEFT: content */}
        <div className="space-y-5">

          {/* Quick meta pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-semibold text-foreground">{venue.phone}</p>
                </div>
              </div>
            )}
            {venue.website && (
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Web</p>
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-semibold text-primary hover:text-primary/80"
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
              <h2 className="text-lg font-medium text-foreground">Sobre este local</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {venue.content}
              </p>
            </div>
          )}

          {/* Location & Hours */}
          <LocationHoursSection
            venue={venue}
            businessHours={venue.businessHours}
            operatingHours={venue.operatingHours}
            mapboxToken={mapboxToken}
            mapStyle={mapStyle}
          />

          {/* Amenities and more */}
          {hasServices && (
            <AmenitiesSection services={venue.services} />
          )}

          {/* Menu (restaurants only) */}
          {isGastronomic && menu.length > 0 && <MenuDisplayV2 menu={menu} />}

          {/* Products (all businesses) */}
          {hasProducts && <ProductsDisplay products={venue.products} />}

          {/* Promotions */}
          {hasPromotions && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Ofertas activas</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {venue.promotions.map((promo) => (
                  <PromotionCard key={promo.id} promotion={promo} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming events as cards */}
          {venue.events.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Próximos eventos aquí</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {venue.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.slug}`}
                    className="group flex gap-3 rounded-xl border border-border/50 bg-background p-3 transition-all hover:border-primary/30 hover:bg-accent/40"
                  >
                    <div className="flex min-w-0 flex-col justify-center gap-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{event.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground" suppressHydrationWarning>
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        {formatDateTime(event.startDate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews (at the end) */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> Reseñas {hasReviews && `(${venue.reviews.length})`}
            </h2>
            {currentUserId ? (
              currentUserId !== venue.userId && (
                <div className="mt-4 border-b border-border/50 pb-4">
                  <h3 className="text-sm font-medium mb-3">Deja tu reseña</h3>
                  <ReviewForm entityType="venue" entityId={venue.id} />
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
                reviews={venue.reviews}
                currentUserId={currentUserId}
                entityOwnerId={venue.userId}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: sticky sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">

          {/* Actions */}
          <div className="flex gap-2">
            {canEdit && (
              <Link
                href={`/locales/${venue.slug}/editar`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <Edit className="h-4 w-4" /> Editar
              </Link>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4" /> Cómo llegar
            </a>
            <ShareButton url={`/locales/${venue.slug}`} title={venue.name} className="flex-1" />
          </div>

          {/* Add to Collection */}
          {currentUserId && userCollections.length > 0 && (
            <AddToCollectionButton
              collections={userCollections}
              entityId={venue.id}
              entityType="venueId"
            />
          )}

          {/* WhatsApp CTA */}
          {venue.phone && (
            <WhatsAppButton
              phone={venue.phone}
              venueName={venue.name}
              hasMenu={menu.length > 0}
              acceptsReservations={acceptsReservations}
            />
          )}

          {/* Uber */}
          {venue.lat !== null && venue.lng !== null && (
            <a
              href={generateUberLink({ latitude: venue.lat, longitude: venue.lng })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ir con Uber a ${venue.name}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <UberIcon size={18} className="text-white" />
              Ir con Uber
            </a>
          )}

          {/* Message Venue Button */}
          <MessageVenueButton
            venueId={venue.id}
            venueOwnerId={venue.userId}
            venueName={venue.name}
            currentUserId={currentUserId}
          />

          {/* Reservation */}
          {acceptsReservations && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">Reservar</h3>
              <ReservationForm venueId={venue.id} />
            </div>
          )}

          {/* Check-in */}
          {venue.lat !== null && venue.lng !== null && currentUserId && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">Check-in</h3>
              <CheckInButton
                venueId={venue.id}
                venueName={venue.name}
                venueLat={venue.lat}
                venueLng={venue.lng}
              />
            </div>
          )}

          {/* Info card */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Información</h3>
            <div className="space-y-3">

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Sitio web</p>
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-semibold text-primary hover:text-primary/80"
                    >
                      {venue.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              {venue.priceRange && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Rango de precios</p>
                    <p className="text-sm font-semibold text-foreground">{venue.priceRange}</p>
                  </div>
                </div>
              )}

              {venue.user.role !== 'ADMIN' && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Publicado por</p>
                    <p className="text-sm font-semibold text-foreground">
                      {venue.user.name ?? venue.user.email ?? 'Usuario'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category pill */}
          <Link
            href={`/explorar?q=${encodeURIComponent(venue.venueCategories[0]?.category.name ?? '')}`}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:bg-accent"
          >
            <span className="text-3xl">{resolveIconEmoji(venue.venueCategories[0]?.category.icon, 'venue')}</span>
            <div>
              <p className="text-xs text-muted-foreground">Categoría</p>
              <p className="text-sm font-medium text-foreground">{venue.venueCategories[0]?.category.name}</p>
            </div>
          </Link>
        </aside>
      </div>
    </article>
  )
}
