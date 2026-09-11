import { z } from 'zod'
import { selectPlanForClaim } from '@/lib/billing/service'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'

const selectionSchema = z.object({
  planSlug: z.enum(['free', 'plus', 'pro', 'red']),
  cycle: z.enum(['MONTHLY', 'ANNUAL']),
  idempotencyKey: z.string().trim().min(8).max(120),
  device: z.string().trim().max(40).optional().nullable(),
})

export const POST = withMobileErrors(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para seleccionar un plan.', 401)
  const parsed = selectionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La selección no es válida.', 422, parsed.error.flatten().fieldErrors)
  try {
    return mobileSuccess(await selectPlanForClaim({ userId: principal.userId, claimId: (await params).id, ...parsed.data }))
  } catch (error) {
    return mobileError('PLAN_SELECTION_FAILED', error instanceof Error ? error.message : 'No se pudo seleccionar el plan.', 409)
  }
})
