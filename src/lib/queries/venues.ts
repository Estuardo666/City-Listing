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
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      icon: true,
    },
  },
})

const userVenueListSelect = Prisma.validator<Prisma.VenueSelect>()({
  id: true,
  name: true,
  slug: true,
  image: true,
  status: true,
  location: true,
  address: true,
  createdAt: true,
  category: {
    select: {
      name: true,
      icon: true,
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
  category: {
    select: {
      name: true,
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
  featured: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
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

  const [items, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    where.category = {
      slug: filters.category,
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

export async function getAdminVenues(
  rawStatus: AdminVenueStatusFilterInput = 'PENDING'
): Promise<VenueAdminListItem[]> {
  const status = adminVenueStatusFilterSchema.parse(rawStatus)

  const where: Prisma.VenueWhereInput =
    status === 'ALL'
      ? {}
      : {
          status,
        }

  return prisma.venue.findMany({
    where,
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        name: 'asc',
      },
    ],
    select: venueAdminListSelect,
  })
}

export async function getApprovedVenuesForEventForm(): Promise<VenueSelectOption[]> {
  return prisma.venue.findMany({
    where: {
      status: 'APPROVED',
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

export async function getVenueBySlug(slug: string): Promise<VenueWithRelations | null> {
  return prisma.venue.findFirst({
    where: {
      slug,
      status: 'APPROVED',
    },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
    },
  })
}
