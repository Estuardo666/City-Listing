'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
import type { ActionResponse } from '@/types/action-response'

export async function bulkUpdateVenuesAction(
  venueIds: string[],
  status: 'APPROVED' | 'REJECTED'
): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' }
    }

    if (!venueIds || venueIds.length === 0) {
      return { success: false, error: 'No se seleccionaron locales' }
    }

    const result = await prisma.venue.updateMany({
      where: { id: { in: venueIds } },
      data: { status },
    })

    for (const venueId of venueIds) {
      await invalidateVenueCache(venueId)
    }

    revalidatePath('/locales')
    revalidatePath('/admin/locales')
    revalidatePath('/admin/imports/google/drafts')

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error('Error in bulkUpdateVenuesAction:', error)
    return { success: false, error: 'Error al actualizar locales' }
  }
}
