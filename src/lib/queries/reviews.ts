import 'server-only'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { AdminReviewFiltersInput } from '@/schemas/review.schema'

export type ReviewAdminListItem = {
  id: string
  rating: number
  title: string | null
  content: string | null
  ownerReply: string | null
  status: string
  flaggedReason: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
    reviewerLevel: number
  }
  venue: {
    id: string
    name: string
    slug: string
    venueCategories: { category: { name: string } }[]
  } | null
  event: {
    id: string
    title: string
    slug: string
    eventCategories: { category: { name: string } }[]
  } | null
  photos: {
    id: string
    url: string
    order: number
  }[]
}

export type ReviewStats = {
  total: number
  pending: number
  approved: number
  rejected: number
  flagged: number
}

const reviewAdminSelect = {
  id: true,
  rating: true,
  title: true,
  content: true,
  ownerReply: true,
  status: true,
  flaggedReason: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true,
      reviewerLevel: true,
    },
  },
  venue: {
    select: {
      id: true,
      name: true,
      slug: true,
      venueCategories: {
        select: {
          category: {
            select: { name: true },
          },
        },
      },
    },
  },
  event: {
    select: {
      id: true,
      title: true,
      slug: true,
      eventCategories: {
        select: {
          category: {
            select: { name: true },
          },
        },
      },
    },
  },
  photos: {
    select: {
      id: true,
      url: true,
      order: true,
    },
    orderBy: { order: 'asc' as const },
  },
} satisfies Prisma.ReviewSelect

export async function getAdminReviews(
  filters: AdminReviewFiltersInput
): Promise<ReviewAdminListItem[]> {
  const where: Prisma.ReviewWhereInput = {}

  if (filters.status !== 'ALL') {
    where.status = filters.status
  }

  if (filters.entityType === 'VENUE') {
    where.venueId = { not: null }
    where.eventId = null
  } else if (filters.entityType === 'EVENT') {
    where.eventId = { not: null }
    where.venueId = null
  }

  if (filters.rating) {
    where.rating = filters.rating
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { content: { contains: filters.search } },
      { user: { name: { contains: filters.search } } },
    ]
  }

  if (filters.flagged) {
    where.flaggedReason = { not: null }
  }

  if (filters.category) {
    where.OR = [
      ...(where.OR ?? []),
      { venue: { venueCategories: { some: { category: { slug: filters.category } } } } },
      { event: { eventCategories: { some: { category: { slug: filters.category } } } } },
    ]
  }

  let orderBy: Prisma.ReviewOrderByWithRelationInput
  switch (filters.sort) {
    case 'oldest':
      orderBy = { createdAt: 'asc' }
      break
    case 'lowest-rating':
      orderBy = { rating: 'asc' }
      break
    case 'highest-rating':
      orderBy = { rating: 'desc' }
      break
    default:
      orderBy = { createdAt: 'desc' }
  }

  return prisma.review.findMany({
    where,
    orderBy,
    select: reviewAdminSelect,
  })
}

export async function getAdminReviewStats(): Promise<ReviewStats> {
  const [total, pending, approved, rejected, flagged] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.review.count({ where: { status: 'APPROVED' } }),
    prisma.review.count({ where: { status: 'REJECTED' } }),
    prisma.review.count({ where: { flaggedReason: { not: null } } }),
  ])

  return { total, pending, approved, rejected, flagged }
}

export async function getReviewCategories(): Promise<{ id: string; name: string; slug: string }[]> {
  const venueCategories = await prisma.category.findMany({
    where: { type: 'VENUE' },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  })

  return venueCategories
}
