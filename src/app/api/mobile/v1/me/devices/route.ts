import { z } from 'zod'

import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const registerSchema = z.object({
  // Hex APNs token or FCM registration id.
  token: z.string().min(16).max(512),
  platform: z.enum(['IOS', 'ANDROID']),
  environment: z.enum(['sandbox', 'production']).default('production'),
  locale: z.string().min(2).max(10).default('es'),
  appVersion: z.string().max(40).optional(),
})

const revokeSchema = z.object({ token: z.string().min(16).max(512) })

export const POST = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para recibir notificaciones.', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return mobileError('VALIDATION_ERROR', 'El dispositivo no es válido.', 422)
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return mobileError(
      'VALIDATION_ERROR',
      'El dispositivo no es válido.',
      422,
      parsed.error.flatten().fieldErrors,
    )
  }

  // Upserting on the token reassigns the device when a second account signs in
  // on the same phone, so the previous owner stops receiving its notifications.
  const device = await prisma.deviceToken.upsert({
    where: { token: parsed.data.token },
    create: {
      userId: principal.userId,
      token: parsed.data.token,
      platform: parsed.data.platform,
      environment: parsed.data.environment,
      locale: parsed.data.locale,
      appVersion: parsed.data.appVersion,
    },
    update: {
      userId: principal.userId,
      platform: parsed.data.platform,
      environment: parsed.data.environment,
      locale: parsed.data.locale,
      appVersion: parsed.data.appVersion,
      lastSeenAt: new Date(),
      revokedAt: null,
    },
    select: { id: true, platform: true, environment: true, lastSeenAt: true },
  })

  return mobileSuccess(device)
})

export const DELETE = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para gestionar tus dispositivos.', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return mobileError('VALIDATION_ERROR', 'El dispositivo no es válido.', 422)
  }

  const parsed = revokeSchema.safeParse(body)
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El dispositivo no es válido.', 422)

  // Scoped to the principal so a token cannot be revoked by another account.
  const removed = await prisma.deviceToken.deleteMany({
    where: { token: parsed.data.token, userId: principal.userId },
  })

  return mobileSuccess({ revoked: removed.count })
})
