'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { claimSubmitSchema } from '@/schemas/venue-claim.schema'
import { sendClaimVerificationEmail } from '@/lib/email/templates/claim-verification'
import { recalculateConfidenceScore } from '@/lib/claims/confidence'
import type { ActionResponse } from '@/types/action-response'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createVenueClaimAction(
  input: unknown,
): Promise<ActionResponse<{ claimId: string; message: string }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const parsed = claimSubmitSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const { venueId, claimerName, claimerEmail, claimerPhone, claimerRole, message } = parsed.data

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, userId: true, slug: true, name: true },
    })
    if (!venue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    if (venue.userId === session.user.id) {
      return { success: false, error: 'Ya eres el dueño de este local.' }
    }

    // Verificar si ya tiene un claim activo
    const existingClaim = await prisma.venueClaim.findFirst({
      where: {
        venueId,
        userId: session.user.id,
        status: { in: ['PENDING', 'VERIFIED'] },
      },
    })
    if (existingClaim) {
      return { success: false, error: 'Ya tienes un reclamo activo para este local.' }
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const claim = await prisma.venueClaim.create({
      data: {
        venueId,
        userId: session.user.id,
        claimerName,
        claimerEmail,
        claimerPhone,
        claimerRole,
        message,
        verificationCode: code,
        codeExpiresAt: expiresAt,
        attempts: 0,
        verified: false,
        status: 'PENDING',
      },
    })

    // Score inicial: usuario registrado = +20
    await recalculateConfidenceScore(claim.id)

    // Enviar email
    const emailResult = await sendClaimVerificationEmail(claimerEmail, claimerName, code)
    if (!emailResult.success) {
      console.error('Error sending verification email:', emailResult.error)
    }

    revalidatePath(`/locales/${venue.slug}`)

    return {
      success: true,
      data: {
        claimId: claim.id,
        message: 'Código de verificación enviado a tu correo.',
      },
    }
  } catch {
    return { success: false, error: 'No se pudo crear el reclamo.' }
  }
}
