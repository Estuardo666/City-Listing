import { z } from 'zod'
import { getMobilePrincipal, publicUser } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  image: z.string().trim().url().max(500).nullable().optional(),
})

async function profileFor(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      reputationScore: true,
      reviewerLevel: true,
      totalReviews: true,
      totalCheckIns: true,
      totalPhotos: true,
      onboardingCompletedAt: true,
      onboardingSkippedAt: true,
    },
  })
}

function publicProfile(user: NonNullable<Awaited<ReturnType<typeof profileFor>>>) {
  const { id, name, email, role, image, ...stats } = user
  return { ...publicUser({ id, name, email, role }), image, ...stats }
}

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tu perfil.', 401)
  const user = await profileFor(principal.userId)
  if (!user) return mobileError('NOT_FOUND', 'Usuario no encontrado.', 404)
  return mobileSuccess(publicProfile(user))
}

export async function PATCH(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para editar tu perfil.', 401)
  const parsed = profileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return mobileError('VALIDATION_ERROR', 'El perfil no es válido.', 422, parsed.success ? undefined : parsed.error.flatten().fieldErrors)
  }
  const user = await prisma.user.update({
    where: { id: principal.userId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      reputationScore: true,
      reviewerLevel: true,
      totalReviews: true,
      totalCheckIns: true,
      totalPhotos: true,
      onboardingCompletedAt: true,
      onboardingSkippedAt: true,
    },
  })
  return mobileSuccess(publicProfile(user))
}
