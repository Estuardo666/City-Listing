import type { Prisma } from '@prisma/client'

export type RouteWithStops = Prisma.RouteGetPayload<{
  include: {
    user: {
      select: {
        id: true
        name: true
        image: true
      }
    }
    stops: {
      include: {
        venue: {
          select: {
            id: true
            name: true
            slug: true
            image: true
            lat: true
            lng: true
            location: true
          }
        }
      }
      orderBy: {
        order: 'asc'
      }
    }
    _count: {
      select: {
        favorites: true
      }
    }
  }
}>

export type RouteListItem = Prisma.RouteGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    description: true
    image: true
    duration: true
    difficulty: true
    type: true
    featured: true
    status: true
    createdAt: true
    user: {
      select: {
        id: true
        name: true
      }
    }
    stops: {
      select: {
        id: true
        title: true
        order: true
      }
      orderBy: {
        order: 'asc'
      }
    }
    _count: {
      select: {
        favorites: true
      }
    }
  }
}>
