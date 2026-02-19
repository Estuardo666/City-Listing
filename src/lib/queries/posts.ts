import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  adminPostStatusFilterSchema,
  postListFiltersSchema,
  type AdminPostStatusFilterInput,
  type PostListFiltersInput,
} from '@/schemas/post.schema'
import type {
  PostAdminListItem,
  PostCategory,
  PostListItem,
  UserPostListItem,
  PostWithRelations,
} from '@/types/post'

const postListSelect = Prisma.validator<Prisma.PostSelect>()({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  image: true,
  status: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
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

const userPostListSelect = Prisma.validator<Prisma.PostSelect>()({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  image: true,
  status: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      icon: true,
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

const postAdminListSelect = Prisma.validator<Prisma.PostSelect>()({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  status: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
})

export async function getPostCategories(): Promise<PostCategory[]> {
  return prisma.category.findMany({
    where: { type: 'POST' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      icon: true,
    },
  })
}

export async function getPosts(
  rawFilters: Partial<PostListFiltersInput> = {}
): Promise<PostListItem[]> {
  const filters = postListFiltersSchema.parse(rawFilters)

  const where: Prisma.PostWhereInput = {
    status: filters.status,
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
      { excerpt: { contains: filters.q } },
      { content: { contains: filters.q } },
    ]
  }

  if (filters.category) {
    where.category = { slug: filters.category }
  }

  if (filters.tag) {
    where.tags = { some: { tag: { slug: filters.tag } } }
  }

  if (filters.featured === 'true') {
    where.featured = true
  }

  return prisma.post.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: postListSelect,
  })
}

export async function getAdminPosts(
  rawStatus: AdminPostStatusFilterInput = 'PENDING'
): Promise<PostAdminListItem[]> {
  const status = adminPostStatusFilterSchema.parse(rawStatus)

  const where: Prisma.PostWhereInput = status === 'ALL' ? {} : { status }

  return prisma.post.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { title: 'asc' }],
    select: postAdminListSelect,
  })
}

export async function getPostBySlug(slug: string): Promise<PostWithRelations | null> {
  const prismaAny = prisma as unknown as {
    post: {
      findFirst: (args: unknown) => Promise<PostWithRelations | null>
    }
  }

  return prismaAny.post.findFirst({
    where: { slug, status: 'APPROVED' },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })
}

type GetUserPostsInput = {
  userId: string
  skip?: number
  take?: number
  q?: string
  status?: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'
  tag?: string
}

export async function getUserPosts(
  input: GetUserPostsInput
): Promise<{ items: UserPostListItem[]; total: number; hasMore: boolean }> {
  const skip = input.skip ?? 0
  const take = input.take ?? 10

  const where: Prisma.PostWhereInput = {
    userId: input.userId,
    ...(input.status && input.status !== 'ALL' ? { status: input.status } : {}),
    ...(input.tag ? { tags: { some: { tag: { slug: input.tag } } } } : {}),
  }

  if (input.q) {
    where.OR = [
      { title: { contains: input.q } },
      { excerpt: { contains: input.q } },
      { content: { contains: input.q } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take,
      select: userPostListSelect,
    }),
    prisma.post.count({ where }),
  ])

  return {
    items,
    total,
    hasMore: skip + items.length < total,
  }
}

export const getUserPostsPaginated = getUserPosts

export async function getRelatedPosts(
  categoryId: string,
  excludeSlug: string,
  limit = 3
): Promise<PostListItem[]> {
  return prisma.post.findMany({
    where: {
      status: 'APPROVED',
      categoryId,
      slug: { not: excludeSlug },
    },
    orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
    select: postListSelect,
  })
}
