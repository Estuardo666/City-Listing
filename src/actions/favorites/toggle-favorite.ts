'use server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recordSave } from '@/lib/interactions'
import type { ActionResponse } from '@/types/action-response'

const schema = z.object({
  eventId: z.string().optional(),
  venueId: z.string().optional(),
  postId:  z.string().optional(),
  routeId: z.string().optional(),
  collectionId: z.string().optional(),
})

type ToggleFavoriteInput = z.infer<typeof schema>
type ToggleFavoriteResult = { isFavorite: boolean }

export async function toggleFavoriteAction(
  input: ToggleFavoriteInput
): Promise<ActionResponse<ToggleFavoriteResult>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'Debes iniciar sesión para guardar favoritos' }

    const parsed = schema.safeParse(input)
    if (!parsed.success) return { success: false, error: 'Datos inválidos' }

    const { eventId, venueId, postId, routeId, collectionId } = parsed.data
    if ([eventId, venueId, postId, routeId, collectionId].filter(Boolean).length !== 1) return { success: false, error: 'Debes especificar un único elemento' }
    if (collectionId && !await prisma.collection.count({ where: { id: collectionId, isPublic: true } })) {
      return { success: false, error: 'Colección no disponible' }
    }

    const userId = session.user.id

    const where = eventId
      ? { userId_eventId: { userId, eventId } }
      : venueId
      ? { userId_venueId: { userId, venueId } }
      : postId
      ? { userId_postId: { userId, postId } }
      : routeId ? { userId_routeId: { userId, routeId } }
      : { userId_collectionId: { userId, collectionId: collectionId! } }

    const existing = await prisma.favorite.findUnique({ where })

    if (existing) {
      await prisma.favorite.delete({ where })
      revalidatePaths(eventId, venueId, postId, routeId)
      return { success: true, data: { isFavorite: false } }
    }

    await prisma.$transaction(async tx => {
      const favorite = await tx.favorite.create({ data: { userId, eventId, venueId, postId, routeId, collectionId } })
      await recordSave(tx, favorite.id, eventId ? 'event' : venueId ? 'venue' : postId ? 'post' : routeId ? 'route' : 'collection',
        (eventId ?? venueId ?? postId ?? routeId ?? collectionId)!, 'web')
    })

    revalidatePaths(eventId, venueId, postId, routeId)
    return { success: true, data: { isFavorite: true } }
  } catch {
    return { success: false, error: 'Error al actualizar favorito' }
  }
}

function revalidatePaths(eventId?: string, venueId?: string, postId?: string, routeId?: string) {
  if (eventId) revalidatePath('/eventos')
  if (venueId) revalidatePath('/locales')
  if (postId)  revalidatePath('/blog')
  if (routeId) revalidatePath('/rutas')
  revalidatePath('/dashboard')
}
