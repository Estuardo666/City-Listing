import { claimFailureResponse } from '@/lib/claims/mobile-errors'
import { createClaim } from '@/lib/claims/service'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { checkMobileRateLimit } from '@/lib/mobile-rate-limit'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { claimSubmitSchema } from '@/schemas/venue-claim.schema'

export const GET = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus reclamos.', 401)

  const claims = await prisma.venueClaim.findMany({
    where: { userId: principal.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      status: true,
      verified: true,
      confidenceScore: true,
      evidenceUrl: true,
      evidenceName: true,
      createdAt: true,
      venue: { select: { id: true, name: true, slug: true, image: true } },
    },
  })

  return mobileSuccess(claims)
})

export const POST = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para reclamar un local.', 401)

  // A claim mails a verification code, so it is rate limited like the auth
  // routes rather than left open to enumeration.
  const allowed = await checkMobileRateLimit(request, `claims:${principal.userId}`)
  if (!allowed) {
    return mobileError('RATE_LIMITED', 'Demasiados intentos. Prueba más tarde.', 429)
  }

  const parsed = claimSubmitSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return mobileError(
      'VALIDATION_ERROR',
      'El reclamo no es válido.',
      422,
      parsed.error.flatten().fieldErrors,
    )
  }

  const result = await createClaim(principal.userId, {
    venueId: parsed.data.venueId,
    claimerName: parsed.data.claimerName,
    claimerEmail: parsed.data.claimerEmail,
    claimerPhone: parsed.data.claimerPhone,
    claimerRole: parsed.data.claimerRole,
    message: parsed.data.message,
  })

  if (!result.ok) return claimFailureResponse(result.reason, result.message)

  return mobileSuccess(
    {
      claimId: result.data.claimId,
      venueSlug: result.data.venueSlug,
      confidenceScore: result.data.confidenceScore,
    },
    { verification: 'CODE_SENT' },
  )
})
