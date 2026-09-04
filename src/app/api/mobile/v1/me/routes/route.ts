import { randomBytes } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { groupStopsByDay } from '@/lib/mobile-routes'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const routeSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5_000),
  content: z.string().trim().max(20_000).optional(),
  image: z.string().url().max(2_000).optional(),
  duration: z.string().trim().max(80).optional(),
  difficulty: z.string().trim().max(40).optional(),
  type: z.string().trim().min(2).max(40),
  days: z.coerce.number().int().min(1).max(14).optional(),
  estimatedMinutes: z.number().int().min(1).max(20160).optional(),
  stops: z
    .array(
      z.object({
        venueId: z.string().trim().min(1).optional(),
        title: z.string().trim().min(2).max(160),
        notes: z.string().trim().max(500).optional(),
        duration: z.string().trim().max(80).optional(),
        // 1-based. Omitting it keeps the old single-day behaviour.
        day: z.coerce.number().int().min(1).max(14).optional(),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
        lat: z.coerce.number().min(-90).max(90).optional(),
        lng: z.coerce.number().min(-180).max(180).optional(),
        travelMinutes: z.coerce.number().int().min(0).max(1_440).optional(),
      }),
    )
    .max(100)
    .optional(),
})

const routeSelect = Prisma.validator<Prisma.RouteSelect>()({
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
  days: true,
  createdAt: true,
  stops: {
    orderBy: [{ day: 'asc' }, { order: 'asc' }],
    select: {
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
      travelMinutes: true,
    },
  },
})

export const GET = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus rutas.', 401)
  const routes = await prisma.route.findMany({ where: { userId: principal.userId }, orderBy: { createdAt: 'desc' }, take: 100, select: routeSelect })
  // Drafts are grouped the same way the public detail is, so the editor and the
  // reader render from one shape.
  return mobileSuccess(
    routes.map((route) => ({ ...route, itinerary: groupStopsByDay(route) })),
  )
})

export const POST = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para publicar una ruta.', 401)
  const parsed = routeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La ruta no es válida.', 422, parsed.error.flatten().fieldErrors)
  const stops = parsed.data.stops ?? []
  const venueIds = stops.flatMap((stop) => stop.venueId ? [stop.venueId] : [])
  if (venueIds.length) {
    const count = await prisma.venue.count({ where: { id: { in: venueIds }, status: 'APPROVED', isActive: true } })
    if (count !== new Set(venueIds).size) return mobileError('NOT_FOUND', 'Una parada no está disponible.', 404)
  }
  // `order` is per day, so it restarts on each one — the unique key is
  // (routeId, day, order).
  const orderByDay = new Map<number, number>()
  const stopRows = stops.map((stop) => {
    const day = stop.day ?? 1
    const order = orderByDay.get(day) ?? 0
    orderByDay.set(day, order + 1)
    return {
      venueId: stop.venueId,
      day,
      order,
      title: stop.title,
      notes: stop.notes,
      duration: stop.duration,
      startTime: stop.startTime,
      lat: stop.lat,
      lng: stop.lng,
      travelMinutes: stop.travelMinutes,
    }
  })

  // Trust the stops over the declared span: a 3-day itinerary whose stops only
  // reach day 2 would otherwise render an empty tab.
  const days = Math.max(parsed.data.days ?? 1, ...stopRows.map((stop) => stop.day), 1)

  const baseSlug = slugify(parsed.data.title) || 'ruta'
  const route = await prisma.route.create({
    data: {
      userId: principal.userId,
      title: parsed.data.title,
      slug: `${baseSlug}-${randomBytes(3).toString('hex')}`,
      description: parsed.data.description,
      content: parsed.data.content,
      image: parsed.data.image,
      duration: parsed.data.duration,
      difficulty: parsed.data.difficulty,
      type: parsed.data.type,
      days,
      estimatedMinutes: parsed.data.estimatedMinutes,
      status: 'PENDING',
      stops: { create: stopRows },
    },
    select: routeSelect,
  })
  return mobileSuccess({ ...route, itinerary: groupStopsByDay(route) }, { moderation: 'PENDING' })
})
