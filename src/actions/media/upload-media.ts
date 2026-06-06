'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mediaUploadSchema } from '@/schemas/media.schema'
import type { ActionResponse } from '@/types/action-response'
import type { Media } from '@prisma/client'

const MAX_MEDIA_ITEMS = 20

export async function uploadMediaAction(
  entityType: 'venue' | 'event' | 'post',
  entityId: string,
  input: unknown
): Promise<ActionResponse<Media>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const parsed = mediaUploadSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const count = await prisma.media.count({
      where: {
        [`${entityType}Id`]: entityId,
      },
    })

    if (count >= MAX_MEDIA_ITEMS) {
      return {
        success: false,
        error: `Máximo ${MAX_MEDIA_ITEMS} archivos multimedia por ${entityType === 'venue' ? 'local' : entityType === 'event' ? 'evento' : 'artículo'}.`,
      }
    }

    const created = await prisma.media.create({
      data: {
        url: parsed.data.url,
        alt: parsed.data.alt,
        type: parsed.data.type,
        order: count,
        [`${entityType}Id`]: entityId,
      },
    })

    if (entityType === 'venue') {
      const venue = await prisma.venue.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    } else if (entityType === 'event') {
      const event = await prisma.event.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (event) revalidatePath(`/eventos/${event.slug}`)
    } else {
      const post = await prisma.post.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (post) revalidatePath(`/blog/${post.slug}`)
    }

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo subir el archivo. Intenta nuevamente.' }
  }
}

export async function deleteMediaAction(mediaId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, venueId: true, eventId: true, postId: true },
    })

    if (!media) {
      return { success: false, error: 'Archivo no encontrado.' }
    }

    await prisma.media.delete({ where: { id: mediaId } })

    if (media.venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: media.venueId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    } else if (media.eventId) {
      const event = await prisma.event.findUnique({ where: { id: media.eventId }, select: { slug: true } })
      if (event) revalidatePath(`/eventos/${event.slug}`)
    } else if (media.postId) {
      const post = await prisma.post.findUnique({ where: { id: media.postId }, select: { slug: true } })
      if (post) revalidatePath(`/blog/${post.slug}`)
    }

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar el archivo.' }
  }
}

export async function reorderMediaAction(
  entityType: 'venue' | 'event' | 'post',
  entityId: string,
  items: { id: string; order: number }[]
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    await Promise.all(
      items.map((item) =>
        prisma.media.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    )

    if (entityType === 'venue') {
      const venue = await prisma.venue.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    } else if (entityType === 'event') {
      const event = await prisma.event.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (event) revalidatePath(`/eventos/${event.slug}`)
    } else {
      const post = await prisma.post.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (post) revalidatePath(`/blog/${post.slug}`)
    }

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudieron reordenar los archivos.' }
  }
}
