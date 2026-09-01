import { Prisma } from '@prisma/client'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSessionTokens } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

const APPLE_ISSUER = 'https://appleid.apple.com'
const APPLE_JWKS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`))
const schema = z.object({
  identityToken: z.string().min(100),
  nonce: z.string().trim().min(16).max(256).optional(),
  name: z.string().trim().min(2).max(80).optional(),
})

type AppleClaims = { sub: string; email?: string; email_verified?: boolean | string; nonce?: string }

async function verifyIdentityToken(identityToken: string, nonce?: string): Promise<AppleClaims> {
  const audience = process.env.APPLE_CLIENT_ID || process.env.APPLE_BUNDLE_ID
  if (!audience) throw new Error('APPLE_CLIENT_ID is not configured')
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience,
    algorithms: ['RS256'],
  })
  if (typeof payload.sub !== 'string' || payload.sub.length < 3) throw new Error('Apple subject missing')
  if (nonce && payload.nonce !== nonce) throw new Error('Apple nonce mismatch')
  return payload as AppleClaims
}

function isAppleConfigured() {
  return Boolean(process.env.APPLE_CLIENT_ID || process.env.APPLE_BUNDLE_ID)
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El token de Apple no es válido.', 422, parsed.error.flatten().fieldErrors)
  if (!isAppleConfigured()) return mobileError('APPLE_NOT_CONFIGURED', 'El acceso con Apple aún no está habilitado.', 503)

  let claims: AppleClaims
  try {
    claims = await verifyIdentityToken(parsed.data.identityToken, parsed.data.nonce)
  } catch {
    return mobileError('APPLE_TOKEN_INVALID', 'No se pudo verificar tu cuenta de Apple.', 401)
  }

  const existingAccount = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider: 'apple', providerAccountId: claims.sub } },
    include: { user: true },
  })
  if (existingAccount) return mobileSuccess(await createSessionTokens(existingAccount.user))

  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : null
  const emailVerified = claims.email_verified === true || claims.email_verified === 'true'
  let user = email ? await prisma.user.findUnique({ where: { email } }) : null

  if (user && !emailVerified && user.emailVerified == null) {
    return mobileError('APPLE_ACCOUNT_LINK_REQUIRED', 'Confirma el correo antes de vincular esta cuenta.', 409)
  }
  if (!user) {
    if (!email) return mobileError('APPLE_EMAIL_REQUIRED', 'Apple no proporcionó un correo para esta cuenta.', 422)
    user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name || email.split('@')[0],
        emailVerified: emailVerified ? new Date() : null,
        role: 'USER',
      },
    })
  }

  try {
    await prisma.account.create({ data: { userId: user.id, type: 'oauth', provider: 'apple', providerAccountId: claims.sub } })
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error
  }
  return mobileSuccess(await createSessionTokens(user))
}
