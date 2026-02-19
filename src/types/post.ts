import type { Prisma } from '@prisma/client'

export type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    category: true
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    tags: {
      include: {
        tag: true
      }
    }
  }
}>

export type UserPostListItem = Prisma.PostGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    excerpt: true
    image: true
    status: true
    featured: true
    publishedAt: true
    createdAt: true
    category: {
      select: {
        id: true
        name: true
        slug: true
        color: true
        icon: true
      }
    }
    tags: {
      select: {
        tag: {
          select: {
            id: true
            name: true
            slug: true
          }
        }
      }
    }
  }
}>

export type PostListItem = Prisma.PostGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    excerpt: true
    image: true
    status: true
    featured: true
    publishedAt: true
    createdAt: true
    category: {
      select: {
        id: true
        name: true
        slug: true
        color: true
        icon: true
      }
    }
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    tags: {
      select: {
        tag: {
          select: {
            id: true
            name: true
            slug: true
          }
        }
      }
    }
  }
}>

export type PostCategory = Prisma.CategoryGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    color: true
    icon: true
  }
}>

export type PostAdminListItem = Prisma.PostGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    excerpt: true
    status: true
    featured: true
    publishedAt: true
    createdAt: true
    category: {
      select: {
        id: true
        name: true
        slug: true
      }
    }
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>
