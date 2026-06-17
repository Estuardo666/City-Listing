'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function saveLifestylePreferencesAction(preferences: string[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autenticado')

  const userId = session.user.id

  await prisma.userLifestylePreference.deleteMany({ where: { userId } })

  if (preferences.length > 0) {
    await prisma.userLifestylePreference.createMany({
      data: preferences.map((preference) => ({ userId, preference })),
    })
  }

  return { success: true }
}
