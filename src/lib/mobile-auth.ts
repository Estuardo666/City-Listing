import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

const ACCESS_TTL_SECONDS = 15 * 60
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60

function secret() {
  const value = process.env.NEXTAUTH_SECRET
  if (!value || value.length < 32) throw new Error('NEXTAUTH_SECRET must be at least 32 characters')
  return new TextEncoder().encode(value)
}

function hashToken(token: string) { return createHash('sha256').update(token).digest('hex') }
function createOpaqueToken() { return randomBytes(48).toString('base64url') }

export function publicUser(user: { id: string; name: string | null; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

async function createAccessToken(user: { id: string; role: string }) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret())
}

export async function createSessionTokens(user: { id: string; name: string | null; email: string; role: string }) {
  const refreshToken = createOpaqueToken()
  await prisma.mobileRefreshSession.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000) },
  })
  return { accessToken: await createAccessToken(user), refreshToken, expiresIn: ACCESS_TTL_SECONDS, user: publicUser(user) }
}

export async function rotateSessionTokens(refreshToken: string) {
  const current = await prisma.mobileRefreshSession.findUnique({ where: { tokenHash: hashToken(refreshToken) }, include: { user: true } })
  if (!current) return null
  const next = createOpaqueToken()
  const now = new Date()
  const rotated = await prisma.$transaction(async (tx) => {
    // Conditional update makes refresh rotation single-use under concurrent requests.
    const claimed = await tx.mobileRefreshSession.updateMany({
      where: { id: current.id, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    })
    if (claimed.count !== 1) return false
    await tx.mobileRefreshSession.create({
      data: { userId: current.userId, tokenHash: hashToken(next), expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000) },
    })
    return true
  })
  if (!rotated) return null
  return { accessToken: await createAccessToken(current.user), refreshToken: next, expiresIn: ACCESS_TTL_SECONDS, user: publicUser(current.user) }
}

export async function revokeSession(refreshToken: string) {
  await prisma.mobileRefreshSession.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } })
}

export async function getMobilePrincipal(request: Request) {
  const header = request.headers.get('authorization')
  if (!header?.toLowerCase().startsWith('bearer ')) return null
  try {
    const { payload } = await jwtVerify(header.slice(7), secret(), { algorithms: ['HS256'] })
    if (!payload.sub || typeof payload.role !== 'string') return null
    return { userId: payload.sub, role: payload.role }
  } catch { return null }
}
