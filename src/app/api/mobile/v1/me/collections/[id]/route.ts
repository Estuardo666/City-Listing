import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const collectionUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  isPublic: z.boolean().optional(),
})

const itemSchema = z.object({
  kind: z.enum(['venue', 'event', 'post', 'route']),
  itemId: z.string().trim().min(1).max(100),
  note: z.string().trim().max(300).optional(),
  order: z.number().int().min(0).max(10_000).optional(),
})

function fieldFor(kind: z.infer<typeof itemSchema>['kind']) {
  return `${kind}Id` as 'venueId' | 'eventId' | 'postId' | 'routeId'
}

async function ownedCollection(id: string, userId: string) {
  return prisma.collection.findFirst({ where: { id, userId }, select: { id: true } })
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver la colección.', 401)
  const { id } = await params
  const collection = await prisma.collection.findFirst({ where: { id, userId: principal.userId }, include: { items: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], take: 200, include: { venue: { select: { id: true, name: true, slug: true, image: true } }, event: { select: { id: true, title: true, slug: true, image: true } }, post: { select: { id: true, title: true, slug: true, image: true } }, route: { select: { id: true, title: true, slug: true, image: true } } } } } })
  if (!collection) return mobileError('NOT_FOUND', 'Colección no encontrada.', 404)
  return mobileSuccess(collection)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para editar la colección.', 401)
  const { id } = await params
  if (!(await ownedCollection(id, principal.userId))) return mobileError('NOT_FOUND', 'Colección no encontrada.', 404)
  const parsed = collectionUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La colección no es válida.', 422, parsed.error.flatten().fieldErrors)
  const updated = await prisma.collection.update({ where: { id }, data: parsed.data, select: { id: true, name: true, slug: true, description: true, icon: true, isPublic: true, updatedAt: true } })
  return mobileSuccess(updated)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para añadir elementos.', 401)
  const { id } = await params
  if (!(await ownedCollection(id, principal.userId))) return mobileError('NOT_FOUND', 'Colección no encontrada.', 404)
  const parsed = itemSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El elemento no es válido.', 422, parsed.error.flatten().fieldErrors)
  const field = fieldFor(parsed.data.kind)
  const targetWhere = parsed.data.kind === 'venue' ? { id: parsed.data.itemId, status: 'APPROVED', isActive: true }
    : parsed.data.kind === 'event' ? { id: parsed.data.itemId, status: 'APPROVED' }
      : parsed.data.kind === 'post' ? { id: parsed.data.itemId, status: 'PUBLISHED' }
        : { id: parsed.data.itemId, status: 'APPROVED' }
  const target = parsed.data.kind === 'venue' ? await prisma.venue.findFirst({ where: targetWhere, select: { id: true } })
    : parsed.data.kind === 'event' ? await prisma.event.findFirst({ where: targetWhere, select: { id: true } })
      : parsed.data.kind === 'post' ? await prisma.post.findFirst({ where: targetWhere, select: { id: true } })
        : await prisma.route.findFirst({ where: targetWhere, select: { id: true } })
  if (!target) return mobileError('NOT_FOUND', 'El contenido no está disponible.', 404)
  const existing = await prisma.collectionItem.findFirst({ where: { collectionId: id, [field]: parsed.data.itemId } })
  if (existing) return mobileSuccess(existing, { idempotent: true })
  try {
    const created = await prisma.collectionItem.create({ data: { collectionId: id, [field]: parsed.data.itemId, note: parsed.data.note, order: parsed.data.order ?? 0 }, include: { venue: { select: { id: true, name: true, slug: true, image: true } }, event: { select: { id: true, title: true, slug: true, image: true } }, post: { select: { id: true, title: true, slug: true, image: true } }, route: { select: { id: true, title: true, slug: true, image: true } } } })
    return mobileSuccess(created, { idempotent: false })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2002') {
      const duplicate = await prisma.collectionItem.findFirst({ where: { collectionId: id, [field]: parsed.data.itemId } })
      if (duplicate) return mobileSuccess(duplicate, { idempotent: true })
    }
    throw error
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para eliminar la colección.', 401)
  const { id } = await params
  if (!(await ownedCollection(id, principal.userId))) return mobileError('NOT_FOUND', 'Colección no encontrada.', 404)
  await prisma.collection.delete({ where: { id } })
  return mobileSuccess({ removed: true, id })
}
