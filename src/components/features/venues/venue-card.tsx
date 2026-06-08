'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Globe, ImageIcon, MapPin, Phone, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { CategoryGradientBg } from '@/components/ui/category-gradient-bg'
import { resolveIconEmoji } from '@/components/features/explore/explore-map-panel'
import type { VenueListItem } from '@/types/venue'
import { useState } from 'react'

type VenueCardProps = {
  venue: VenueListItem
}

export function VenueCard({ venue }: VenueCardProps) {
  const [imageError, setImageError] = useState(false)
  const hasValidImage = Boolean(venue.image && venue.image.startsWith('http'))

  return (
    <Link
      href={`/locales/${venue.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-emerald/30 active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-accent">
        {hasValidImage && !imageError ? (
          <Image
            src={venue.image!}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <CategoryGradientBg
            categorySlug={venue.category.slug}
            name={venue.name}
            showInitials
            className="h-full w-full"
            initialsClassName="text-3xl"
          />
        )}
        <div className="absolute right-3 top-3 flex flex-wrap gap-1.5">
          {venue.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <Sparkles className="h-3 w-3" /> Destacado
            </span>
          )}
          {venue.badge === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <ShieldCheck className="h-3 w-3" />
            </span>
          )}
        </div>
        {venue.priceRange && (
          <span className="absolute left-3 bottom-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {venue.priceRange}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {resolveIconEmoji(venue.category.icon, 'venue')} {venue.category.name}
        </span>

        <h3 className="mt-3 text-[1.38rem] font-medium leading-snug text-foreground transition-colors duration-150 group-hover:text-emerald">
          {venue.name}
        </h3>

        {/* Rating */}
        {venue.avgRating !== null && venue.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(venue.avgRating ?? 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {(venue.avgRating ?? 0).toFixed(1)} ({venue.reviewCount})
            </span>
          </div>
        )}

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {venue.description}
        </p>

        <div className="mt-4 space-y-1.5 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-coral/70" />
            <span className="truncate">{venue.address ?? venue.location}</span>
          </p>
          {venue.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span>{venue.phone}</span>
            </p>
          ) : null}
          {venue.website ? (
            <p className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{venue.website}</span>
            </p>
          ) : null}
        </div>

        {venue.verified && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verificado
          </div>
        )}
      </div>
    </Link>
  )
}
