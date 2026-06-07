'use server'

import { prisma } from '@/lib/prisma'
import { calculateLevel } from '@/lib/gamification'

export async function awardPointsAction(
  userId: string,
  points: number,
  reason: string
): Promise<{ success: boolean; newLevel?: number; leveledUp?: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputationScore: true, reviewerLevel: true },
    })

    if (!user) return { success: false }

    const newScore = user.reputationScore + points
    const levelInfo = calculateLevel(newScore)
    const leveledUp = levelInfo.level > user.reviewerLevel

    await prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore: { increment: points },
        reviewerLevel: levelInfo.level,
      },
    })

    return { success: true, newLevel: levelInfo.level, leveledUp }
  } catch (error) {
    console.error('Error awarding points:', error)
    return { success: false }
  }
}

export async function incrementUserStatsAction(
  userId: string,
  stats: {
    reviews?: number
    checkIns?: number
    photos?: number
    helpfulVotes?: number
  }
): Promise<{ success: boolean }> {
  try {
    const data: Record<string, { increment: number }> = {}

    if (stats.reviews) data.totalReviews = { increment: stats.reviews }
    if (stats.checkIns) data.totalCheckIns = { increment: stats.checkIns }
    if (stats.photos) data.totalPhotos = { increment: stats.photos }
    if (stats.helpfulVotes) data.totalHelpfulVotes = { increment: stats.helpfulVotes }

    if (Object.keys(data).length === 0) return { success: true }

    await prisma.user.update({
      where: { id: userId },
      data,
    })

    return { success: true }
  } catch (error) {
    console.error('Error incrementing stats:', error)
    return { success: false }
  }
}
