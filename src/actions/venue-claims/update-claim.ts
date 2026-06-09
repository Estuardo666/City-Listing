'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { venueClaimUpdateSchema } from '@/schemas/venue-claim.schema'
import type { ActionResponse } from '@/types/action-response'
import type { VenueClaim } from '@prisma/client'

export async function updateVenueClaimStatusAction(
  input: unknown,
): Promise<ActionResponse<VenueClaim>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Solo administradores pueden gestionar reclamos.' }
    }

    const parsed = venueClaimUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const claim = await prisma.venueClaim.findUnique({
      where: { id: parsed.data.claimId },
      include: { venue: { select: { id: true, slug: true } } },
    })

    if (!claim) {
      return { success: false, error: 'Reclamo no encontrado.' }
    }

    const updated = await prisma.venueClaim.update({
      where: { id: parsed.data.claimId },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes,
      },
    })

    // Si se aprueba → transferir ownership
    if (parsed.data.status === 'APPROVED') {
      await prisma.venue.update({
        where: { id: claim.venueId },
        data: {
          claimed: true,
          claimedBy: claim.userId,
          verified: true,
          badge: 'VERIFIED',
        },
      })
    }

    revalidatePath('/admin/reclamos')
    revalidatePath(`/locales/${claim.venue.slug}`)

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar el reclamo.' }
  }
}
