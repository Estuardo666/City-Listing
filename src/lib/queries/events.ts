import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { EventWithRelations } from '@/types/event'
import {
  adminEventStatusFilterSchema,
  eventListFiltersSchema,
  upcomingEventNotificationInputSchema,
  type AdminEventStatusFilterInput,
  type EventListFiltersInput,
  type UpcomingEventNotificationInput,
} from '@/schemas/event.schema'
import type {
  EventAdminListItem,
  EventCategory,
  EventListItem,
  EventMapItem,
  UserEventListItem,
  UpcomingEventNotification,
} from '@/types/event'

const eventListSelect = Prisma.validator<Prisma.EventSelect>()({
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
  venue: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
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

const userEventListSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  title: true,
  slug: true,
  image: true,
  status: true,
  startDate: true,
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

const eventAdminListSelect = Prisma.validator<Prisma.EventSelect>()({
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
  venueId: true,
  status: true,
  featured: true,
  createdAt: true,
  venue: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
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
})

const eventMapSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  title: true,
  slug: true,
  startDate: true,
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

const upcomingEventNotificationSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  title: true,
  slug: true,
  startDate: true,
  location: true,
  address: true,
  category: {
    select: {
      name: true,
    },
  },
})

export async function getEventCategories(): Promise<EventCategory[]> {
  return prisma.category.findMany({
    where: {
      type: 'EVENT',
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

export const getUserEventsPaginated = getUserEvents

type GetUserEventsInput = {
  userId: string
  skip?: number
  take?: number
  q?: string
  status?: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'
}

export async function getUserEvents(
  input: GetUserEventsInput
): Promise<{ items: UserEventListItem[]; total: number; hasMore: boolean }> {
  const skip = input.skip ?? 0
  const take = input.take ?? 10

  const where: Prisma.EventWhereInput = {
    userId: input.userId,
    ...(input.status && input.status !== 'ALL' ? { status: input.status } : {}),
  }

  if (input.q) {
    where.OR = [
      { title: { contains: input.q } },
      { location: { contains: input.q } },
      { address: { contains: input.q } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: userEventListSelect,
    }),
    prisma.event.count({ where }),
  ])

  return {
    items,
    total,
    hasMore: skip + items.length < total,
  }
}

export async function getEvents(
  rawFilters: Partial<EventListFiltersInput> = {},
  take?: number
): Promise<EventListItem[]> {
  const filters = eventListFiltersSchema.parse(rawFilters)

  const where: Prisma.EventWhereInput = {
    status: filters.status,
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
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

  return prisma.event.findMany({
    where,
    orderBy: [
      {
        featured: 'desc',
      },
      {
        startDate: 'asc',
      },
    ],
    take,
    select: eventListSelect,
  })
}

export async function getEventsForMap(): Promise<EventMapItem[]> {
  return prisma.event.findMany({
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
      startDate: 'asc',
    },
    select: eventMapSelect,
  })
}

export async function getAdminEvents(
  rawStatus: AdminEventStatusFilterInput = 'PENDING'
): Promise<EventAdminListItem[]> {
  const status = adminEventStatusFilterSchema.parse(rawStatus)

  const where: Prisma.EventWhereInput =
    status === 'ALL'
      ? {}
      : {
          status,
        }

  return prisma.event.findMany({
    where,
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        startDate: 'asc',
      },
    ],
    select: eventAdminListSelect,
  })
}

export async function getUpcomingEventNotifications(
  rawInput: Partial<UpcomingEventNotificationInput> = {}
): Promise<UpcomingEventNotification[]> {
  const input = upcomingEventNotificationInputSchema.parse(rawInput)
  const now = new Date()
  const upperBound = new Date(now.getTime() + input.hoursAhead * 60 * 60 * 1000)

  return prisma.event.findMany({
    where: {
      status: 'APPROVED',
      startDate: {
        gte: now,
        lte: upperBound,
      },
    },
    orderBy: {
      startDate: 'asc',
    },
    take: input.limit,
    select: upcomingEventNotificationSelect,
  })
}

export async function getEventBySlug(slug: string): Promise<EventWithRelations | null> {
  return prisma.event.findFirst({
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
      venue: true,
    },
  })
}
