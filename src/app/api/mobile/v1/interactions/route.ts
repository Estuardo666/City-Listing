import { z } from 'zod'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { checkMobileRateLimit } from '@/lib/mobile-rate-limit'
import { recordDirections } from '@/lib/interactions'
const schema = z.object({ action: z.literal('directions'), kind: z.enum(['venue', 'event', 'route']),
  itemId: z.string().trim().min(1).max(100), source: z.enum(['web', 'ios', 'android']) }).strict()

export const POST = withMobileErrors(async (request: Request) => {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return mobileError('FORBIDDEN', 'Origen no permitido.', 403)
  if (!await checkMobileRateLimit(request, 'interactions', { max: 60 })) return mobileError('RATE_LIMITED', 'Inténtalo más tarde.', 429)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'Interacción inválida.', 422)
  const { kind, itemId, source } = parsed.data
  const result = await recordDirections(request, kind, itemId, source)
  if (!result.found) return mobileError('NOT_FOUND', 'Contenido no disponible.', 404)
  return mobileSuccess({ recorded: result.recorded })
})
