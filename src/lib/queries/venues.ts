import 'server-only'
import { cache } from 'react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  adminVenueStatusFilterSchema,
  venueListFiltersSchema,
  type AdminVenueStatusFilterInput,
  type VenueListFiltersInput,
} from '@/schemas/venue.schema'
import type {
  VenueAdminListItem,
  VenueCategory,
  VenueListItem,
  VenueMapItem,
  VenueSelectOption,
  UserVenueListItem,
  VenueWithRelations,
} from '@/types/venue'

const venueListSelect = Prisma.validator<Prisma.VenueSelect>()({
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
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          icon: true,
        },
      },
    },
  },
})

const userVenueListSelect = Prisma.validator<Prisma.VenueSelect>()({
  id: true,
  name: true,
  slug: true,
  image: true,
  status: true,
  isActive: true,
  location: true,
  address: true,
  createdAt: true,
  venueCategories: {
    select: {
      category: {
        select: {
          name: true,
          icon: true,
        },
      },
    },
  },
})

const venueMapSelect = Prisma.validator<Prisma.VenueSelect>()({
  id: true,
  name: true,
  slug: true,
  location: true,
  address: true,
  lat: true,
  lng: true,
  venueCategories: {
    select: {
      category: {
        select: {
          name: true,
        },
      },
    },
  },
})

const venueAdminListSelect = Prisma.validator<Prisma.VenueSelect>()({
  id: true,
  name: true,
  slug: true,
  description: true,
  location: true,
  address: true,
  lat: true,
  lng: true,
  status: true,
  isActive: true,
  featured: true,
  priceRange: true,
  avgRating: true,
  reviewCount: true,
  verified: true,
  badge: true,
  createdAt: true,
  venueCategories: {
    select: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  _count: {
    select: {
      events: true,
    },
  },
})

export async function getVenueCategories(): Promise<VenueCategory[]> {
  return prisma.category.findMany({
    where: {
      type: 'VENUE',
    },
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      icon: true,
    },
  })
}

export const getUserVenuesPaginated = getUserVenues

type GetUserVenuesInput = {
  userId: string
  skip?: number
  take?: number
  q?: string
  status?: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'
  sort?: string
}

export async function getUserVenues(
  input: GetUserVenuesInput
): Promise<{ items: UserVenueListItem[]; total: number; hasMore: boolean }> {
  const skip = input.skip ?? 0
  const take = input.take ?? 10

  const where: Prisma.VenueWhereInput = {
    userId: input.userId,
    ...(input.status && input.status !== 'ALL' ? { status: input.status } : {}),
  }

  if (input.q) {
    where.OR = [
      { name: { contains: input.q } },
      { location: { contains: input.q } },
      { address: { contains: input.q } },
    ]
  }

  const orderBy: Prisma.VenueOrderByWithRelationInput = (() => {
    switch (input.sort) {
      case 'name-asc':
        return { name: 'asc' }
      case 'name-desc':
        return { name: 'desc' }
      case 'oldest':
        return { createdAt: 'asc' }
      default:
        return { createdAt: 'desc' }
    }
  })()

  const [items, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      orderBy,
      skip,
      take,
      select: userVenueListSelect,
    }),
    prisma.venue.count({ where }),
  ])

  return {
    items,
    total,
    hasMore: skip + items.length < total,
  }
}

export async function getVenues(
  rawFilters: Partial<VenueListFiltersInput> = {},
  take?: number
): Promise<VenueListItem[]> {
  const filters = venueListFiltersSchema.parse(rawFilters)

  const where: Prisma.VenueWhereInput = {
    status: filters.status,
    isActive: true,
  }

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { description: { contains: filters.q } },
      { location: { contains: filters.q } },
      { address: { contains: filters.q } },
    ]
  }

  if (filters.category) {
    where.venueCategories = {
      some: {
        category: {
          slug: filters.category,
        },
      },
    }
  }

  if (filters.featured === 'true') {
    where.featured = true
  }

  return prisma.venue.findMany({
    where,
    orderBy: [
      {
        featured: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
    take,
    select: venueListSelect,
  })
}

export async function getVenuesForMap(): Promise<VenueMapItem[]> {
  return prisma.venue.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      lat: {
        not: null,
      },
      lng: {
        not: null,
      },
    },
    orderBy: {
      name: 'asc',
    },
    select: venueMapSelect,
  })
}

export type AdminVenueFilters = {
  status?: AdminVenueStatusFilterInput
  category?: string
  sort?: string
  q?: string
}

export async function getAdminVenues(
  filters: AdminVenueFilters = {}
): Promise<VenueAdminListItem[]> {
  const status = adminVenueStatusFilterSchema.parse(filters.status ?? 'ALL')

  const where: Prisma.VenueWhereInput =
    status === 'ALL'
      ? {}
      : {
          status,
        }

  if (filters.category) {
    where.venueCategories = {
      some: {
        category: {
          slug: filters.category,
        },
      },
    }
  }

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { address: { contains: filters.q, mode: 'insensitive' } },
      { location: { contains: filters.q, mode: 'insensitive' } },
    ]
  }

  const orderBy: Prisma.VenueOrderByWithRelationInput = (() => {
    switch (filters.sort) {
      case 'name-asc':
        return { name: 'asc' }
      case 'name-desc':
        return { name: 'desc' }
      case 'oldest':
        return { createdAt: 'asc' }
      default:
        return { createdAt: 'desc' }
    }
  })()

  return prisma.venue.findMany({
    where,
    orderBy,
    select: venueAdminListSelect,
  })
}

export async function getApprovedVenuesForEventForm(): Promise<VenueSelectOption[]> {
  return prisma.venue.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })
}

export const getVenueBySlug = cache(async (slug: string): Promise<VenueWithRelations | null> => {
  return prisma.venue.findFirst({
    where: {
      slug,
      status: 'APPROVED',
      isActive: true,
    },
    include: {
      venueCategories: { include: { category: true } },
      venueSubcategories: { include: { subcategory: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      events: {
        where: {
          status: 'APPROVED',
        },
        orderBy: {
          startDate: 'asc',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          location: true,
          address: true,
        },
      },
      media: {
        orderBy: { order: 'asc' },
      },
      operatingHours: true,
      businessHours: {
        orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
      },
      services: {
        orderBy: { sortOrder: 'asc' },
      },
      products: {
        orderBy: { order: 'asc' },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              reputationScore: true,
              reviewerLevel: true,
            },
          },
          photos: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      promotions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      },
      reservationSettings: true,
    },
  })
})
