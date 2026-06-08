import { RankingCard } from './ranking-card'
import type { RankedVenue } from '@/lib/rankings'

type RankingListProps = {
  venues: RankedVenue[]
  title: string
  subtitle?: string
}

export function RankingList({ venues, title, subtitle }: RankingListProps) {
  if (venues.length === 0) return null

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="space-y-3">
        {venues.map((venue, index) => (
          <RankingCard key={venue.id} venue={venue} position={index + 1} />
        ))}
      </div>
    </section>
  )
}
