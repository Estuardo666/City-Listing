'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import type { ActionResponse } from '@/types/action-response'

interface WatchEventInput {
  name: string
  type: string
  description?: string
  matchDate: string
  matchTime?: string
  competition?: string
  image?: string
  featured?: boolean
  status?: string
  venueIds?: string[]
  performerNames?: string[]
}

export async function createWatchEventAction(input: WatchEventInput): Promise<ActionResponse<{ id: string; slug: string }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const slug = await generateUniqueSlug(input.name)
    const matchDate = new Date(input.matchDate + 'T' + (input.matchTime || '00:00') + ':00')

    const created = await prisma.watchEvent.create({
      data: {
        name: input.name,
        slug,
        type: input.type,
        description: input.description,
        image: input.image,
        matchDate,
        matchTime: input.matchTime,
        competition: input.competition,
        performers: input.performerNames ? JSON.stringify(input.performerNames) : null,
        featured: input.featured || false,
        status: input.status || 'ACTIVE',
      },
    })

    if (input.performerNames?.length) {
      for (const name of input.performerNames) {
        const performerSlug = slugify(name)
        await prisma.watchEventPerformer.upsert({
          where: { slug: performerSlug },
          update: {},
          create: { name, slug: performerSlug, type: input.type === 'SPORTS' ? 'TEAM' : 'ARTIST' },
        })
        const performer = await prisma.watchEventPerformer.findUnique({ where: { slug: performerSlug } })
        if (performer) {
          await prisma.watchEventPerformerLink.create({
            data: { watchEventId: created.id, performerId: performer.id },
          })
        }
      }
    }

    if (input.venueIds?.length) {
      await prisma.watchEventVenue.createMany({
        data: input.venueIds.map((venueId) => ({
          watchEventId: created.id,
          venueId,
        })),
      })
    }

    revalidatePath('/admin/transmisiones')
    revalidatePath('/partidos')

    return { success: true, data: { id: created.id, slug: created.slug } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error creando evento.' }
  }
}

export async function updateWatchEventAction(id: string, input: WatchEventInput): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const existing = await prisma.watchEvent.findUnique({ where: { id } })
    if (!existing) return { success: false, error: 'Evento no encontrado.' }

    const matchDate = new Date(input.matchDate + 'T' + (input.matchTime || '00:00') + ':00')

    await prisma.watchEvent.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        description: input.description,
        image: input.image,
        matchDate,
        matchTime: input.matchTime,
        competition: input.competition,
        performers: input.performerNames ? JSON.stringify(input.performerNames) : existing.performers,
        featured: input.featured,
        status: input.status,
      },
    })

    if (input.venueIds) {
      await prisma.watchEventVenue.deleteMany({ where: { watchEventId: id } })
      if (input.venueIds.length > 0) {
        await prisma.watchEventVenue.createMany({
          data: input.venueIds.map((venueId) => ({
            watchEventId: id,
            venueId,
          })),
        })
      }
    }

    revalidatePath('/admin/transmisiones')
    revalidatePath('/partidos')
    revalidatePath(`/partidos/${existing.slug}`)

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error actualizando evento.' }
  }
}

export async function deleteWatchEventAction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    await prisma.watchEvent.delete({ where: { id } })

    revalidatePath('/admin/transmisiones')
    revalidatePath('/partidos')

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error eliminando evento.' }
  }
}

export async function getWatchEventsAction(): Promise<ActionResponse<Array<{
  id: string
  name: string
  slug: string
  type: string
  matchDate: Date
  matchTime: string | null
  competition: string | null
  status: string
  featured: boolean
  venuesCount: number
  createdAt: Date
}>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const events = await prisma.watchEvent.findMany({
      orderBy: { matchDate: 'desc' },
      include: { _count: { select: { venues: true } } },
    })

    return {
      success: true,
      data: events.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        type: e.type,
        matchDate: e.matchDate,
        matchTime: e.matchTime,
        competition: e.competition,
        status: e.status,
        featured: e.featured,
        venuesCount: e._count.venues,
        createdAt: e.createdAt,
      })),
    }
  } catch {
    return { success: false, error: 'Error obteniendo eventos.' }
  }
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName)
  let candidateSlug = baseSlug
  let suffix = 1
  while (true) {
    const existing = await prisma.watchEvent.findUnique({ where: { slug: candidateSlug }, select: { id: true } })
    if (!existing) return candidateSlug
    suffix++
    candidateSlug = `${baseSlug}-${suffix}`
  }
}
