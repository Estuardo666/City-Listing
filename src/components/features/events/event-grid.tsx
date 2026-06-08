import { EventCard } from '@/components/features/events/event-card'
import type { EventListItem } from '@/types/event'

type EventGridProps = {
  events: EventListItem[]
}

export function EventGrid({ events }: EventGridProps) {
  return (
    <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
