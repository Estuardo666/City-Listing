'use server'

import { prisma } from '@/lib/prisma'
import { BADGES, type UserStats } from '@/lib/gamification'

export async function checkAndAwardBadgesAction(
  userId: string
): Promise<{ success: boolean; newBadges: string[] }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        reputationScore: true,
        totalReviews: true,
        totalCheckIns: true,
        totalPhotos: true,
        totalHelpfulVotes: true,
        badges: { select: { badgeType: true } },
      },
    })

    if (!user) return { success: false, newBadges: [] }

    const stats: UserStats = {
      reputationScore: user.reputationScore,
      totalReviews: user.totalReviews,
      totalCheckIns: user.totalCheckIns,
      totalPhotos: user.totalPhotos,
      totalHelpfulVotes: user.totalHelpfulVotes,
    }

    const existingBadgeTypes = new Set(user.badges.map((b) => b.badgeType))
    const newBadges: string[] = []

    const badgesToAward = Object.values(BADGES).filter(
      (badge) => !existingBadgeTypes.has(badge.type) && badge.condition(stats)
    )

    for (const badge of badgesToAward) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeType: badge.type,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
      })
      newBadges.push(badge.name)
    }

    return { success: true, newBadges }
  } catch (error) {
    console.error('Error checking badges:', error)
    return { success: false, newBadges: [] }
  }
}
