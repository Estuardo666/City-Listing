import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { PostListItem } from '@/types/post'

const trendingSelect = Prisma.validator<Prisma.PostSelect>()({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  image: true,
  status: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
  viewCount: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      icon: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
})

export async function getTrendingPosts(period: 'week' | 'month' = 'week', limit = 5): Promise<PostListItem[]> {
  const now = new Date()
  const startDate = new Date()
  
  if (period === 'week') {
    startDate.setDate(now.getDate() - 7)
  } else {
    startDate.setMonth(now.getMonth() - 1)
  }

  try {
    const prismaAny = prisma as unknown as {
      post: {
        findMany: (args: unknown) => Promise<PostListItem[]>
      }
    }

    return prismaAny.post.findMany({
      where: {
        status: 'APPROVED',
        publishedAt: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
      select: trendingSelect,
    })
  } catch {
    // Fallback before db push or if viewCount doesn't exist
    try {
      return prisma.post.findMany({
        where: {
          status: 'APPROVED',
          publishedAt: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        select: {
          ...trendingSelect,
          viewCount: true as any, // Will be undefined before db push
        },
      })
    } catch {
      return []
    }
  }
}

export async function getPopularPosts(threshold = 100, limit = 3): Promise<PostListItem[]> {
  try {
    const prismaAny = prisma as unknown as {
      post: {
        findMany: (args: unknown) => Promise<PostListItem[]>
      }
    }

    return prismaAny.post.findMany({
      where: {
        status: 'APPROVED',
        viewCount: {
          gte: threshold,
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
      select: trendingSelect,
    })
  } catch {
    // Fallback: return recent approved posts
    return prisma.post.findMany({
      where: {
        status: 'APPROVED',
      },
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        ...trendingSelect,
        viewCount: true as any,
      },
    })
  }
}
