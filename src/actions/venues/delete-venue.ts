'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
import type { ActionResponse } from '@/types/action-response'
import { canManageVenue } from '@/lib/billing/plans'

export async function deleteVenueAction(venueId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para eliminar locales.',
      }
    }

    const existingVenue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, userId: true },
    })

    if (!existingVenue) {
      return {
        success: false,
        error: 'Local no encontrado.',
      }
    }

    const isOwner = await canManageVenue(session.user.id, venueId, ['OWNER', 'ADMIN'])
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar este local.',
      }
    }

    await prisma.venue.delete({
      where: { id: venueId },
    })

    revalidatePath('/locales')
    revalidatePath('/admin')
    revalidatePath('/admin/locales')
    revalidatePath('/dashboard')
    await invalidateVenueCache(venueId)

    return {
      success: true,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo eliminar el local. Intenta nuevamente.',
    }
  }
}
