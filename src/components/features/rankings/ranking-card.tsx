'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Phone } from 'lucide-react'
import { VenueBadges } from './venue-badge'
import type { RankedVenue } from '@/lib/rankings'
import { useState } from 'react'

type RankingCardProps = {
  venue: RankedVenue
  position: number
}

export function RankingCard({ venue, position }: RankingCardProps) {
  const [imageError, setImageError] = useState(false)
  const hasValidImage = Boolean(venue.image && venue.image.startsWith('http'))

  const positionColors =
    position <= 3
      ? ['bg-amber-400 text-white', 'bg-gray-300 text-gray-800', 'bg-amber-600 text-white']
      : []

  const positionColor =
    position <= 3 ? positionColors[position - 1] : 'bg-accent text-foreground'

  return (
    <Link
      href={`/locales/${venue.slug}`}
      className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald/30 sm:gap-5 sm:p-5"
    >
      {/* Posicion */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${positionColor}`}
      >
        {position}
      </div>

      {/* Imagen */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-accent sm:h-24 sm:w-24">
        {hasValidImage && !imageError ? (
          <Image
            src={venue.image!}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="96px"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald/20 to-coral/20">
            <span className="text-2xl font-bold text-foreground/30">
              {venue.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-foreground transition-colors group-hover:text-emerald">
          {venue.name}
        </h3>

        {/* Rating */}
        <div className="mt-1 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(venue.avgRating ?? 0)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">
            {(venue.avgRating ?? 0).toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({venue.reviewCount} resenas)
          </span>
        </div>

        {/* Badges */}
        {venue.badges.length > 0 && (
          <div className="mt-2">
            <VenueBadges badges={venue.badges} />
          </div>
        )}

        {/* Info */}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {venue.address && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0 text-coral/70" />
              <span className="truncate">{venue.address}</span>
            </p>
          )}
          {venue.phone && (
            <p className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              <span>{venue.phone}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
