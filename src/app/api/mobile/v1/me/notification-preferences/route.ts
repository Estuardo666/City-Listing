import { z } from 'zod'

import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { NOTIFICATION_TYPES } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

interface Preferences {
  enabled: boolean
  hoursAhead: number
  pushEnabled: boolean
  emailEnabled: boolean
  eventReminders: boolean
  newFollowedVenuePost: boolean
  reviewReply: boolean
  claimUpdates: boolean
  messageReceived: boolean
  moderationUpdates: boolean
}

const DEFAULTS: Preferences = {
  enabled: true,
  hoursAhead: 48,
  pushEnabled: true,
  emailEnabled: true,
  eventReminders: true,
  newFollowedVenuePost: true,
  reviewReply: true,
  claimUpdates: true,
  messageReceived: true,
  moderationUpdates: true,
}

const updateSchema = z
  .object({
    enabled: z.boolean(),
    hoursAhead: z.number().int().min(1).max(168),
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    ...Object.fromEntries(NOTIFICATION_TYPES.map((type) => [type, z.boolean()])),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Envía al menos una preferencia.',
  })

/** Projects a row onto the public shape, dropping ids and timestamps. */
function present(preference: Partial<Preferences> | null): Preferences {
  if (!preference) return DEFAULTS
  const keys = Object.keys(DEFAULTS) as (keyof Preferences)[]
  const result = { ...DEFAULTS }
  for (const key of keys) {
    const value = preference[key]
    if (value !== undefined && value !== null) {
      // Each key's type matches DEFAULTS by construction.
      ;(result as Record<string, unknown>)[key] = value
    }
  }
  return result
}

export const GET = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus preferencias.', 401)

  const preference = await prisma.notificationPreference.findUnique({
    where: { userId: principal.userId },
  })

  // A missing row means the user never opened the settings; the API answers the
  // same defaults the delivery layer applies, so the app never shows blanks.
  return mobileSuccess(present(preference))
})

export const PATCH = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para cambiar tus preferencias.', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return mobileError('VALIDATION_ERROR', 'Las preferencias no son válidas.', 422)
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return mobileError(
      'VALIDATION_ERROR',
      'Las preferencias no son válidas.',
      422,
      parsed.error.flatten().fieldErrors,
    )
  }

  const preference = await prisma.notificationPreference.upsert({
    where: { userId: principal.userId },
    create: { userId: principal.userId, ...parsed.data },
    update: parsed.data,
  })

  return mobileSuccess(present(preference))
})
