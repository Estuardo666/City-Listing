import type { Prisma } from '@prisma/client'

export type EventWithRelations = Prisma.EventGetPayload<{
  include: {
    category: true
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    venue?: {
      select: {
        id: true
        name: true
        slug: true
      }
    }
  }
}>

export type UserEventListItem = Prisma.EventGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    image: true
    status: true
    startDate: true
    location: true
    address: true
    createdAt: true
    category: {
      select: {
        name: true
        icon: true
      }
    }
  }
}>

export type EventListItem = Prisma.EventGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    description: true
    image: true
    startDate: true
    endDate: true
    location: true
    address: true
    lat: true
    lng: true
    venueId: true
    featured: true
    status: true
    venue: {
      select: {
        id: true
        name: true
        slug: true
      }
    }
    category: {
      select: {
        id: true
        name: true
        slug: true
        color: true
        icon: true
      }
    }
  }
}>

export type EventCategory = Prisma.CategoryGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    color: true
    icon: true
  }
}>

export type EventAdminListItem = Prisma.EventGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    description: true
    startDate: true
    endDate: true
    location: true
    address: true
    lat: true
    lng: true
    venueId: true
    status: true
    featured: true
    createdAt: true
    venue: {
      select: {
        id: true
        name: true
        slug: true
      }
    }
    category: {
      select: {
        id: true
        name: true
        slug: true
      }
    }
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

export type EventMapItem = Prisma.EventGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    startDate: true
    location: true
    address: true
    lat: true
    lng: true
    category: {
      select: {
        name: true
      }
    }
  }
}>

export type UpcomingEventNotification = Prisma.EventGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    startDate: true
    location: true
    address: true
    category: {
      select: {
        name: true
      }
    }
  }
}>
