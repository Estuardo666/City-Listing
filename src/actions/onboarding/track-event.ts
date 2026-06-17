'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function trackOnboardingEventAction(
  event: string,
  step?: number,
  metadata?: Record<string, unknown>
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return

    await prisma.onboardingEvent.create({
      data: {
        userId: session.user.id,
        event,
        step: step ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (error) {
    console.error('Error tracking onboarding event:', error)
  }
}
