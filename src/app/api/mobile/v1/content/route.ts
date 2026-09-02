import { getPostCategories, getPosts } from '@/lib/queries/posts'
import { mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { getActiveWatchEvents } from '@/lib/queries/watch-events'
import { mapWatchEvent } from '@/lib/mobile-watch-events'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || undefined
  const category = searchParams.get('category')?.trim() || undefined
  const rawLimit = Number(searchParams.get('limit') ?? '12')
  const limit = Number.isFinite(rawLimit) ? Math.min(24, Math.max(1, Math.floor(rawLimit))) : 12
  const rawPostSkip = Number(searchParams.get('postSkip') ?? '0')
  const postSkip = Number.isFinite(rawPostSkip) ? Math.max(0, Math.floor(rawPostSkip)) : 0
  const now = new Date()
  const [posts, categories] = await Promise.all([
    getPosts({ status: 'APPROVED', q: query, category }, { skip: postSkip, take: limit + 1 }),
    getPostCategories(),
  ])

  const hasMorePosts = posts.length > limit
  const mobilePosts = posts.slice(0, limit).map(({ user, tags, ...post }) => ({
    ...post,
    author: user ? { id: user.id, name: user.name } : null,
    tags: tags.map(({ tag }) => tag),
  }))
  const [promotions, routes, collections, watchEvents] = await Promise.all([
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
    getActiveWatchEvents(24),
  ])

  return mobileSuccess({
    posts: mobilePosts,
    categories,
    promotions,
    routes,
    collections: collections.map(({ _count, ...collection }) => ({ ...collection, itemCount: _count.items })),
    watchEvents: watchEvents.map((event) => ({ ...mapWatchEvent(event), venueCount: event._count.venues })),
  }, { posts: { hasMore: hasMorePosts, nextSkip: postSkip + mobilePosts.length } })
}
