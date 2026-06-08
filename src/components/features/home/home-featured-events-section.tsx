import { getEvents } from '@/lib/queries/events'
import { HomeFeaturedEvents } from './home-featured-events'
import type { ExploreEvent } from '@/types/explore'

export async function HomeFeaturedEventsSection() {
  const eventList = await getEvents({ status: 'APPROVED' }, 80)
  
  const formattedEvents: ExploreEvent[] = eventList.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    image: event.image,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    location: event.location,
    address: event.address,
    lat: event.lat ?? null,
    lng: event.lng ?? null,
    featured: event.featured,
    price: event.price ?? null,
    avgRating: event.avgRating ?? null,
    reviewCount: event.reviewCount ?? 0,
    categories: event.eventCategories.map((ec) => ec.category),
  }))
  
  return <HomeFeaturedEvents events={formattedEvents} />
}
