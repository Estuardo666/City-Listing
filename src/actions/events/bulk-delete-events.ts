'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateEventCache } from '@/lib/cache-invalidation'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'

const bulkDeleteSchema = z.array(z.string().min(1)).min(1, 'Selecciona al menos un evento.')

export async function bulkDeleteEventsAction(eventIds: string[]): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para eliminar eventos.',
      }
    }

    const parsed = bulkDeleteSchema.safeParse(eventIds)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const isAdmin = session.user.role === 'ADMIN'

    const events = await prisma.event.findMany({
      where: { id: { in: parsed.data } },
      select: { id: true, userId: true },
    })

    if (events.length === 0) {
      return {
        success: false,
        error: 'No se encontraron eventos para eliminar.',
      }
    }

    const allowedIds = isAdmin
      ? events.map((e) => e.id)
      : events.filter((e) => e.userId === session.user.id).map((e) => e.id)

    if (allowedIds.length === 0) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar estos eventos.',
      }
    }

    const result = await prisma.event.deleteMany({
      where: { id: { in: allowedIds } },
    })

    revalidatePath('/eventos')
    revalidatePath('/admin')
    revalidatePath('/admin/eventos')
    revalidatePath('/dashboard')
    for (const id of allowedIds) {
      await invalidateEventCache(id)
    }

    return {
      success: true,
      data: { count: result.count },
    }
  } catch {
    return {
      success: false,
      error: 'No se pudieron eliminar los eventos. Intenta nuevamente.',
    }
  }
}
