'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LIFESTYLE_OPTIONS } from '@/lib/constants/onboarding'

export async function saveLifestylePreferencesAction(preferences: string[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autenticado')

  const userId = session.user.id

  const allowed = new Set<string>(LIFESTYLE_OPTIONS.map(({ id }) => id))
  const submitted = [...new Set(preferences)]
  const uniquePreferences = submitted.filter((preference) => allowed.has(preference)).slice(0, LIFESTYLE_OPTIONS.length)

  if (uniquePreferences.length !== submitted.length) {
    return { success: false, error: 'Una preferencia ya no está disponible.' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.userLifestylePreference.deleteMany({ where: { userId } })
    if (uniquePreferences.length > 0) {
      await tx.userLifestylePreference.createMany({ data: uniquePreferences.map((preference) => ({ userId, preference })) })
    }
  })

  revalidatePath('/')
  revalidatePath('/dashboard/intereses')

  return { success: true }
}
