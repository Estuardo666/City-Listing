import { randomBytes } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const collectionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(40).optional(),
  isPublic: z.boolean().optional(),
})

const collectionSelect = {
  id: true, name: true, slug: true, description: true, icon: true, isPublic: true, createdAt: true, updatedAt: true,
  items: {
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], take: 200,
    select: {
      id: true, venueId: true, eventId: true, postId: true, routeId: true, note: true, order: true, createdAt: true,
      venue: { select: { id: true, name: true, slug: true, image: true } },
      event: { select: { id: true, title: true, slug: true, image: true } },
      post: { select: { id: true, title: true, slug: true, image: true } },
      route: { select: { id: true, title: true, slug: true, image: true } },
    },
  },
} satisfies Prisma.CollectionSelect

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus colecciones.', 401)
  const collections = await prisma.collection.findMany({ where: { userId: principal.userId }, orderBy: { updatedAt: 'desc' }, take: 100, select: collectionSelect })
  return mobileSuccess(collections)
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para crear una colección.', 401)
  const parsed = collectionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La colección no es válida.', 422, parsed.error.flatten().fieldErrors)
  const baseSlug = slugify(parsed.data.name) || 'coleccion'
  const created = await prisma.collection.create({
    data: {
      userId: principal.userId,
      name: parsed.data.name,
      slug: `${baseSlug}-${randomBytes(3).toString('hex')}`,
      description: parsed.data.description,
      icon: parsed.data.icon,
      isPublic: parsed.data.isPublic ?? true,
    },
    select: collectionSelect,
  })
  return mobileSuccess(created)
}
