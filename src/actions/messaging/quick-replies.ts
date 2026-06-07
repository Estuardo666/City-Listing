'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

const MAX_QUICK_REPLIES = 10

export async function createQuickReplyAction(
  title: string,
  content: string,
  venueId?: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    if (!title?.trim()) {
      return { success: false, error: 'El título no puede estar vacío.' }
    }

    if (!content?.trim()) {
      return { success: false, error: 'El contenido no puede estar vacío.' }
    }

    const count = await prisma.quickReply.count({
      where: {
        userId: session.user.id,
        venueId: venueId || null,
      },
    })

    if (count >= MAX_QUICK_REPLIES) {
      return {
        success: false,
        error: `Máximo ${MAX_QUICK_REPLIES} respuestas rápidas.`,
      }
    }

    const quickReply = await prisma.quickReply.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        userId: session.user.id,
        venueId: venueId || null,
      },
    })

    revalidatePath(`/dashboard/mensajes`)
    if (venueId) {
      revalidatePath(`/dashboard/locales/${venueId}/mensajes`)
    }

    return { success: true, data: { id: quickReply.id } }
  } catch {
    return { success: false, error: 'No se pudo crear la respuesta rápida.' }
  }
}

export async function updateQuickReplyAction(
  id: string,
  title: string,
  content: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    if (!title?.trim()) {
      return { success: false, error: 'El título no puede estar vacío.' }
    }

    if (!content?.trim()) {
      return { success: false, error: 'El contenido no puede estar vacío.' }
    }

    const quickReply = await prisma.quickReply.findUnique({
      where: { id },
      select: { userId: true, venueId: true },
    })

    if (!quickReply || quickReply.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso para editar esta respuesta rápida.' }
    }

    await prisma.quickReply.update({
      where: { id },
      data: {
        title: title.trim(),
        content: content.trim(),
      },
    })

    revalidatePath(`/dashboard/mensajes`)
    if (quickReply.venueId) {
      revalidatePath(`/dashboard/locales/${quickReply.venueId}/mensajes`)
    }

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo actualizar la respuesta rápida.' }
  }
}

export async function deleteQuickReplyAction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const quickReply = await prisma.quickReply.findUnique({
      where: { id },
      select: { userId: true, venueId: true },
    })

    if (!quickReply || quickReply.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso para eliminar esta respuesta rápida.' }
    }

    await prisma.quickReply.delete({
      where: { id },
    })

    revalidatePath(`/dashboard/mensajes`)
    if (quickReply.venueId) {
      revalidatePath(`/dashboard/locales/${quickReply.venueId}/mensajes`)
    }

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar la respuesta rápida.' }
  }
}

export async function getQuickRepliesAction(venueId?: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return []
    }

    const quickReplies = await prisma.quickReply.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { venueId: null },
          { venueId: venueId || null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    return quickReplies
  } catch {
    return []
  }
}
