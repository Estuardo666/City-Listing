'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, ArrowRight } from 'lucide-react'
import type { EventListItem } from '@/types/event'
import { CategoryGradientBg } from '@/components/ui/category-gradient-bg'
import { resolveIconEmoji } from '@/components/features/explore/explore-map-panel'

type EventRelatedProps = {
  events: EventListItem[]
}

function formatDate(date: Date) {
  return date.toLocaleDateString('es-EC', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function RelatedEventCard({ event }: { event: EventListItem }) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative h-36 w-full overflow-hidden bg-accent">
        {event.image && !imageError ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {resolveIconEmoji(event.eventCategories[0]?.category.icon, 'event')} {event.eventCategories[0]?.category.name}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-3.5">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{event.title}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          {formatDate(event.startDate)}
        </div>
      </div>
    </Link>
  )
}

export function EventRelated({ events }: EventRelatedProps) {
  if (events.length === 0) return null

  return (
    <section className="space-y-5 border-t border-border/50 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🔥 También te puede gustar</p>
          <h2 className="mt-1 text-2xl font-medium text-foreground sm:text-3xl">Eventos relacionados</h2>
        </div>
        <Link
          href="/eventos"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver más <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {events.map((event) => (
          <RelatedEventCard key={event.id} event={event} />
        ))}
      </div>

      <div className="sm:hidden">
        <Link
          href="/eventos"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground"
        >
          Ver más eventos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
