import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

/**
 * Public collection by slug — the target of a shared `/colecciones/{slug}` link.
 *
 * A private collection answers 404 rather than 403 on purpose: the response
 * must not confirm that a slug exists to someone who cannot see it. The owner
 * reads their own private collections through `/me/collections`.
 */
export const GET = withMobileErrors(
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    const { slug } = await context.params

    const collection = await prisma.collection.findFirst({
      where: { slug, isPublic: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { items: true, favorites: true } },
        items: {
          orderBy: { order: 'asc' },
          take: 200,
          select: {
            id: true,
            order: true,
            note: true,
            venue: { select: { id: true, name: true, slug: true, image: true, location: true, lat: true, lng: true, avgRating: true } },
            event: { select: { id: true, title: true, slug: true, image: true, location: true, startDate: true } },
            post: { select: { id: true, title: true, slug: true, image: true, excerpt: true } },
            route: { select: { id: true, title: true, slug: true, image: true, days: true, difficulty: true } },
          },
        },
      },
    })

    if (!collection) return mobileError('NOT_FOUND', 'La colección no está disponible.', 404)

    // Optional principal: the endpoint stays public, a token only reveals
    // whether this viewer already saved it.
    const principal = await getMobilePrincipal(request)
    const isSaved = principal
      ? (await prisma.favorite.count({
          where: { userId: principal.userId, collectionId: collection.id },
        })) > 0
      : false

    return mobileSuccess({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      icon: collection.icon,
      itemCount: collection._count.items,
      saveCount: collection._count.favorites,
      isSaved,
      isMine: principal ? collection.user.id === principal.userId : false,
      author: collection.user,
      updatedAt: collection.updatedAt,
      items: collection.items.map((item) => ({
        id: item.id,
        order: item.order,
        note: item.note,
        item: item.venue
          ? { kind: 'venue', id: item.venue.id, title: item.venue.name, slug: item.venue.slug, image: item.venue.image, subtitle: item.venue.location, lat: item.venue.lat, lng: item.venue.lng, avgRating: item.venue.avgRating }
          : item.event
            ? { kind: 'event', id: item.event.id, title: item.event.title, slug: item.event.slug, image: item.event.image, subtitle: item.event.location, startDate: item.event.startDate }
            : item.post
              ? { kind: 'post', id: item.post.id, title: item.post.title, slug: item.post.slug, image: item.post.image, subtitle: item.post.excerpt }
              : item.route
                ? { kind: 'route', id: item.route.id, title: item.route.title, slug: item.route.slug, image: item.route.image, subtitle: item.route.days > 1 ? `${item.route.days} días` : item.route.difficulty }
                : null,
      })),
    })
  },
)
