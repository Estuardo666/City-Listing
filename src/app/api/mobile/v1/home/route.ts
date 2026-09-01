import { getEvents } from '@/lib/queries/events'
import { getVenueCategories, getVenues } from '@/lib/queries/venues'
import { mobileSuccess } from '@/lib/mobile-response'

export async function GET() {
  const [venues, events, categories] = await Promise.all([
    getVenues({ status: 'APPROVED', featured: 'true' }, 12),
    getEvents({ status: 'APPROVED', featured: 'true' }, 12),
    getVenueCategories(),
  ])
  const mobileVenues = venues.map(({ venueCategories, ...venue }) => ({
    ...venue,
    categories: venueCategories.map(({ category }) => category),
  }))
  const mobileEvents = events.map(({ eventCategories, ...event }) => ({
    ...event,
    categories: eventCategories.map(({ category }) => category),
  }))
  return mobileSuccess({ venues: mobileVenues, events: mobileEvents, categories, pageInfo: { hasMoreVenues: false, hasMoreEvents: false, nextVenueSkip: venues.length, nextEventSkip: events.length } })
}
