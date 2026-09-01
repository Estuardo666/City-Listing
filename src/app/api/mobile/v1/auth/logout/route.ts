import { z } from 'zod'
import { revokeSession } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

const schema = z.object({ refreshToken: z.string().min(40) })

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('INVALID_REFRESH_TOKEN', 'La sesión ya no es válida.', 401)
  await revokeSession(parsed.data.refreshToken)
  return mobileSuccess({ revoked: true })
}
