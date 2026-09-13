import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { LIFESTYLE_OPTIONS } from '@/lib/constants/onboarding'

const interestsSchema = z.object({
  categoryIds: z.array(z.string().trim().min(1)).max(30),
  preferences: z.array(z.string().trim().min(1).max(80)).max(LIFESTYLE_OPTIONS.length).optional().default([]),
})

const legacyPreferenceIds: Record<string, string> = {
  comida: 'GASTRONOMY', cultura: 'CULTURE', naturaleza: 'NATURE', familia: 'FAMILY',
  'vida nocturna': 'NIGHTLIFE', bienestar: 'WELLNESS',
}

function canonicalPreference(value: string) {
  const canonical = LIFESTYLE_OPTIONS.find(({ id, label }) => id === value || label.toLocaleLowerCase('es') === value.toLocaleLowerCase('es'))?.id
  return canonical ?? legacyPreferenceIds[value.toLocaleLowerCase('es')]
}

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
  const categoryIds = [...new Set(parsed.data.categoryIds)]
  const preferences = [...new Set(parsed.data.preferences.map(canonicalPreference))]
  if (preferences.some((preference) => !preference)) return mobileError('VALIDATION_ERROR', 'Una preferencia ya no está disponible.', 422)
  const canonicalPreferences = preferences.filter((preference): preference is string => Boolean(preference))
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true, slug: true, icon: true, color: true } })
  if (categories.length !== categoryIds.length) return mobileError('NOT_FOUND', 'Una categoría ya no está disponible.', 404)
  await prisma.$transaction(async (tx) => {
    await tx.userInterest.deleteMany({ where: { userId: principal.userId } })
    if (categoryIds.length) await tx.userInterest.createMany({ data: categoryIds.map((categoryId) => ({ userId: principal.userId, categoryId })) })
    await tx.userLifestylePreference.deleteMany({ where: { userId: principal.userId } })
    if (canonicalPreferences.length) await tx.userLifestylePreference.createMany({ data: canonicalPreferences.map((preference) => ({ userId: principal.userId, preference })) })
    await tx.user.update({ where: { id: principal.userId }, data: { onboardingCompletedAt: new Date(), onboardingSkippedAt: null } })
  })
  return mobileSuccess({ categories, preferences: canonicalPreferences }, { onboardingCompleted: true })
}
