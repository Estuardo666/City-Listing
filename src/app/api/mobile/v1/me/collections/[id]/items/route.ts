import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const removeSchema = z.object({ kind: z.enum(['venue', 'event', 'post', 'route']), itemId: z.string().trim().min(1).max(100) })

function fieldFor(kind: z.infer<typeof removeSchema>['kind']) {
  return `${kind}Id` as 'venueId' | 'eventId' | 'postId' | 'routeId'
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para quitar elementos.', 401)
  const { id } = await params
  const collection = await prisma.collection.findFirst({ where: { id, userId: principal.userId }, select: { id: true } })
  if (!collection) return mobileError('NOT_FOUND', 'Colección no encontrada.', 404)
  const parsed = removeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El elemento no es válido.', 422, parsed.error.flatten().fieldErrors)
  const field = fieldFor(parsed.data.kind)
  const result = await prisma.collectionItem.deleteMany({ where: { collectionId: id, [field]: parsed.data.itemId } })
  return mobileSuccess({ removed: result.count > 0, kind: parsed.data.kind, itemId: parsed.data.itemId })
}
