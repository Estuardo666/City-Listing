import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { canScanEvent, checkInTicket } from '@/lib/ticketing'
import { requireIdempotencyKey } from '@/lib/ticketing/http'
import { z } from 'zod'

const schema = z.object({ eventId: z.string().min(1), token: z.string().trim().min(20).max(200), deviceId: z.string().trim().max(160).optional().nullable() })

export const POST = withMobileErrors(async (request: Request) => {
  requireIdempotencyKey(request)
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para validar entradas.', 401)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('INVALID_INPUT', 'El QR no es válido.', 400)
  if (!(await canScanEvent(principal.userId, parsed.data.eventId, principal.role === 'ADMIN'))) return mobileError('FORBIDDEN', 'No tienes permiso para validar este evento.', 403)
  return mobileSuccess(await checkInTicket({ ...parsed.data, scannerUserId: principal.userId }))
})
