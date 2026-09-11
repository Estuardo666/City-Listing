import { z } from 'zod'
import { checkoutSubscription } from '@/lib/billing/service'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'

const checkoutSchema = z.object({
  planSlug: z.enum(['free', 'plus', 'pro', 'red']),
  cycle: z.enum(['MONTHLY', 'ANNUAL']),
  idempotencyKey: z.string().trim().min(8).max(120),
  device: z.string().trim().max(40).optional().nullable(),
})

export const POST = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para activar un plan.', 401)
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El checkout no es válido.', 422, parsed.error.flatten().fieldErrors)
  try {
    const order = await checkoutSubscription({ userId: principal.userId, ...parsed.data })
    return mobileSuccess(order)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo activar el plan.'
    const code = message.includes('Red') ? 'PLAN_CONTACT_REQUIRED' : message.includes('pausada') ? 'BILLING_DISABLED' : 'CHECKOUT_FAILED'
    return mobileError(code, message, 409)
  }
})
