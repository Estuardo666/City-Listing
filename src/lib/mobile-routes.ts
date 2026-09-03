import 'server-only'

import { Prisma } from '@prisma/client'

/**
 * Shared shape and mapping for itinerary routes.
 *
 * The mobile detail endpoint, the `/me/routes` drafts endpoint and the public
 * `/content` payload all present routes; keeping the selection and the
 * day-grouping here stops the three from drifting.
 */

export const routeStopSelect = {
  id: true,
  venueId: true,
  day: true,
  order: true,
  title: true,
  notes: true,
  duration: true,
  startTime: true,
  lat: true,
  lng: true,
  image: true,
  travelMinutes: true,
} as const

export const routeStopWithVenueSelect = {
  ...routeStopSelect,
  venue: {
    select: { id: true, name: true, slug: true, image: true, lat: true, lng: true, location: true },
  },
} as const

export const routeSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  content: true,
  image: true,
  duration: true,
  difficulty: true,
  type: true,
  status: true,
  featured: true,
  days: true,
  distanceMeters: true,
  estimatedMinutes: true,
  startLat: true,
  startLng: true,
  createdAt: true,
} as const

/** `as const` would freeze `orderBy` into a readonly tuple Prisma rejects. */
export const routeDetailSelect = Prisma.validator<Prisma.RouteSelect>()({
  ...routeSelect,
  user: { select: { id: true, name: true, image: true } },
  stops: {
    orderBy: [{ day: 'asc' }, { order: 'asc' }],
    select: routeStopWithVenueSelect,
  },
  _count: { select: { favorites: true } },
})

type RouteDetailRow = Prisma.RouteGetPayload<{ select: typeof routeDetailSelect }>
type RouteStopRow = RouteDetailRow['stops'][number]

export interface MobileRouteDay<Stop = RouteStopRow> {
  day: number
  stops: Stop[]
}

/**
 * Groups stops into consecutive days, emitting an entry for every day from 1 to
 * `route.days` even when it has no stops yet — the app renders a day picker and
 * a gap in the middle would otherwise silently renumber the following days.
 */
export function groupStopsByDay<Stop extends { day: number }>(route: {
  days: number
  stops: Stop[]
}): MobileRouteDay<Stop>[] {
  const highest = route.stops.reduce((max, stop) => Math.max(max, stop.day), 1)
  const total = Math.max(route.days, highest, 1)

  return Array.from({ length: total }, (_, index) => {
    const day = index + 1
    return { day, stops: route.stops.filter((stop) => stop.day === day) }
  })
}

/** Detail payload shared by the mobile API and the itinerary screens. */
export function mapRouteDetail(route: RouteDetailRow) {
  return {
    id: route.id,
    title: route.title,
    slug: route.slug,
    description: route.description,
    content: route.content,
    image: route.image,
    duration: route.duration,
    difficulty: route.difficulty,
    type: route.type,
    featured: route.featured,
    days: Math.max(route.days, 1),
    distanceMeters: route.distanceMeters,
    estimatedMinutes: route.estimatedMinutes,
    startLat: route.startLat,
    startLng: route.startLng,
    favoriteCount: route._count.favorites,
    author: route.user,
    stops: route.stops,
    itinerary: groupStopsByDay(route),
  }
}
