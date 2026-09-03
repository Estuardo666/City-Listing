'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendReviewReplyEmail } from '@/lib/email/templates/review-reply'
import { notifyUser } from '@/lib/notifications'
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
        userId: true,
        venueId: true,
        eventId: true,
        venue: { select: { userId: true, name: true, slug: true } },
        event: { select: { userId: true, title: true, slug: true } },
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

    const entityName = review.venue?.name ?? review.event?.title ?? 'tu reseña'

    if (review.user.email) {
      sendReviewReplyEmail(review.user.email, review.user.name ?? 'Usuario', entityName, review.content, parsed.data.reply).catch(() => {})
    }

    // The reviewer gets the same deep link on iOS and on the web, and never a
    // notification for replying to their own review.
    if (review.userId !== session.user.id) {
      const target = review.venue?.slug
        ? ({ kind: 'venue', slug: review.venue.slug } as const)
        : review.event?.slug
          ? ({ kind: 'event', slug: review.event.slug } as const)
          : undefined

      notifyUser(review.userId, {
        type: 'reviewReply',
        title: `${entityName} respondió tu reseña`,
        body: parsed.data.reply.slice(0, 140),
        target,
        collapseId: `review-reply-${review.id}`,
        data: { reviewId: review.id },
      }).catch(() => {})
    }

    return { success: true, data: { ownerReply: updated.ownerReply!, ownerReplyAt: updated.ownerReplyAt! } }
  } catch {
    return { success: false, error: 'No se pudo enviar la respuesta.' }
  }
}
