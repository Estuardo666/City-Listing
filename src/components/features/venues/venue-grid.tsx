import { VenueCard } from '@/components/features/venues/venue-card'
import type { VenueListItem } from '@/types/venue'

type VenueGridProps = {
  venues: VenueListItem[]
}

export function VenueGrid({ venues }: VenueGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  )
}
