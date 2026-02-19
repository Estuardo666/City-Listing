'use server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

const schema = z.object({
  eventId: z.string().optional(),
  venueId: z.string().optional(),
  postId:  z.string().optional(),
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

    const { eventId, venueId, postId } = parsed.data
    if (!eventId && !venueId && !postId) return { success: false, error: 'Debes especificar un elemento' }

    const userId = session.user.id

    const where = eventId
      ? { userId_eventId: { userId, eventId } }
      : venueId
      ? { userId_venueId: { userId, venueId } }
      : { userId_postId: { userId, postId: postId! } }

    const existing = await prisma.favorite.findUnique({ where })

    if (existing) {
      await prisma.favorite.delete({ where })
      revalidatePaths(eventId, venueId, postId)
      return { success: true, data: { isFavorite: false } }
    }

    await prisma.favorite.create({
      data: { userId, eventId, venueId, postId },
    })

    revalidatePaths(eventId, venueId, postId)
    return { success: true, data: { isFavorite: true } }
  } catch {
    return { success: false, error: 'Error al actualizar favorito' }
  }
}

function revalidatePaths(eventId?: string, venueId?: string, postId?: string) {
  if (eventId) revalidatePath('/eventos')
  if (venueId) revalidatePath('/locales')
  if (postId)  revalidatePath('/blog')
  revalidatePath('/dashboard')
}
