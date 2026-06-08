'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'

const bulkDeleteSchema = z.array(z.string().min(1)).min(1, 'Selecciona al menos un local.')

export async function bulkDeleteVenuesAction(venueIds: string[]): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para eliminar locales.',
      }
    }

    const parsed = bulkDeleteSchema.safeParse(venueIds)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const isAdmin = session.user.role === 'ADMIN'

    const venues = await prisma.venue.findMany({
      where: { id: { in: parsed.data } },
      select: { id: true, userId: true },
    })

    if (venues.length === 0) {
      return {
        success: false,
        error: 'No se encontraron locales para eliminar.',
      }
    }

    const allowedIds = isAdmin
      ? venues.map((v) => v.id)
      : venues.filter((v) => v.userId === session.user.id).map((v) => v.id)

    if (allowedIds.length === 0) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar estos locales.',
      }
    }

    const result = await prisma.venue.deleteMany({
      where: { id: { in: allowedIds } },
    })

    revalidatePath('/locales')
    revalidatePath('/admin')
    revalidatePath('/admin/locales')
    revalidatePath('/dashboard')
    for (const id of allowedIds) {
      await invalidateVenueCache(id)
    }

    return {
      success: true,
      data: { count: result.count },
    }
  } catch {
    return {
      success: false,
      error: 'No se pudieron eliminar los locales. Intenta nuevamente.',
    }
  }
}
