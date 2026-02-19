import { prisma } from '@/lib/prisma'

export type TagWithCount = {
  id: string
  name: string
  slug: string
  _count: { posts: number }
}

export async function getUserTagsWithCount(userId: string): Promise<TagWithCount[]> {
  try {
    const prismaAny = prisma as unknown as {
      tag: {
        findMany: (args: unknown) => Promise<TagWithCount[]>
      }
    }
    return prismaAny.tag.findMany({
      where: {
        posts: {
          some: {
            post: {
              userId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
  } catch {
    // Graceful fallback before db push
    return []
  }
}

export async function getAllTags(): Promise<{ id: string; name: string; slug: string }[]> {
  try {
    const prismaAny = prisma as unknown as {
      tag: {
        findMany: (args: unknown) => Promise<{ id: string; name: string; slug: string }[]>
      }
    }
    return prismaAny.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
  } catch {
    return []
  }
}
