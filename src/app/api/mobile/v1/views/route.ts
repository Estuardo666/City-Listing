import { z } from 'zod'

import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { anonymousViewerId, recordView, VIEW_KINDS } from '@/lib/views'

const viewSchema = z.object({
  kind: z.enum(VIEW_KINDS),
  itemId: z.string().min(1).max(100),
  source: z.enum(['ios', 'android']).default('ios'),
})

/**
 * Stays public — a view is recorded whether or not the reader is signed in —
 * but a bearer token, when present, attributes the row so the same person
 * counts once across their devices.
 */
export const POST = withMobileErrors(async (request: Request) => {
  const parsed = viewSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return mobileError(
      'VALIDATION_ERROR',
      'La vista no es válida.',
      422,
      parsed.error.flatten().fieldErrors,
    )
  }

  const principal = await getMobilePrincipal(request)
  const result = await recordView({
    kind: parsed.data.kind,
    itemId: parsed.data.itemId,
    userId: principal?.userId ?? null,
    viewerId: anonymousViewerId(request),
    source: parsed.data.source,
  })

  if (!result.found) return mobileError('NOT_FOUND', 'El contenido no está disponible.', 404)

  // A duplicate inside the dedupe window is still a success for the caller;
  // `recorded` says whether it actually counted.
  return mobileSuccess({ recorded: result.counted, kind: parsed.data.kind, itemId: parsed.data.itemId })
})
