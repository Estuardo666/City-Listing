'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eventStatusUpdateSchema } from '@/schemas/event.schema'
import { invalidateEventCache } from '@/lib/cache-invalidation'
import type { ActionResponse } from '@/types/action-response'
import type { EventWithRelations } from '@/types/event'

export async function updateEventStatusAction(
  input: unknown
): Promise<ActionResponse<EventWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden cambiar el estado.',
      }
    }

    const parsed = eventStatusUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos para actualizar estado.',
      }
    }

    const updated = await prisma.event.update({
      where: {
        id: parsed.data.eventId,
      },
      data: {
        status: parsed.data.status,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        venue: true,
        media: { orderBy: { order: 'asc' } },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
        },
        recurrenceRule: true,
      },
    })

    revalidatePath('/eventos')
    revalidatePath(`/eventos/${updated.slug}`)
    revalidatePath('/admin')
    revalidatePath('/admin/eventos')
    revalidatePath('/dashboard')
    await invalidateEventCache(parsed.data.eventId)

    return {
      success: true,
      data: updated,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo actualizar el estado del evento.',
    }
  }
}
