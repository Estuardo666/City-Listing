'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyUser } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'
import { venueClaimUpdateSchema } from '@/schemas/venue-claim.schema'
import type { ActionResponse } from '@/types/action-response'
import type { VenueClaim } from '@prisma/client'
import { approveClaimWithBilling, rejectClaimWithBilling } from '@/lib/billing/service'

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
      include: { venue: { select: { id: true, slug: true, name: true } } },
    })

    if (!claim) {
      return { success: false, error: 'Reclamo no encontrado.' }
    }

    let updated: VenueClaim
    if (parsed.data.status === 'APPROVED') {
      updated = await approveClaimWithBilling(parsed.data.claimId, session.user.id)
      if (parsed.data.adminNotes) {
        updated = await prisma.venueClaim.update({ where: { id: updated.id }, data: { adminNotes: parsed.data.adminNotes } })
      }
    } else if (parsed.data.status === 'REJECTED') {
      updated = await rejectClaimWithBilling(parsed.data.claimId, session.user.id)
      if (parsed.data.adminNotes) {
        updated = await prisma.venueClaim.update({ where: { id: updated.id }, data: { adminNotes: parsed.data.adminNotes } })
      }
    } else {
      updated = await prisma.venueClaim.update({
        where: { id: parsed.data.claimId },
        data: { status: parsed.data.status, adminNotes: parsed.data.adminNotes },
      })
    }

    // The claimant is waiting on this decision, so it is pushed to whichever
    // surface they used to file it.
    const outcome =
      parsed.data.status === 'APPROVED'
        ? `Ya administras ${claim.venue.name} en Vive Loja.`
        : parsed.data.status === 'REJECTED'
          ? `No pudimos verificar tu reclamo de ${claim.venue.name}.`
          : `Tu reclamo de ${claim.venue.name} cambió a ${parsed.data.status}.`

    notifyUser(claim.userId, {
      type: 'claimUpdates',
      title: 'Actualización de tu reclamo',
      body: outcome,
      target: { kind: 'venue', slug: claim.venue.slug },
      collapseId: `claim-${claim.id}`,
      data: { claimId: claim.id, status: parsed.data.status },
    }).catch(() => {})

    revalidatePath('/admin/reclamos')
    revalidatePath(`/locales/${claim.venue.slug}`)

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar el reclamo.' }
  }
}
