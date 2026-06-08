'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
import type { ActionResponse } from '@/types/action-response'

export async function toggleVenueActiveAction(venueId: string): Promise<ActionResponse<{ isActive: boolean }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden activar/desactivar locales.',
      }
    }

    const existingVenue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, isActive: true },
    })

    if (!existingVenue) {
      return {
        success: false,
        error: 'Local no encontrado.',
      }
    }

    const updated = await prisma.venue.update({
      where: { id: venueId },
      data: { isActive: !existingVenue.isActive },
      select: { id: true, isActive: true },
    })

    revalidatePath('/locales')
    revalidatePath('/admin')
    revalidatePath('/admin/locales')
    revalidatePath('/dashboard')
    await invalidateVenueCache(venueId)

    return {
      success: true,
      data: { isActive: updated.isActive },
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo actualizar el estado del local. Intenta nuevamente.',
    }
  }
}
