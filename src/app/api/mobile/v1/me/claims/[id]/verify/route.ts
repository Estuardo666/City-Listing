import { z } from 'zod'

import { verifyClaimCode } from '@/lib/claims/service'
import { claimFailureResponse } from '@/lib/claims/mobile-errors'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { checkMobileRateLimit } from '@/lib/mobile-rate-limit'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'

const schema = z.object({ code: z.string().length(6).regex(/^\d{6}$/) })

export const POST = withMobileErrors(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const principal = await getMobilePrincipal(request)
    if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para verificar tu reclamo.', 401)

    // The per-claim attempt budget lives in the service; this only stops a
    // client from hammering the endpoint across many claims.
    const allowed = await checkMobileRateLimit(request, `claim-verify:${principal.userId}`)
    if (!allowed) return mobileError('RATE_LIMITED', 'Demasiados intentos. Prueba más tarde.', 429)

    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return mobileError('VALIDATION_ERROR', 'El código debe tener 6 dígitos.', 422)
    }

    const { id } = await context.params
    const result = await verifyClaimCode(principal.userId, { claimId: id, code: parsed.data.code })

    if (!result.ok) return claimFailureResponse(result.reason, result.message)
    return mobileSuccess(result.data)
  },
)
