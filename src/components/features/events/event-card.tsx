'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, MapPin, Repeat, Sparkles, Star } from 'lucide-react'
import { CategoryGradientBg } from '@/components/ui/category-gradient-bg'
import { resolveIconEmoji } from '@/components/features/explore/explore-map-panel'
import { formatDateTime } from '@/lib/utils'
import type { EventListItem } from '@/types/event'

type EventCardProps = {
  event: EventListItem
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function EventCard({ event }: EventCardProps) {
  const hasValidImage = Boolean(event.image && isValidHttpUrl(event.image))
  const [imageError, setImageError] = useState(false)

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-accent">
        {hasValidImage && !imageError ? (
          <Image
            src={event.image as string}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <CategoryGradientBg
            categorySlug={event.eventCategories[0]?.category.slug}
            name={event.title}
            showInitials
            className="h-full w-full"
            initialsClassName="text-3xl"
          />
        )}
        <div className="absolute right-3 top-3 flex flex-wrap gap-1.5">
          {event.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <Sparkles className="h-3 w-3" /> Destacado
            </span>
          )}
          {event.isRecurring && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <Repeat className="h-3 w-3" /> Recurrente
            </span>
          )}
        </div>
        {event.price !== null && event.price !== undefined && (
          <span className="absolute left-3 bottom-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {event.price === 0 ? 'Gratis' : `$${event.price.toFixed(2)}`}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {resolveIconEmoji(event.eventCategories[0]?.category.icon, 'event')} {event.eventCategories[0]?.category.name}
        </span>

        <h3 className="mt-3 text-[1.38rem] font-medium leading-snug text-foreground transition-colors duration-150 group-hover:text-primary">
          {event.title}
        </h3>

        {/* Rating */}
        {event.avgRating !== null && event.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(event.avgRating ?? 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {(event.avgRating ?? 0).toFixed(1)} ({event.reviewCount})
            </span>
          </div>
        )}

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>

        <div className="mt-4 space-y-1.5 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span suppressHydrationWarning>{formatDateTime(event.startDate)}</span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-coral/70" />
            <span className="truncate">{event.address ?? event.location}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
