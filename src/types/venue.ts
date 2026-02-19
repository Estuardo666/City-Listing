import type { Prisma } from '@prisma/client'

export type VenueWithRelations = Prisma.VenueGetPayload<{
  include: {
    category: true
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    events: {
      select: {
        id: true
        title: true
        slug: true
        startDate: true
        location: true
        address: true
      }
    }
  }
}>

export type UserVenueListItem = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    image: true
    status: true
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

export type VenueListItem = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    description: true
    image: true
    location: true
    address: true
    lat: true
    lng: true
    featured: true
    status: true
    phone: true
    website: true
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

export type VenueCategory = Prisma.CategoryGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    color: true
    icon: true
  }
}>

export type VenueMapItem = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
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

export type VenueAdminListItem = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    description: true
    location: true
    address: true
    lat: true
    lng: true
    status: true
    featured: true
    createdAt: true
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
    _count: {
      select: {
        events: true
      }
    }
  }
}>

export type VenueSelectOption = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
  }
}>
