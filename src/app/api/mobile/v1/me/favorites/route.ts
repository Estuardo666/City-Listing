import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const favoriteSchema = z.object({
  kind: z.enum(['venue', 'event', 'post', 'route', 'collection']),
  itemId: z.string().trim().min(1).max(100),
})

function fieldFor(kind: z.infer<typeof favoriteSchema>['kind']) {
  return `${kind}Id` as 'venueId' | 'eventId' | 'postId' | 'routeId' | 'collectionId'
}

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus guardados.', 401)
  const favorites = await prisma.favorite.findMany({
    where: { userId: principal.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      venue: { select: { id: true, name: true, slug: true, description: true, image: true, location: true, address: true, lat: true, lng: true } },
      event: { select: { id: true, title: true, slug: true, description: true, image: true, location: true, address: true, lat: true, lng: true, startDate: true } },
      post: { select: { id: true, title: true, slug: true, excerpt: true, image: true } },
      route: { select: { id: true, title: true, slug: true, description: true, image: true, duration: true, difficulty: true, days: true } },
      collection: { select: { id: true, name: true, slug: true, description: true, icon: true, isPublic: true, _count: { select: { items: true } } } },
    },
  })
  return mobileSuccess(favorites.map((favorite) => ({
    id: favorite.id,
    kind: favorite.venueId ? 'venue' : favorite.eventId ? 'event' : favorite.postId ? 'post' : favorite.routeId ? 'route' : 'collection',
    itemId: favorite.venueId ?? favorite.eventId ?? favorite.postId ?? favorite.routeId ?? favorite.collectionId,
    createdAt: favorite.createdAt,
    item: favorite.venue
      ? { kind: 'venue', id: favorite.venue.id, title: favorite.venue.name, slug: favorite.venue.slug, description: favorite.venue.description, image: favorite.venue.image, subtitle: favorite.venue.location, address: favorite.venue.address, lat: favorite.venue.lat, lng: favorite.venue.lng }
      : favorite.event
        ? { kind: 'event', id: favorite.event.id, title: favorite.event.title, slug: favorite.event.slug, description: favorite.event.description, image: favorite.event.image, subtitle: favorite.event.location, address: favorite.event.address, lat: favorite.event.lat, lng: favorite.event.lng, startDate: favorite.event.startDate }
        : favorite.post
          ? { kind: 'post', id: favorite.post.id, title: favorite.post.title, slug: favorite.post.slug, description: favorite.post.excerpt, image: favorite.post.image, subtitle: favorite.post.excerpt }
          : favorite.route
            ? { kind: 'route', id: favorite.route.id, title: favorite.route.title, slug: favorite.route.slug, description: favorite.route.description, image: favorite.route.image, subtitle: [favorite.route.days > 1 ? `${favorite.route.days} días` : null, favorite.route.duration, favorite.route.difficulty].filter(Boolean).join(' · ') || null }
            : favorite.collection
              ? { kind: 'collection', id: favorite.collection.id, title: favorite.collection.name, slug: favorite.collection.slug, description: favorite.collection.description, image: null, subtitle: `${favorite.collection._count.items} guardados` }
              : null,
  })))
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para guardar contenido.', 401)
  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El guardado no es válido.', 422, parsed.error.flatten().fieldErrors)

  const field = fieldFor(parsed.data.kind)
  const where = { userId: principal.userId, [field]: parsed.data.itemId } as Prisma.FavoriteWhereInput
  const existing = await prisma.favorite.findFirst({ where })
  if (existing) return mobileSuccess({ id: existing.id, kind: parsed.data.kind, itemId: parsed.data.itemId, createdAt: existing.createdAt })

  try {
    const created = await prisma.favorite.create({ data: { userId: principal.userId, [field]: parsed.data.itemId } as Prisma.FavoriteUncheckedCreateInput })
    return mobileSuccess({ id: created.id, kind: parsed.data.kind, itemId: parsed.data.itemId, createdAt: created.createdAt })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return mobileError('NOT_FOUND', 'El contenido ya no está disponible.', 404)
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.favorite.findFirst({ where })
      if (duplicate) return mobileSuccess({ id: duplicate.id, kind: parsed.data.kind, itemId: parsed.data.itemId, createdAt: duplicate.createdAt })
    }
    throw error
  }
}

export async function DELETE(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para quitar guardados.', 401)
  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El guardado no es válido.', 422, parsed.error.flatten().fieldErrors)
  const field = fieldFor(parsed.data.kind)
  await prisma.favorite.deleteMany({ where: { userId: principal.userId, [field]: parsed.data.itemId } })
  return mobileSuccess({ removed: true, kind: parsed.data.kind, itemId: parsed.data.itemId })
}
