'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardPointsAction } from '@/actions/gamification/award-points'
import { sendOnboardingCompleteEmail } from '@/lib/email/templates/onboarding-complete'
import { POINTS } from '@/lib/gamification'

export async function completeOnboardingAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autenticado')

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, onboardingCompletedAt: true },
  })

  if (!user) throw new Error('Usuario no encontrado')
  if (user.onboardingCompletedAt) return { success: true }

  const [interests, followingVenues] = await Promise.all([
    prisma.userInterest.count({ where: { userId } }),
    prisma.userFollowingVenue.count({ where: { userId } }),
  ])

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompletedAt: new Date() },
  })

  await awardPointsAction(userId, POINTS.ONBOARDING_COMPLETED, 'onboarding_completed')

  try {
    await prisma.userBadge.upsert({
      where: { userId_badgeType: { userId, badgeType: 'ONBOARDING_COMPLETED' } },
      create: {
        userId,
        badgeType: 'ONBOARDING_COMPLETED',
        name: 'Explorador Nivel 1',
        description: 'Completaste tu perfil de descubrimiento',
        icon: '🧭',
      },
      update: {},
    })
  } catch (error) {
    console.error('Error awarding onboarding badge:', error)
  }

  sendOnboardingCompleteEmail(user.email, user.name, interests, followingVenues).catch((err) =>
    console.error('Onboarding complete email error:', err)
  )

  revalidatePath('/')

  return { success: true }
}
