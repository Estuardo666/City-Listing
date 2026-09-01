import { getEvents } from '@/lib/queries/events'
import { getPosts } from '@/lib/queries/posts'
import { getVenueCategories, getVenues } from '@/lib/queries/venues'
import { mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

function mapVenues(venues: Awaited<ReturnType<typeof getVenues>>) {
  return venues.map(({ venueCategories, ...venue }) => ({
    ...venue,
    categories: venueCategories.map(({ category }) => category),
  }))
}

function mapEvents(events: Awaited<ReturnType<typeof getEvents>>) {
  return events.map(({ eventCategories, ...event }) => ({
    ...event,
    categories: eventCategories.map(({ category }) => category),
  }))
}

export async function GET() {
  const now = new Date()
  const [allVenues, allEvents, categories, featuredPosts, promotions] = await Promise.all([
    // One bounded query feeds the featured and latest sections without
    // changing the ordering used by the React source of truth.
    getVenues({ status: 'APPROVED' }, 80),
    getEvents({ status: 'APPROVED' }, 80),
    getVenueCategories(),
    getPosts({ status: 'APPROVED', featured: 'true' }, { take: 3 }),
    prisma.promotion.findMany({
      where: {
        status: 'ACTIVE',
        validFrom: { lte: now },
        validUntil: { gte: now },
        venue: { status: 'APPROVED', isActive: true },
      },
      orderBy: [{ featured: 'desc' }, { validUntil: 'asc' }],
      take: 6,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        discount: true,
        validFrom: true,
        validUntil: true,
        terms: true,
        featured: true,
        venue: { select: { id: true, name: true, slug: true, location: true, address: true } },
      },
    }),
  ])

  const featuredVenues = allVenues.filter((venue) => venue.featured).slice(0, 12)
  const featuredEvents = allEvents.filter((event) => event.featured).slice(0, 12)
  const relatedEvents = allEvents.filter((event) => !event.featured).slice(0, 4)
  const mobilePosts = featuredPosts.map(({ user, tags, ...post }) => ({
    ...post,
    author: user ? { id: user.id, name: user.name } : null,
    tags: tags.map(({ tag }) => tag),
  }))

  return mobileSuccess({
    // `venues` and `events` remain the original featured aliases consumed by
    // older clients. The named sections make parity explicit for new clients.
    venues: mapVenues(featuredVenues),
    events: mapEvents(featuredEvents),
    featuredVenues: mapVenues(featuredVenues),
    featuredEvents: mapEvents(featuredEvents),
    latestVenues: mapVenues(allVenues.slice(0, 12)),
    relatedEvents: mapEvents(relatedEvents),
    posts: mobilePosts,
    promotions,
    categories,
    pageInfo: {
      hasMoreVenues: false,
      hasMoreEvents: false,
      nextVenueSkip: allVenues.length,
      nextEventSkip: allEvents.length,
    },
  })
}
