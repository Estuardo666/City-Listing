import { getEvents } from '@/lib/queries/events'
import { getPosts } from '@/lib/queries/posts'
import { getVenueCategories, getVenues } from '@/lib/queries/venues'
import { mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { getPopularNow } from '@/lib/views'
import { getResolvedHomeSections } from '@/lib/queries/home-sections'
import { CACHE_TTL, withCache } from '@/lib/cache'

function mapVenues(venues: Awaited<ReturnType<typeof getVenues>>) {
  return venues.map(({ venueCategories, ...venue }) => {
    // Google-derived fields are intentionally excluded from the persistent
    // mobile cache. They remain available to the web/detail flows with the
    // attribution and freshness rules required by Google Places.
    const ownVenue = { ...venue } as Record<string, unknown>
    delete ownVenue.googleRating
    delete ownVenue.googleReviewCount
    delete ownVenue.googlePlaceId

    return {
      ...ownVenue,
    categories: venueCategories.map(({ category }) => category),
    }
  })
}

function mapEvents(events: Awaited<ReturnType<typeof getEvents>>) {
  return events.map(({ eventCategories, ...event }) => ({
    ...event,
    categories: eventCategories.map(({ category }) => category),
  }))
}

async function buildHomePayload() {
  const now = new Date()
  // The screen is server-driven now: `sections` is the ordered composition the
  // admin configures. The legacy named keys below stay for builds already
  // installed and are deprecated in docs/openapi-mobile-v1.yaml.
  const sectionsPromise = getResolvedHomeSections('ios')
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

  // "Popular ahora" is ranked by the shared view log, then hydrated from the
  // venues already in hand — no extra query, and the section simply disappears
  // when nothing has been viewed recently.
  const popularRanking = await getPopularNow({ kind: 'venue', window: '24h', limit: 10 })
  const venuesById = new Map(allVenues.map((venue) => [venue.id, venue]))
  const popularNow = mapVenues(
    popularRanking
      .map((row) => venuesById.get(row.itemId))
      .filter((venue): venue is (typeof allVenues)[number] => Boolean(venue)),
  )

  const sections = await sectionsPromise

  return {
    sections,
    // `venues` and `events` remain the original featured aliases consumed by
    // older clients. The named sections make parity explicit for new clients.
    venues: mapVenues(featuredVenues),
    events: mapEvents(featuredEvents),
    featuredVenues: mapVenues(featuredVenues),
    featuredEvents: mapEvents(featuredEvents),
    latestVenues: mapVenues(allVenues.slice(0, 12)),
    popularNow,
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
  }
}

export async function GET() {
  const payload = await withCache('mobile:home:v4', buildHomePayload, CACHE_TTL.MOBILE_PUBLIC)
  const response = mobileSuccess(payload)
  // Public, anonymous home payload. Keep device browsers revalidating while
  // letting Vercel's edge absorb repeated app launches between data refreshes.
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  return response
}
