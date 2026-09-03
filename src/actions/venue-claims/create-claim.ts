'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClaim } from '@/lib/claims/service'
import { claimSubmitSchema } from '@/schemas/venue-claim.schema'
import type { ActionResponse } from '@/types/action-response'

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

    // Shared with the mobile API so both surfaces score claims, expire codes
    // and budget retries identically.
    const result = await createClaim(session.user.id, {
      venueId: parsed.data.venueId,
      claimerName: parsed.data.claimerName,
      claimerEmail: parsed.data.claimerEmail,
      claimerPhone: parsed.data.claimerPhone,
      claimerRole: parsed.data.claimerRole,
      message: parsed.data.message,
    })

    if (!result.ok) {
      return { success: false, error: result.message }
    }

    revalidatePath(`/locales/${result.data.venueSlug}`)

    return {
      success: true,
      data: {
        claimId: result.data.claimId,
        message: 'Código de verificación enviado a tu correo.',
      },
    }
  } catch {
    return { success: false, error: 'No se pudo crear el reclamo.' }
  }
}
