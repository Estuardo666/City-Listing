'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { VenueGridAnimated } from './venue-grid-animated'
import { VenueEmptyState } from './venue-empty-state'
import type { VenueListItem } from '@/types/venue'
import { Skeleton } from '../../ui/skeleton'

type VenueContentProps = {
  initialVenues: VenueListItem[]
  hasFilters: boolean
}

export function VenueContent({ initialVenues, hasFilters }: VenueContentProps) {
  const searchParams = useSearchParams()
  const [venues, setVenues] = useState(initialVenues)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true)
      const params = new URLSearchParams(searchParams)
      
      try {
        const response = await fetch(`/api/venues/search?${params.toString()}`)
        const data = await response.json()
        setVenues(data.venues || [])
      } catch (error) {
        console.error('Error fetching venues:', error)
        setVenues(initialVenues)
      } finally {
        setLoading(false)
      }
    }

    fetchVenues()
  }, [searchParams, initialVenues])

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

  if (venues.length === 0) {
    return <VenueEmptyState hasFilters={hasFilters} />
  }

  return <VenueGridAnimated venues={venues} />
}
