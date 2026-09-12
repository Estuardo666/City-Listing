import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { createTicketHold } from '@/lib/ticketing'
import { requireIdempotencyKey } from '@/lib/ticketing/http'
import { z } from 'zod'

const schema = z.object({
  eventSlug: z.string().trim().min(1).max(160),
  sessionKey: z.string().trim().min(8).max(160),
  items: z.array(z.object({ ticketTypeId: z.string().min(1), quantity: z.number().int().min(1).max(10), eventSeatIds: z.array(z.string().min(1)).max(10).optional() })).min(1).max(50),
})

export const POST = withMobileErrors(async (request: Request) => {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400)
  const principal = await getMobilePrincipal(request)
  return mobileSuccess(await createTicketHold({ ...parsed.data, idempotencyKey: requireIdempotencyKey(request), buyerUserId: principal?.userId ?? null }))
})
