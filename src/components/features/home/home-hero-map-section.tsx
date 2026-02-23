import { getVenues } from '@/lib/queries/venues'
import { getEvents } from '@/lib/queries/events'
import { HomeHeroMap } from './home-hero-map'
import type { ExploreEvent, ExploreVenue } from '@/types/explore'

async function getHeroData(limit: number) {
  const [venueList, eventList] = await Promise.all([
    getVenues({ status: 'APPROVED' }, limit),
    getEvents({ status: 'APPROVED' }, limit),
  ])

  const heroVenues: ExploreVenue[] = venueList.map((venue) => ({
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
    _type: 'venue' as const,
  }))

  const heroEvents: ExploreEvent[] = eventList.map((event) => ({
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
    _type: 'event' as const,
  }))

  return { heroVenues, heroEvents }
}

export async function HomeHeroMapSection() {
  const { heroVenues, heroEvents } = await getHeroData(80)
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  return (
    <HomeHeroMap
      venues={heroVenues}
      events={heroEvents}
      mapboxToken={mapboxToken}
      mapStyle={mapStyle}
    />
  )
}
