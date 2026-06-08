'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateEventCache } from '@/lib/cache-invalidation'
import type { ActionResponse } from '@/types/action-response'

export async function deleteEventAction(eventId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para eliminar eventos.',
      }
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, userId: true },
    })

    if (!existingEvent) {
      return {
        success: false,
        error: 'Evento no encontrado.',
      }
    }

    const isOwner = existingEvent.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar este evento.',
      }
    }

    await prisma.event.delete({
      where: { id: eventId },
    })

    revalidatePath('/eventos')
    revalidatePath('/admin')
    revalidatePath('/admin/eventos')
    revalidatePath('/dashboard')
    await invalidateEventCache(eventId)

    return {
      success: true,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo eliminar el evento. Intenta nuevamente.',
    }
  }
}
