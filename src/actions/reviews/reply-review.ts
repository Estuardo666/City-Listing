'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendReviewReplyEmail } from '@/lib/email/templates/review-reply'
import type { ActionResponse } from '@/types/action-response'

const replySchema = z.object({
  reply: z.string().trim().min(1, 'Escribe una respuesta').max(500, 'Máximo 500 caracteres'),
})

export async function replyToReviewAction(
  reviewId: string,
  input: unknown
): Promise<ActionResponse<{ ownerReply: string; ownerReplyAt: Date }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const parsed = replySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        content: true,
        venueId: true,
        eventId: true,
        venue: { select: { userId: true, name: true } },
        event: { select: { userId: true, title: true } },
        user: { select: { name: true, email: true } },
      },
    })

    if (!review) return { success: false, error: 'Reseña no encontrada.' }

    const ownerId = review.venue?.userId ?? review.event?.userId
    if (session.user.role !== 'ADMIN' && ownerId !== session.user.id) {
      return { success: false, error: 'No tienes permiso para responder esta reseña.' }
    }

    const now = new Date()
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { ownerReply: parsed.data.reply, ownerReplyAt: now },
    })

    if (review.venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: review.venueId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    }
    if (review.eventId) {
      const event = await prisma.event.findUnique({ where: { id: review.eventId }, select: { slug: true } })
      if (event) revalidatePath(`/eventos/${event.slug}`)
    }

    if (review.user.email) {
      const entityName = review.venue?.name ?? review.event?.title ?? 'tu reseña'
      sendReviewReplyEmail(review.user.email, review.user.name ?? 'Usuario', entityName, review.content, parsed.data.reply).catch(() => {})
    }

    return { success: true, data: { ownerReply: updated.ownerReply!, ownerReplyAt: updated.ownerReplyAt! } }
  } catch {
    return { success: false, error: 'No se pudo enviar la respuesta.' }
  }
}
