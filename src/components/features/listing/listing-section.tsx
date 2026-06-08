'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { VenueCard } from '@/components/features/venues/venue-card'
import { EventCard } from '@/components/features/events/event-card'
import type { VenueListItem } from '@/types/venue'
import type { EventListItem } from '@/types/event'
import type { VenueBadgeType } from '@/lib/rankings'

type ListingSectionProps = {
  title: string
  icon: React.ReactNode
  preTitle?: string
  items: VenueListItem[] | EventListItem[]
  type: 'venues' | 'events'
  enableLoadMore?: boolean
  initialSkip?: number
  take?: number
  sort?: string
  featured?: boolean
  minRating?: number
  hasPromotions?: boolean
  venueBadges?: Record<string, VenueBadgeType[]>
}

export function ListingSection({
  title,
  icon,
  preTitle,
  items: initialItems,
  type,
  enableLoadMore = false,
  initialSkip = 0,
  take = 12,
  sort = 'recent',
  featured,
  minRating,
  hasPromotions,
  venueBadges,
}: ListingSectionProps) {
  const [items, setItems] = useState<VenueListItem[] | EventListItem[]>(initialItems)
  const [skip, setSkip] = useState(initialSkip)
  const [hasMore, setHasMore] = useState(enableLoadMore && initialItems.length >= take)
  const [loadingMore, setLoadingMore] = useState(false)

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        skip: String(skip),
        take: String(take),
        sort,
        status: 'APPROVED',
      })
      if (featured) params.set('featured', 'true')
      if (minRating) params.set('minRating', String(minRating))
      if (hasPromotions) params.set('hasPromotions', 'true')

      const endpoint = type === 'venues' ? '/api/venues/search' : '/api/events/search'
      const res = await fetch(`${endpoint}?${params}`)
      const data = await res.json()
      const newItems = data.venues ?? data.events ?? []

      setItems((prev) => [...prev, ...newItems])
      setSkip((prev) => prev + newItems.length)
      setHasMore(newItems.length >= take)
    } catch {
      // keep previous state
    } finally {
      setLoadingMore(false)
    }
  }

  if (items.length === 0) return null

  return (
    <section className="space-y-5">
      {preTitle && (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {preTitle}
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {type === 'venues'
          ? (items as VenueListItem[]).map((v) => (
              <VenueCard key={v.id} venue={v} badges={venueBadges?.[v.id]} />
            ))
          : (items as EventListItem[]).map((e) => <EventCard key={e.id} event={e} />)}
      </div>

      {enableLoadMore && hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              'Cargar mas'
            )}
          </button>
        </div>
      )}
    </section>
  )
}
