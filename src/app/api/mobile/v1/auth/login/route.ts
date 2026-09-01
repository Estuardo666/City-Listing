import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSessionTokens } from '@/lib/mobile-auth'
import { checkMobileAuthRateLimit } from '@/lib/mobile-rate-limit'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) })

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401)
  const rateLimit = await checkMobileAuthRateLimit(request, parsed.data.email)
  if (!rateLimit.allowed) return mobileError('RATE_LIMITED', 'Demasiados intentos. Inténtalo más tarde.', 429)
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
  const valid = user?.password ? await bcrypt.compare(parsed.data.password, user.password) : false
  if (!user || !valid) return mobileError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401)
  return mobileSuccess(await createSessionTokens(user))
}
