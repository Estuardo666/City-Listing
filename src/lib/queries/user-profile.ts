import { prisma } from '@/lib/prisma'

export async function getUserProfileById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      reputationScore: true,
      reviewerLevel: true,
      totalReviews: true,
      totalCheckIns: true,
      totalPhotos: true,
      totalHelpfulVotes: true,
      createdAt: true,
      badges: {
        select: {
          badgeType: true,
          name: true,
          description: true,
          icon: true,
          earnedAt: true,
        },
        orderBy: { earnedAt: 'desc' },
      },
      reviews: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          venue: {
            select: { id: true, name: true, slug: true, image: true },
          },
          event: {
            select: { id: true, title: true, slug: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      checkIns: {
        select: {
          id: true,
          createdAt: true,
          note: true,
          venue: {
            select: { id: true, name: true, slug: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          reviews: true,
          checkIns: true,
          favorites: true,
        },
      },
    },
  })

  return user
}
