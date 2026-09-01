import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const interestsSchema = z.object({
  categoryIds: z.array(z.string().trim().min(1)).max(30),
  preferences: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
})

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus intereses.', 401)
  const interests = await prisma.userInterest.findMany({ where: { userId: principal.userId }, orderBy: { createdAt: 'asc' }, select: { category: { select: { id: true, name: true, slug: true, icon: true, color: true } } } })
  const preferences = await prisma.userLifestylePreference.findMany({ where: { userId: principal.userId }, orderBy: { preference: 'asc' }, select: { preference: true } })
  return mobileSuccess({ categories: interests.map(({ category }) => category), preferences: preferences.map(({ preference }) => preference) })
}

export async function PUT(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para guardar tus intereses.', 401)
  const parsed = interestsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'Los intereses no son válidos.', 422, parsed.error.flatten().fieldErrors)
  const categories = await prisma.category.findMany({ where: { id: { in: parsed.data.categoryIds } }, select: { id: true, name: true, slug: true, icon: true, color: true } })
  if (categories.length !== parsed.data.categoryIds.length) return mobileError('NOT_FOUND', 'Una categoría ya no está disponible.', 404)
  await prisma.$transaction(async (tx) => {
    await tx.userInterest.deleteMany({ where: { userId: principal.userId } })
    if (parsed.data.categoryIds.length) await tx.userInterest.createMany({ data: parsed.data.categoryIds.map((categoryId) => ({ userId: principal.userId, categoryId })) })
    await tx.userLifestylePreference.deleteMany({ where: { userId: principal.userId } })
    if (parsed.data.preferences.length) await tx.userLifestylePreference.createMany({ data: parsed.data.preferences.map((preference) => ({ userId: principal.userId, preference })) })
    await tx.user.update({ where: { id: principal.userId }, data: { onboardingCompletedAt: new Date(), onboardingSkippedAt: null } })
  })
  return mobileSuccess({ categories, preferences: parsed.data.preferences }, { onboardingCompleted: true })
}
