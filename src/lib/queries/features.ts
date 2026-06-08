import 'server-only'
import { cache } from 'react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function getVenueMenu(venueId: string) {
  return prisma.menuCategory.findMany({
    where: { venueId },
    orderBy: { order: 'asc' },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  })
}

export async function getVenueQuestions(venueId: string) {
  return prisma.question.findMany({
    where: { venueId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  })
}

export async function getEventQuestions(eventId: string) {
  return prisma.question.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  })
}

export async function getVenueSpecialHours(venueId: string) {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(now.getDate() + 30)

  return prisma.specialHours.findMany({
    where: {
      venueId,
      date: { gte: now, lte: futureDate },
    },
    orderBy: { date: 'asc' },
  })
}

export async function getVenueCheckIns(venueId: string, limit = 10) {
  return prisma.checkIn.findMany({
    where: { venueId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  })
}

export async function getUserCollections(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
    },
  })
}

export async function getPublicCollections(limit = 20) {
  return prisma.collection.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  })
}

export const getCollectionBySlug = cache(async (slug: string) => {
  return prisma.collection.findFirst({
    where: { slug, isPublic: true },
    include: {
      user: { select: { id: true, name: true, image: true } },
      items: {
        orderBy: { order: 'asc' },
        include: {
          venue: {
            select: {
              id: true, name: true, slug: true, image: true, location: true, address: true,
              priceRange: true, avgRating: true, reviewCount: true, verified: true, badge: true,
              featured: true, status: true, description: true, lat: true, lng: true, phone: true, website: true,
              venueCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
            },
          },
          event: {
            select: {
              id: true, title: true, slug: true, image: true, startDate: true, location: true, address: true,
              featured: true, status: true, price: true, isRecurring: true, avgRating: true, reviewCount: true,
              venueId: true, description: true, endDate: true, lat: true, lng: true,
              eventCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
              venue: { select: { id: true, name: true, slug: true } },
            },
          },
          route: {
            select: { id: true, title: true, slug: true, image: true, type: true, duration: true, difficulty: true, status: true, featured: true, description: true },
          },
        },
      },
    },
  })
})

export async function getCollectionById(id: string, userId: string) {
  return prisma.collection.findFirst({
    where: { id, userId },
    include: {
      user: { select: { id: true, name: true, image: true } },
      items: {
        orderBy: { order: 'asc' },
        include: {
          venue: {
            select: {
              id: true, name: true, slug: true, image: true, location: true, address: true,
              priceRange: true, avgRating: true, reviewCount: true, verified: true, badge: true,
              featured: true, status: true, description: true, lat: true, lng: true, phone: true, website: true,
              venueCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
            },
          },
          event: {
            select: {
              id: true, title: true, slug: true, image: true, startDate: true, location: true, address: true,
              featured: true, status: true, price: true, isRecurring: true, avgRating: true, reviewCount: true,
              venueId: true, description: true, endDate: true, lat: true, lng: true,
              eventCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
              venue: { select: { id: true, name: true, slug: true } },
            },
          },
          post: {
            select: { id: true, title: true, slug: true, image: true, excerpt: true },
          },
          route: {
            select: { id: true, title: true, slug: true, image: true, type: true, duration: true, difficulty: true, status: true, featured: true, description: true },
          },
        },
      },
    },
  })
}

export async function getCategoryTree(type: string) {
  return prisma.category.findMany({
    where: { type },
    include: { subcategories: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  })
}

export async function getVenueOwnerAnalytics(userId: string) {
  const venues = await prisma.venue.findMany({
    where: { userId },
    select: {
      id: true, name: true, slug: true, viewCount: true, avgRating: true, reviewCount: true,
      _count: {
        select: {
          reviews: true,
          favorites: true,
          reservations: true,
          checkIns: true,
          media: true,
        },
      },
    },
  })

  const venueIds = venues.map((v) => v.id)

  const ratingDistribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { venueId: { in: venueIds } },
    _count: { rating: true },
  })

  const recentReviews = await prisma.review.findMany({
    where: { venueId: { in: venueIds } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { id: true, name: true, image: true } },
      venue: { select: { id: true, name: true, slug: true } },
    },
  })

  const reservationStats = await prisma.reservation.groupBy({
    by: ['status'],
    where: { venueId: { in: venueIds } },
    _count: { status: true },
  })

  return {
    venues,
    ratingDistribution: ratingDistribution.map((r) => ({ rating: r.rating, count: r._count.rating })),
    recentReviews,
    reservationStats: reservationStats.map((r) => ({ status: r.status, count: r._count.status })),
  }
}
