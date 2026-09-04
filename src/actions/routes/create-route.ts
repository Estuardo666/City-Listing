'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { routeSchema, routeStopSchema } from '@/schemas/route.schema'
import type { ActionResponse } from '@/types/action-response'
import type { Route, RouteStop } from '@prisma/client'

async function generateUniqueRouteSlug(baseTitle: string): Promise<string> {
  const baseSlug = slugify(baseTitle)
  let candidateSlug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await prisma.route.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    })
    if (!existing) return candidateSlug
    suffix += 1
    candidateSlug = `${baseSlug}-${suffix}`
  }
}

export async function createRouteAction(
  input: unknown,
  stops: unknown[] = []
): Promise<ActionResponse<Route & { stops: RouteStop[] }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const parsed = routeSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const slug = await generateUniqueRouteSlug(parsed.data.title)

    const parsedStops = stops.map((stop) => routeStopSchema.safeParse(stop))
    if (!parsedStops.length || parsedStops.length > 100 || parsedStops.some(r => !r.success)) {
      return { success: false, error: 'Añade entre 1 y 100 paradas válidas.' }
    }
    const validStops = parsedStops.map(r => r.data!)
    const venueIds = [...new Set(validStops.flatMap(s => s.venueId ? [s.venueId] : []))]
    const venues = await prisma.venue.findMany({ where: { id: { in: venueIds }, status: 'APPROVED', isActive: true }, select: { id: true, lat: true, lng: true } })
    if (venues.length !== venueIds.length) return { success: false, error: 'Selecciona locales publicados y activos.' }
    const positions = validStops.map(s => `${s.day}:${s.order}`)
    if (new Set(positions).size !== positions.length) return { success: false, error: 'Hay paradas repetidas en la misma posición.' }

    const created = await prisma.route.create({
      data: {
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        content: parsed.data.content,
        image: parsed.data.image,
        duration: parsed.data.duration,
        difficulty: parsed.data.difficulty,
        type: parsed.data.type,
        featured: session.user.role === 'ADMIN' && parsed.data.featured,
        // The stops decide the span: a route declared as 3 days whose stops
        // stop at day 2 would render an empty tab.
        days: Math.max(parsed.data.days ?? 1, ...validStops.map((stop) => stop.day ?? 1), 1),
        distanceMeters: parsed.data.distanceMeters ?? null,
        estimatedMinutes: parsed.data.estimatedMinutes ?? null,
        startLat: parsed.data.startLat ?? null,
        startLng: parsed.data.startLng ?? null,
        status: session.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
        userId: session.user.id,
        stops: {
          create: validStops.map((stop) => ({
            venueId: stop.venueId,
            title: stop.title,
            notes: stop.notes,
            duration: stop.duration,
            day: stop.day ?? 1,
            order: stop.order,
            startTime: stop.startTime ?? null,
            lat: stop.lat ?? venues.find(v => v.id === stop.venueId)?.lat ?? null,
            lng: stop.lng ?? venues.find(v => v.id === stop.venueId)?.lng ?? null,
            image: stop.image ?? null,
            travelMinutes: stop.travelMinutes ?? null,
          })),
        },
      },
      include: {
        stops: {
          orderBy: [{ day: 'asc' }, { order: 'asc' }],
        },
      },
    })

    revalidatePath('/rutas')

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear la ruta.' }
  }
}

export async function updateRouteStatusAction(
  input: unknown
): Promise<ActionResponse<Route>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Solo administradores.' }
    }

    const { routeStatusUpdateSchema } = await import('@/schemas/route.schema')
    const parsed = routeStatusUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const updated = await prisma.route.update({
      where: { id: parsed.data.routeId },
      data: { status: parsed.data.status },
    })

    revalidatePath('/rutas')
    revalidatePath('/admin/rutas')

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar.' }
  }
}
