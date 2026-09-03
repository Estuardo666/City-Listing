import { z } from 'zod'

import { canonicalUrl } from '@/lib/canonical-urls'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { notifyUser } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

const schema = z.object({ reply: z.string().trim().min(1).max(500) })

/**
 * Owner reply to a review, the mobile counterpart of
 * `replyToReviewAction`. Authorisation is by venue/event ownership, so a signed
 * in user cannot answer on someone else's listing.
 */
export const PATCH = withMobileErrors(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const principal = await getMobilePrincipal(request)
    if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para responder.', 401)

    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return mobileError('VALIDATION_ERROR', 'La respuesta no es válida.', 422)
    }

    const { id } = await context.params
    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        content: true,
        venue: { select: { userId: true, name: true, slug: true } },
        event: { select: { userId: true, title: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    })

    if (!review) return mobileError('NOT_FOUND', 'La reseña no existe.', 404)

    const ownerId = review.venue?.userId ?? review.event?.userId
    if (principal.role !== 'ADMIN' && ownerId !== principal.userId) {
      return mobileError('FORBIDDEN', 'No puedes responder esta reseña.', 403)
    }

    const now = new Date()
    await prisma.review.update({
      where: { id },
      data: { ownerReply: parsed.data.reply, ownerReplyAt: now },
    })

    const entityName = review.venue?.name ?? review.event?.title ?? 'tu reseña'
    const target = review.venue?.slug
      ? ({ kind: 'venue', slug: review.venue.slug } as const)
      : review.event?.slug
        ? ({ kind: 'event', slug: review.event.slug } as const)
        : undefined

    if (review.userId !== principal.userId) {
      // Same notification the web dashboard sends, so the reviewer gets one
      // message whichever surface the owner replied from.
      notifyUser(review.userId, {
        type: 'reviewReply',
        title: `${entityName} respondió tu reseña`,
        body: parsed.data.reply.slice(0, 140),
        target,
        collapseId: `review-reply-${review.id}`,
        data: { reviewId: review.id },
      }).catch(() => {})

      if (review.user.email) {
        const { sendReviewReplyEmail } = await import('@/lib/email/templates/review-reply')
        sendReviewReplyEmail(
          review.user.email,
          review.user.name ?? 'Usuario',
          entityName,
          review.content,
          parsed.data.reply,
        ).catch(() => {})
      }
    }

    return mobileSuccess({
      id: review.id,
      ownerReply: parsed.data.reply,
      ownerReplyAt: now.toISOString(),
      url: target ? canonicalUrl(target.kind, target.slug) : null,
    })
  },
)
