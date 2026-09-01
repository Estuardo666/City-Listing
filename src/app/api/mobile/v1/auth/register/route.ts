import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSessionTokens } from '@/lib/mobile-auth'
import { checkMobileAuthRateLimit } from '@/lib/mobile-rate-limit'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(320), password: z.string().min(8).max(128) })

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'Revisa los datos enviados.', 422, parsed.error.flatten().fieldErrors)
  const rateLimit = await checkMobileAuthRateLimit(request, parsed.data.email)
  if (!rateLimit.allowed) return mobileError('RATE_LIMITED', 'Demasiados intentos. Inténtalo más tarde.', 429)
  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return mobileError('EMAIL_IN_USE', 'No se pudo crear la cuenta con esos datos.', 409)
  const user = await prisma.user.create({ data: { name: parsed.data.name, email, password: await bcrypt.hash(parsed.data.password, 12), role: 'USER' } })
  return mobileSuccess(await createSessionTokens(user))
}
