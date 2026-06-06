'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { venueClaimSchema, venueClaimUpdateSchema } from '@/schemas/venue-claim.schema'
import type { ActionResponse } from '@/types/action-response'
import type { VenueClaim } from '@prisma/client'

export async function createVenueClaimAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<VenueClaim>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, userId: true, slug: true },
    })

    if (!venue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    if (venue.userId === session.user.id) {
      return { success: false, error: 'Ya eres el dueño de este local.' }
    }

    const existingClaim = await prisma.venueClaim.findFirst({
      where: {
        venueId,
        status: 'PENDING',
      },
    })

    if (existingClaim) {
      return {
        success: false,
        error: 'Ya existe un reclamo pendiente para este local.',
      }
    }

    const parsed = venueClaimSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const created = await prisma.venueClaim.create({
      data: {
        venueId,
        userId: session.user.id,
        message: parsed.data.message,
        proof: parsed.data.proof,
        status: 'PENDING',
      },
    })

    revalidatePath(`/locales/${venue.slug}`)

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear el reclamo.' }
  }
}

export async function updateVenueClaimStatusAction(
  input: unknown
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
