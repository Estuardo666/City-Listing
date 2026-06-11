'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import type { ActionResponse } from '@/types/action-response'
import type { ExtractedData } from '@/lib/ai/pipeline'

interface ConfirmInput {
  logId: string
  extracted: ExtractedData
  venueIds: string[]
  duplicateEventId?: string | null
  eventName?: string
}

export async function confirmProcessingAction(input: ConfirmInput): Promise<ActionResponse<{ id: string; slug: string }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const { logId, extracted, venueIds, duplicateEventId, eventName } = input

    let watchEventId: string
    let watchEventSlug: string

    if (duplicateEventId) {
      const existing = await prisma.watchEvent.findUnique({
        where: { id: duplicateEventId },
      })
      if (!existing) {
        return { success: false, error: 'El evento duplicado ya no existe.' }
      }
      watchEventId = existing.id
      watchEventSlug = existing.slug
    } else {
      const performersStr = extracted.performers.join(' vs ')
      const name = eventName || performersStr || 'Evento sin nombre'
      const slug = await generateUniqueWatchEventSlug(name)
      const performersJson = JSON.stringify(extracted.performers)

      const matchDate = extracted.matchDate
        ? new Date(extracted.matchDate + 'T' + (extracted.matchTime || '00:00') + ':00')
        : new Date()

      const created = await prisma.watchEvent.create({
        data: {
          name,
          slug,
          type: extracted.type,
          description: extracted.description,
          image: null,
          matchDate,
          matchTime: extracted.matchTime,
          competition: extracted.competition,
          performers: performersJson,
          status: 'ACTIVE',
          performersList: {
            create: extracted.performers.map((p) => ({
              performer: {
                connectOrCreate: {
                  where: { slug: slugify(p) },
                  create: { name: p, slug: slugify(p), type: extracted.type === 'SPORTS' ? 'TEAM' : 'ARTIST' },
                },
              },
            })),
          },
        },
      })
      watchEventId = created.id
      watchEventSlug = created.slug
    }

    for (const venueId of venueIds) {
      await prisma.watchEventVenue.upsert({
        where: {
          watchEventId_venueId: { watchEventId, venueId },
        },
        create: {
          watchEventId,
          venueId,
          hasBigScreen: extracted.hasBigScreen,
          hasFreeEntry: extracted.hasFreeEntry,
          promotion: extracted.promotions.length > 0 ? extracted.promotions.join(', ') : null,
        },
        update: {
          hasBigScreen: extracted.hasBigScreen,
          hasFreeEntry: extracted.hasFreeEntry,
          promotion: extracted.promotions.length > 0 ? extracted.promotions.join(', ') : null,
        },
      })
    }

    await prisma.aIProcessingLog.update({
      where: { id: logId },
      data: { status: 'CONFIRMED', watchEventId },
    })

    revalidatePath('/admin/transmisiones')
    revalidatePath('/partidos')
    revalidatePath(`/partidos/${watchEventSlug}`)

    return { success: true, data: { id: watchEventId, slug: watchEventSlug } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error confirmando el procesamiento.'
    return { success: false, error: message }
  }
}

async function generateUniqueWatchEventSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName)
  let candidateSlug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await prisma.watchEvent.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    })
    if (!existing) return candidateSlug
    suffix++
    candidateSlug = `${baseSlug}-${suffix}`
  }
}
