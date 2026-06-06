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
    const validStops = parsedStops
      .filter((r) => r.success)
      .map((r) => (r as { success: true; data: typeof routeStopSchema._type }).data)

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
        featured: parsed.data.featured,
        status: 'PENDING',
        userId: session.user.id,
        stops: {
          create: validStops.map((stop) => ({
            venueId: stop.venueId,
            title: stop.title,
            notes: stop.notes,
            duration: stop.duration,
            order: stop.order,
          })),
        },
      },
      include: {
        stops: {
          orderBy: { order: 'asc' },
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
