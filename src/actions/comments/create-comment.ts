'use server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

const schema = z.object({
  content: z.string().min(1, 'El comentario no puede estar vacío').max(1000, 'Máximo 1000 caracteres'),
  eventId: z.string().optional(),
  venueId: z.string().optional(),
  postId:  z.string().optional(),
  parentId: z.string().optional(),
})

export type CreateCommentInput = z.infer<typeof schema>

export type CommentWithUser = {
  id: string
  content: string
  parentId: string | null
  createdAt: Date
  user: { id: string; name: string | null; image: string | null }
}

export async function createCommentAction(
  input: CreateCommentInput
): Promise<ActionResponse<CommentWithUser>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'Debes iniciar sesión para comentar' }

    const parsed = schema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

    const { content, eventId, venueId, postId, parentId } = parsed.data
    if (!eventId && !venueId && !postId) return { success: false, error: 'Debes especificar un elemento' }

    const prismaAny = prisma as unknown as {
      comment: {
        create: (args: unknown) => Promise<CommentWithUser>
      }
    }

    const comment = await prismaAny.comment.create({
      data: { content, userId: session.user.id, eventId, venueId, postId, parentId },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true } },
      },
    })

    if (eventId) revalidatePath('/eventos')
    if (venueId) revalidatePath('/locales')
    if (postId)  revalidatePath('/blog')

    return { success: true, data: comment }
  } catch {
    return { success: false, error: 'Error al publicar el comentario' }
  }
}

export async function deleteCommentAction(commentId: string): Promise<ActionResponse<null>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autenticado' }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, eventId: true, venueId: true, postId: true },
    })

    if (!comment) return { success: false, error: 'Comentario no encontrado' }
    if (comment.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return { success: false, error: 'No tienes permiso para eliminar este comentario' }
    }

    await prisma.comment.delete({ where: { id: commentId } })

    if (comment.eventId) revalidatePath('/eventos')
    if (comment.venueId) revalidatePath('/locales')
    if (comment.postId)  revalidatePath('/blog')

    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Error al eliminar el comentario' }
  }
}
