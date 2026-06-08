import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { PostListItem } from '@/types/post'

const trendingPostSelect = Prisma.validator<Prisma.PostSelect>()({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  image: true,
  status: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
  viewCount: true,
  category: {
    select: { id: true, name: true, slug: true, color: true, icon: true },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
  },
})

export async function getTrendingPosts(period: 'week' | 'month' = 'week', limit = 5): Promise<PostListItem[]> {
  const now = new Date()
  const startDate = new Date()
  if (period === 'week') startDate.setDate(now.getDate() - 7)
  else startDate.setMonth(now.getMonth() - 1)

  try {
    const prismaAny = prisma as unknown as { post: { findMany: (args: unknown) => Promise<PostListItem[]> } }
    return prismaAny.post.findMany({
      where: { status: 'APPROVED', publishedAt: { gte: startDate, lte: now } },
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      select: trendingPostSelect,
    })
  } catch {
    return prisma.post.findMany({
      where: { status: 'APPROVED', publishedAt: { gte: startDate, lte: now } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: { ...trendingPostSelect, viewCount: true as any },
    })
  }
}

export async function getPopularPosts(threshold = 100, limit = 3): Promise<PostListItem[]> {
  try {
    const prismaAny = prisma as unknown as { post: { findMany: (args: unknown) => Promise<PostListItem[]> } }
    return prismaAny.post.findMany({
      where: { status: 'APPROVED', viewCount: { gte: threshold } },
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      select: trendingPostSelect,
    })
  } catch {
    return prisma.post.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: { ...trendingPostSelect, viewCount: true as any },
    })
  }
}

export async function getTrendingVenues(period: 'week' | 'month' = 'week', limit = 6) {
  const now = new Date()
  const startDate = new Date()
  if (period === 'week') startDate.setDate(now.getDate() - 7)
  else startDate.setMonth(now.getMonth() - 1)

  return prisma.venue.findMany({
    where: {
      status: 'APPROVED',
      createdAt: { gte: startDate },
    },
    orderBy: [
      { viewCount: 'desc' },
      { reviewCount: 'desc' },
      { avgRating: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      location: true,
      address: true,
      lat: true,
      lng: true,
      featured: true,
      status: true,
      phone: true,
      website: true,
      priceRange: true,
      avgRating: true,
      reviewCount: true,
      verified: true,
      badge: true,
      venueCategories: {
        select: {
          category: {
            select: { id: true, name: true, slug: true, color: true, icon: true },
          },
        },
      },
    },
  })
}

export async function getTrendingEvents(period: 'week' | 'month' = 'week', limit = 6) {
  const now = new Date()
  const startDate = new Date()
  if (period === 'week') startDate.setDate(now.getDate() - 7)
  else startDate.setMonth(now.getMonth() - 1)

  return prisma.event.findMany({
    where: {
      status: 'APPROVED',
      startDate: { gte: now },
      createdAt: { gte: startDate },
    },
    orderBy: [
      { viewCount: 'desc' },
      { reviewCount: 'desc' },
      { avgRating: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      image: true,
      startDate: true,
      endDate: true,
      location: true,
      address: true,
      lat: true,
      lng: true,
      venueId: true,
      featured: true,
      status: true,
      price: true,
      isRecurring: true,
      avgRating: true,
      reviewCount: true,
      venue: { select: { id: true, name: true, slug: true } },
      eventCategories: {
        select: {
          category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
        },
      },
    },
  })
}

export async function getUserFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      event: {
        select: {
          id: true, title: true, slug: true, image: true, startDate: true, location: true, address: true,
          featured: true, status: true, price: true, isRecurring: true, avgRating: true, reviewCount: true,
          venueId: true, description: true, endDate: true, lat: true, lng: true,
          eventCategories: {
            select: {
              category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
            },
          },
          venue: { select: { id: true, name: true, slug: true } },
        },
      },
      venue: {
        select: {
          id: true, name: true, slug: true, image: true, location: true, address: true,
          priceRange: true, avgRating: true, reviewCount: true, verified: true, badge: true,
          featured: true, status: true, description: true, lat: true, lng: true, phone: true, website: true,
          venueCategories: {
            select: {
              category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
            },
          },
        },
      },
      post: {
        select: {
          id: true, title: true, slug: true, image: true, excerpt: true, status: true, featured: true, publishedAt: true,
          category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
        },
      },
      route: {
        select: { id: true, title: true, slug: true, image: true, type: true, duration: true, difficulty: true, status: true, featured: true, description: true },
      },
    },
  })
}
