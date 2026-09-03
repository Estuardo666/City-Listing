import { z } from 'zod'
import { revokeSession } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  refreshToken: z.string().min(40),
  // Sent by the app so the phone stops receiving this account's pushes the
  // moment the session ends, without waiting for APNs to report it dead.
  deviceToken: z.string().min(16).max(512).optional(),
})

export const POST = withMobileErrors(async (request: Request) => {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('INVALID_REFRESH_TOKEN', 'La sesión ya no es válida.', 401)
  await revokeSession(parsed.data.refreshToken)
  if (parsed.data.deviceToken) {
    await prisma.deviceToken.deleteMany({ where: { token: parsed.data.deviceToken } })
  }
  return mobileSuccess({ revoked: true })
})
