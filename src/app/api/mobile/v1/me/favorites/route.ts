import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const favoriteSchema = z.object({
  kind: z.enum(['venue', 'event', 'post', 'route']),
  itemId: z.string().trim().min(1).max(100),
})

function fieldFor(kind: z.infer<typeof favoriteSchema>['kind']) {
  return `${kind}Id` as 'venueId' | 'eventId' | 'postId' | 'routeId'
}

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus guardados.', 401)
  const favorites = await prisma.favorite.findMany({ where: { userId: principal.userId }, orderBy: { createdAt: 'desc' } })
  return mobileSuccess(favorites.map((favorite) => ({
    id: favorite.id,
    kind: favorite.venueId ? 'venue' : favorite.eventId ? 'event' : favorite.postId ? 'post' : 'route',
    itemId: favorite.venueId ?? favorite.eventId ?? favorite.postId ?? favorite.routeId,
    createdAt: favorite.createdAt,
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
