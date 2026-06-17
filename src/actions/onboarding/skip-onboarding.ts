'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function skipOnboardingAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autenticado')

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingSkippedAt: new Date() },
  })

  return { success: true }
}
