import { getPostCategories, getPosts } from '@/lib/queries/posts'
import { mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || undefined
  const category = searchParams.get('category')?.trim() || undefined
  const now = new Date()
  const [posts, categories] = await Promise.all([
    getPosts({ status: 'APPROVED', q: query, category }),
    getPostCategories(),
  ])

  const mobilePosts = posts.map(({ user, tags, ...post }) => ({
    ...post,
    author: user ? { id: user.id, name: user.name } : null,
    tags: tags.map(({ tag }) => tag),
  }))
  const [promotions, routes, collections] = await Promise.all([
    prisma.promotion.findMany({
      where: {
        status: 'ACTIVE',
        validFrom: { lte: now },
        validUntil: { gte: now },
        venue: { status: 'APPROVED', isActive: true },
      },
      orderBy: [{ featured: 'desc' }, { validUntil: 'asc' }],
      take: 24,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        discount: true,
        validFrom: true,
        validUntil: true,
        terms: true,
        featured: true,
        venue: { select: { id: true, name: true, slug: true, location: true, address: true } },
      },
    }),
    prisma.route.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
      take: 24,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        image: true,
        duration: true,
        difficulty: true,
        type: true,
        featured: true,
        stops: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, notes: true, duration: true, order: true, venue: { select: { id: true, name: true, slug: true } } },
        },
      },
    }),
    prisma.collection.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
      take: 24,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        user: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
  ])

  return mobileSuccess({
    posts: mobilePosts,
    categories,
    promotions,
    routes,
    collections: collections.map(({ _count, ...collection }) => ({ ...collection, itemCount: _count.items })),
  })
}
