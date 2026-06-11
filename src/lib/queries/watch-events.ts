import { prisma } from '@/lib/prisma'

export async function getWatchEventBySlug(slug: string) {
  return prisma.watchEvent.findUnique({
    where: { slug, status: 'ACTIVE' },
    include: {
      performersList: {
        include: { performer: true },
      },
      venues: {
        where: { isActive: true },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true,
              phone: true,
              address: true,
              location: true,
              lat: true,
              lng: true,
              avgRating: true,
              reviewCount: true,
              priceRange: true,
            },
          },
        },
      },
    },
  })
}

export async function getActiveWatchEvents(limit = 50) {
  return prisma.watchEvent.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { matchDate: 'asc' },
    take: limit,
    include: {
      performersList: {
        include: { performer: true },
      },
      _count: { select: { venues: true } },
    },
  })
}

export async function getWatchEventsForVenue(venueId: string) {
  return prisma.watchEventVenue.findMany({
    where: {
      venueId,
      isActive: true,
      watchEvent: { status: 'ACTIVE' },
    },
    include: {
      watchEvent: {
        include: {
          performersList: { include: { performer: true } },
        },
      },
    },
    orderBy: { watchEvent: { matchDate: 'asc' } },
  })
}
