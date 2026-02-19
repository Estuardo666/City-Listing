import { prisma } from '@/lib/prisma'

export type EngagementStats = {
  totalFavorites: number
  totalComments: number
  totalViews: number
  eventFavorites: number
  venueFavorites: number
  postFavorites: number
  eventComments: number
  venueComments: number
  postComments: number
  postViews: number
}

export async function getUserEngagementStats(userId: string): Promise<EngagementStats> {
  const [
    eventIds,
    venueIds,
    postIds,
  ] = await Promise.all([
    prisma.event.findMany({ where: { userId }, select: { id: true } }),
    prisma.venue.findMany({ where: { userId }, select: { id: true } }),
    prisma.post.findMany({ where: { userId }, select: { id: true } }),
  ])

  const eIds = eventIds.map((e) => e.id)
  const vIds = venueIds.map((v) => v.id)
  const pIds = postIds.map((p) => p.id)

  // viewCount field requires npx prisma db push — gracefully aggregate if available
  let postViews = 0
  try {
    const agg = await (prisma.post as unknown as { aggregate: (args: unknown) => Promise<{ _sum: { viewCount: number | null } }> }).aggregate({
      where: { userId },
      _sum: { viewCount: true },
    })
    postViews = agg._sum.viewCount ?? 0
  } catch {
    postViews = 0
  }

  const prismaAny = prisma as unknown as {
    favorite: {
      count: (args: unknown) => Promise<number>
    }
    comment: {
      count: (args: unknown) => Promise<number>
    }
  }

  const hasFavorite = 'favorite' in prisma
  const hasComment = 'comment' in prisma

  const [
    eventFavorites,
    venueFavorites,
    postFavorites,
    eventComments,
    venueComments,
    postComments,
  ] = await Promise.all([
    hasFavorite && eIds.length > 0
      ? prismaAny.favorite.count({ where: { eventId: { in: eIds } } })
      : Promise.resolve(0),
    hasFavorite && vIds.length > 0
      ? prismaAny.favorite.count({ where: { venueId: { in: vIds } } })
      : Promise.resolve(0),
    hasFavorite && pIds.length > 0
      ? prismaAny.favorite.count({ where: { postId: { in: pIds } } })
      : Promise.resolve(0),
    hasComment && eIds.length > 0
      ? prismaAny.comment.count({ where: { eventId: { in: eIds } } })
      : Promise.resolve(0),
    hasComment && vIds.length > 0
      ? prismaAny.comment.count({ where: { venueId: { in: vIds } } })
      : Promise.resolve(0),
    hasComment && pIds.length > 0
      ? prismaAny.comment.count({ where: { postId: { in: pIds } } })
      : Promise.resolve(0),
  ])

  const totalFavorites = eventFavorites + venueFavorites + postFavorites
  const totalComments = eventComments + venueComments + postComments

  return {
    totalFavorites,
    totalComments,
    totalViews: postViews,
    eventFavorites,
    venueFavorites,
    postFavorites,
    eventComments,
    venueComments,
    postComments,
    postViews,
  }
}
