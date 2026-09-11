import { z } from 'zod'
import { checkoutAddon } from '@/lib/billing/service'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'

const addonSchema = z.object({
  addonSlug: z.string().trim().min(1).max(80),
  idempotencyKey: z.string().trim().min(8).max(120),
  venueId: z.string().trim().min(1).optional().nullable(),
  eventId: z.string().trim().min(1).optional().nullable(),
  device: z.string().trim().max(40).optional().nullable(),
})

export const POST = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para comprar un producto.', 401)
  const parsed = addonSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La compra no es válida.', 422, parsed.error.flatten().fieldErrors)
  try {
    return mobileSuccess(await checkoutAddon({ userId: principal.userId, ...parsed.data }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo registrar la compra.'
    const code = message.includes('últimos 30 días') ? 'ADDON_COOLDOWN' : message.includes('pausada') ? 'BILLING_DISABLED' : 'ADDON_CHECKOUT_FAILED'
    return mobileError(code, message, 409)
  }
})
