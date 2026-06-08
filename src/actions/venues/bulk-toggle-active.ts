'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'

const bulkToggleSchema = z.object({
  venueIds: z.array(z.string().min(1)).min(1, 'Selecciona al menos un local.'),
  isActive: z.boolean(),
})

export async function bulkToggleActiveAction(
  venueIds: string[],
  isActive: boolean
): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden cambiar el estado de locales.',
      }
    }

    const parsed = bulkToggleSchema.safeParse({ venueIds, isActive })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const result = await prisma.venue.updateMany({
      where: { id: { in: parsed.data.venueIds } },
      data: { isActive: parsed.data.isActive },
    })

    revalidatePath('/locales')
    revalidatePath('/admin')
    revalidatePath('/admin/locales')
    revalidatePath('/dashboard')
    for (const id of parsed.data.venueIds) {
      await invalidateVenueCache(id)
    }

    return {
      success: true,
      data: { count: result.count },
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo actualizar el estado de los locales. Intenta nuevamente.',
    }
  }
}
