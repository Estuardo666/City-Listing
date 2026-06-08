import 'server-only'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type AdminUserListItem = {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  createdAt: Date
  _count: {
    venues: number
    events: number
    reviews: number
    posts: number
  }
}

export type AdminUserDetail = {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  createdAt: Date
  updatedAt: Date
  reputationScore: number
  reviewerLevel: number
  totalReviews: number
  totalCheckIns: number
  totalPhotos: number
  totalHelpfulVotes: number
  _count: {
    venues: number
    events: number
    reviews: number
    posts: number
    favorites: number
    comments: number
  }
}

export type AdminUserFilters = {
  q?: string
  role?: string
  sort?: string
}

export type AdminUserStats = {
  total: number
  admins: number
  users: number
}

export async function getAdminUsers(
  filters: AdminUserFilters = {}
): Promise<AdminUserListItem[]> {
  const where: Prisma.UserWhereInput = {}

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { email: { contains: filters.q, mode: 'insensitive' } },
    ]
  }

  if (filters.role && filters.role !== 'ALL') {
    where.role = filters.role
  }

  const orderBy: Prisma.UserOrderByWithRelationInput =
    filters.sort === 'oldest'
      ? { createdAt: 'asc' }
      : filters.sort === 'name'
        ? { name: 'asc' }
        : { createdAt: 'desc' }

  return prisma.user.findMany({
    where,
    orderBy,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          venues: true,
          events: true,
          reviews: true,
          posts: true,
        },
      },
    },
  })
}

export async function getAdminUserById(id: string): Promise<AdminUserDetail | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      reputationScore: true,
      reviewerLevel: true,
      totalReviews: true,
      totalCheckIns: true,
      totalPhotos: true,
      totalHelpfulVotes: true,
      _count: {
        select: {
          venues: true,
          events: true,
          reviews: true,
          posts: true,
          favorites: true,
          comments: true,
        },
      },
    },
  })
}

export async function getAdminUserStats() {
  const [total, admins, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'USER' } }),
  ])

  return { total, admins, users }
}
