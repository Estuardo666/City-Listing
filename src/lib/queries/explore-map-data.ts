import { prisma } from '@/lib/prisma'
import type { ExploreEvent, ExploreVenue } from '@/types/explore'

const LOJA_CENTER = { lat: -3.99313, lng: -79.20422 }

type Coordinates = { lat: number | null; lng: number | null }

export function resolveEventMapCoordinates(
  event: Coordinates & { venue?: Coordinates | null }
): Coordinates {
  if (event.lat !== null && event.lng !== null) {
    return { lat: event.lat, lng: event.lng }
  }

  if (event.venue?.lat !== null && event.venue?.lat !== undefined &&
      event.venue.lng !== null && event.venue.lng !== undefined) {
    return { lat: event.venue.lat, lng: event.venue.lng }
  }

  return { lat: null, lng: null }
}

function distanceSquaredFromLoja(item: Coordinates): number {
  if (item.lat === null || item.lng === null) return Number.POSITIVE_INFINITY
  return (item.lat - LOJA_CENTER.lat) ** 2 + (item.lng - LOJA_CENTER.lng) ** 2
}

export function nearestToLoja<T extends Coordinates>(items: T[], limit?: number): T[] {
  const sorted = [...items].sort((a, b) => distanceSquaredFromLoja(a) - distanceSquaredFromLoja(b))
  return limit === undefined ? sorted : sorted.slice(0, limit)
}

type ExploreMapDataOptions = {
  venueLimit?: number
  eventLimit?: number
}

export async function getExploreMapData(
  options: ExploreMapDataOptions = {}
): Promise<{ venues: ExploreVenue[]; events: ExploreEvent[] }> {
  const [venueRows, eventRows] = await Promise.all([
    prisma.venue.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        lat: { not: null },
        lng: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        location: true,
        address: true,
        lat: true,
        lng: true,
        featured: true,
        phone: true,
        website: true,
        priceRange: true,
        avgRating: true,
        reviewCount: true,
        verified: true,
        venueCategories: {
          select: {
            category: {
              select: { id: true, name: true, slug: true, color: true, icon: true },
            },
          },
        },
      },
    }),
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { AND: [{ lat: { not: null } }, { lng: { not: null } }] },
          { venue: { is: { lat: { not: null }, lng: { not: null } } } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        address: true,
        lat: true,
        lng: true,
        featured: true,
        price: true,
        avgRating: true,
        reviewCount: true,
        venue: { select: { lat: true, lng: true } },
        eventCategories: {
          select: {
            category: {
              select: { id: true, name: true, slug: true, color: true, icon: true },
            },
          },
        },
      },
    }),
  ])

  const venues = nearestToLoja(
    venueRows.map((venue) => ({
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      image: null,
      location: venue.location,
      address: venue.address,
      lat: venue.lat,
      lng: venue.lng,
      featured: venue.featured,
      phone: venue.phone,
      website: venue.website,
      priceRange: venue.priceRange,
      avgRating: venue.avgRating,
      reviewCount: venue.reviewCount,
      verified: venue.verified,
      promotions: [],
      services: [],
      businessHours: [],
      categories: venue.venueCategories.map((entry) => entry.category),
    })),
    options.venueLimit
  )

  const events = nearestToLoja(
    eventRows.flatMap((event) => {
      const coordinates = resolveEventMapCoordinates(event)
      if (coordinates.lat === null || coordinates.lng === null) return []

      return [{
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        image: null,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        location: event.location,
        address: event.address,
        lat: coordinates.lat,
        lng: coordinates.lng,
        featured: event.featured,
        price: event.price,
        avgRating: event.avgRating,
        reviewCount: event.reviewCount,
        categories: event.eventCategories.map((entry) => entry.category),
      }]
    }),
    options.eventLimit
  )

  return { venues, events }
}
