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

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden eliminar eventos.',
      }
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, slug: true },
    })

    if (!existingEvent) {
      return {
        success: false,
        error: 'Evento no encontrado.',
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
