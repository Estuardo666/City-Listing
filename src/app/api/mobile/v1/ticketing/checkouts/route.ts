import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { createTicketCheckout } from '@/lib/ticketing'
import { requireIdempotencyKey } from '@/lib/ticketing/http'
import { z } from 'zod'

const schema = z.object({
  holdToken: z.string().trim().min(20).max(100),
  buyerName: z.string().trim().min(2).max(160),
  buyerEmail: z.string().trim().email().max(254),
  buyerPhone: z.string().trim().min(7).max(30),
  billingDocumentId: z.string().trim().max(30).optional().nullable(),
})

export const POST = withMobileErrors(async (request: Request) => {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400)
  return mobileSuccess(await createTicketCheckout({ ...parsed.data, idempotencyKey: requireIdempotencyKey(request) }))
})
