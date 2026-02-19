import { prisma } from '@/lib/prisma'

export type AuthorAnalytics = {
  posts: {
    total: number
    published: number
    pending: number
    rejected: number
    totalViews: number
    totalFavorites: number
    totalComments: number
  }
  events: {
    total: number
    approved: number
    pending: number
    rejected: number
    totalViews: number
    totalFavorites: number
  }
  venues: {
    total: number
    approved: number
    pending: number
    rejected: number
    totalViews: number
    totalFavorites: number
  }
  topPosts: Array<{
    id: string
    title: string
    slug: string
    viewCount: number
    favoriteCount: number
    commentCount: number
  }>
  lowPerformingPosts: Array<{
    id: string
    title: string
    slug: string
    viewCount: number
    favoriteCount: number
    commentCount: number
  }>
}

export async function getAuthorAnalytics(userId: string): Promise<AuthorAnalytics> {
  try {
    // Posts analytics
    const postsData = await Promise.all([
      prisma.post.count({ where: { userId } }),
      prisma.post.count({ where: { userId, status: 'APPROVED' } }),
      prisma.post.count({ where: { userId, status: 'PENDING' } }),
      prisma.post.count({ where: { userId, status: 'REJECTED' } }),
    ])

    const postsViews = await (prisma as any).post.aggregate({
      where: { userId },
      _sum: { viewCount: true },
    })

    const postsFavorites = await prisma.favorite.count({
      where: {
        post: { userId },
      },
    })

    const postsComments = await prisma.comment.count({
      where: {
        post: { userId },
      },
    })

    // Events analytics
    const eventsData = await Promise.all([
      prisma.event.count({ where: { userId } }),
      prisma.event.count({ where: { userId, status: 'APPROVED' } }),
      prisma.event.count({ where: { userId, status: 'PENDING' } }),
      prisma.event.count({ where: { userId, status: 'REJECTED' } }),
    ])

    const eventsFavorites = await prisma.favorite.count({
      where: {
        event: { userId },
      },
    })

    // Venues analytics
    const venuesData = await Promise.all([
      prisma.venue.count({ where: { userId } }),
      prisma.venue.count({ where: { userId, status: 'APPROVED' } }),
      prisma.venue.count({ where: { userId, status: 'PENDING' } }),
      prisma.venue.count({ where: { userId, status: 'REJECTED' } }),
    ])

    const venuesFavorites = await prisma.favorite.count({
      where: {
        venue: { userId },
      },
    })

    // Top performing posts
    const topPosts = await (prisma as any).post.findMany({
      where: { userId, status: 'APPROVED' },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        _count: {
          select: {
            favorites: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { favorites: { _count: 'desc' } },
      ],
      take: 5,
    })

    // Low performing posts
    const lowPerformingPosts = await (prisma as any).post.findMany({
      where: { userId, status: 'APPROVED' },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        _count: {
          select: {
            favorites: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'asc' },
        { favorites: { _count: 'asc' } },
      ],
      take: 5,
    })

    return {
      posts: {
        total: postsData[0],
        published: postsData[1],
        pending: postsData[2],
        rejected: postsData[3],
        totalViews: postsViews._sum.viewCount || 0,
        totalFavorites: postsFavorites,
        totalComments: postsComments,
      },
      events: {
        total: eventsData[0],
        approved: eventsData[1],
        pending: eventsData[2],
        rejected: eventsData[3],
        totalViews: 0, // Events don't have viewCount yet
        totalFavorites: eventsFavorites,
      },
      venues: {
        total: venuesData[0],
        approved: venuesData[1],
        pending: venuesData[2],
        rejected: venuesData[3],
        totalViews: 0, // Venues don't have viewCount yet
        totalFavorites: venuesFavorites,
      },
      topPosts: topPosts.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        viewCount: p.viewCount || 0,
        favoriteCount: p._count.favorites,
        commentCount: p._count.comments,
      })),
      lowPerformingPosts: lowPerformingPosts.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        viewCount: p.viewCount || 0,
        favoriteCount: p._count.favorites,
        commentCount: p._count.comments,
      })),
    }
  } catch {
    // Fallback before db push or if viewCount doesn't exist
    return {
      posts: {
        total: 0,
        published: 0,
        pending: 0,
        rejected: 0,
        totalViews: 0,
        totalFavorites: 0,
        totalComments: 0,
      },
      events: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalViews: 0,
        totalFavorites: 0,
      },
      venues: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalViews: 0,
        totalFavorites: 0,
      },
      topPosts: [],
      lowPerformingPosts: [],
    }
  }
}
