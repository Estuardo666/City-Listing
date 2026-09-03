import { z } from 'zod'

import { attachClaimEvidence } from '@/lib/claims/service'
import { claimFailureResponse } from '@/lib/claims/mobile-errors'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'

/**
 * The file itself is uploaded through `/me/uploads`, which already handles
 * multipart and R2; this only records the resulting URL against the claim and
 * re-scores it.
 */
const schema = z.object({
  evidenceUrl: z.string().url().max(2_000),
  evidenceName: z.string().trim().max(200).nullable().optional(),
})

export const POST = withMobileErrors(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const principal = await getMobilePrincipal(request)
    if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para adjuntar evidencia.', 401)

    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return mobileError(
        'VALIDATION_ERROR',
        'La evidencia no es válida.',
        422,
        parsed.error.flatten().fieldErrors,
      )
    }

    const { id } = await context.params
    const result = await attachClaimEvidence(principal.userId, {
      claimId: id,
      evidenceUrl: parsed.data.evidenceUrl,
      evidenceName: parsed.data.evidenceName ?? null,
    })

    if (!result.ok) return claimFailureResponse(result.reason, result.message)
    return mobileSuccess(result.data)
  },
)
