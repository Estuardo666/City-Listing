'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { EventGridAnimated } from './event-grid-animated'
import { EventEmptyState } from './event-empty-state'
import type { EventListItem } from '@/types/event'
import { Skeleton } from '../../ui/skeleton'

type EventContentProps = {
  initialEvents: EventListItem[]
  hasFilters: boolean
}

export function EventContent({ initialEvents, hasFilters }: EventContentProps) {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState(initialEvents)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      const params = new URLSearchParams(searchParams)
      
      try {
        const response = await fetch(`/api/events/search?${params.toString()}`)
        const data = await response.json()
        setEvents(data.events || [])
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents(initialEvents)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [searchParams, initialEvents])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return <EventEmptyState hasFilters={hasFilters} />
  }

  return <EventGridAnimated events={events} />
}
