import { getVenues } from '@/lib/queries/venues'
import { getEvents } from '@/lib/queries/events'
import { HomePromoGrid } from './home-promo-grid'
import type { ExploreEvent, ExploreVenue } from '@/types/explore'

export async function HomePromoGridSection() {
  const [venueList, eventList] = await Promise.all([
    getVenues({ status: 'APPROVED' }, 80),
    getEvents({ status: 'APPROVED' }, 80),
  ])
  
  const formattedVenues: ExploreVenue[] = venueList.map((venue) => ({
    id: venue.id,
    name: venue.name,
    slug: venue.slug,
    description: venue.description,
    image: venue.image,
    location: venue.location,
    address: venue.address,
    lat: venue.lat ?? null,
    lng: venue.lng ?? null,
    featured: venue.featured,
    phone: venue.phone,
    website: venue.website,
    category: venue.category,
  }))
  
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
    category: event.category,
  }))
  
  return <HomePromoGrid venues={formattedVenues} events={formattedEvents} />
}
