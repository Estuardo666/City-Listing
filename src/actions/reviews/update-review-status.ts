'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reviewStatusUpdateSchema } from '@/schemas/review.schema'
import { POINTS } from '@/lib/gamification'
import { awardPointsAction, incrementUserStatsAction } from '@/actions/gamification'
import { checkAndAwardBadgesAction } from '@/actions/gamification'
import type { ActionResponse } from '@/types/action-response'
import type { Review } from '@prisma/client'

async function recalculateAvgRating(entityType: 'venue' | 'event', entityId: string) {
  const result = await prisma.review.aggregate({
    where: {
      [`${entityType}Id`]: entityId,
      status: 'APPROVED',
    },
    _avg: { rating: true },
    _count: true,
  })

  const avgRating = result._avg.rating
  const reviewCount = result._count

  if (entityType === 'venue') {
    await prisma.venue.update({
      where: { id: entityId },
      data: { avgRating, reviewCount },
    })
  } else {
    await prisma.event.update({
      where: { id: entityId },
      data: { avgRating, reviewCount },
    })
  }
}

export async function updateReviewStatusAction(
  input: unknown
): Promise<ActionResponse<Review>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden cambiar el estado.',
      }
    }

    const parsed = reviewStatusUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const review = await prisma.review.findUnique({
      where: { id: parsed.data.reviewId },
      select: {
        id: true,
        status: true,
        userId: true,
        venueId: true,
        eventId: true,
        rating: true,
        photos: true,
      },
    })

    if (!review) {
      return { success: false, error: 'Reseña no encontrada.' }
    }

    const previousStatus = review.status
    const newStatus = parsed.data.status

    if (previousStatus === newStatus) {
      return { success: false, error: 'La reseña ya tiene ese estado.' }
    }

    const updated = await prisma.review.update({
      where: { id: parsed.data.reviewId },
      data: {
        status: newStatus,
        flaggedReason: newStatus === 'APPROVED' ? null : undefined,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    const entityType = review.venueId ? 'venue' : 'event'
    const entityId = review.venueId ?? review.eventId

    if (entityId) {
      await recalculateAvgRating(entityType, entityId)
    }

    if (newStatus === 'APPROVED' && previousStatus !== 'APPROVED') {
      await awardPointsAction(review.userId, POINTS.REVIEW_TEXT, 'review_created')
      if (review.photos.length > 0) {
        await awardPointsAction(review.userId, POINTS.REVIEW_PHOTO, 'review_photo')
      }
      await incrementUserStatsAction(review.userId, { reviews: 1 })
      await checkAndAwardBadgesAction(review.userId)
    }

    if (entityId) {
      if (entityType === 'venue') {
        const venue = await prisma.venue.findUnique({ where: { id: entityId }, select: { slug: true } })
        if (venue) revalidatePath(`/locales/${venue.slug}`)
      } else {
        const event = await prisma.event.findUnique({ where: { id: entityId }, select: { slug: true } })
        if (event) revalidatePath(`/eventos/${event.slug}`)
      }
    }

    revalidatePath('/admin/resenas')

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar el estado de la reseña.' }
  }
}

export async function bulkUpdateReviewsAction(
  reviewIds: string[],
  status: 'APPROVED' | 'REJECTED'
): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    if (reviewIds.length === 0) {
      return { success: false, error: 'No se seleccionaron reseñas.' }
    }

    const reviews = await prisma.review.findMany({
      where: { id: { in: reviewIds } },
      select: {
        id: true,
        status: true,
        userId: true,
        venueId: true,
        eventId: true,
        photos: true,
      },
    })

    await prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: {
        status,
        flaggedReason: status === 'APPROVED' ? null : undefined,
      },
    })

    if (status === 'APPROVED') {
      for (const review of reviews) {
        if (review.status !== 'APPROVED') {
          await awardPointsAction(review.userId, POINTS.REVIEW_TEXT, 'review_created')
          if (review.photos.length > 0) {
            await awardPointsAction(review.userId, POINTS.REVIEW_PHOTO, 'review_photo')
          }
          await incrementUserStatsAction(review.userId, { reviews: 1 })
          await checkAndAwardBadgesAction(review.userId)
        }
      }
    }

    const affectedVenues = new Set(reviews.filter((r) => r.venueId).map((r) => r.venueId!))
    const affectedEvents = new Set(reviews.filter((r) => r.eventId).map((r) => r.eventId!))

    for (const venueId of affectedVenues) {
      await recalculateAvgRating('venue', venueId)
      const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    }

    for (const eventId of affectedEvents) {
      await recalculateAvgRating('event', eventId)
      const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } })
      if (event) revalidatePath(`/eventos/${event.slug}`)
    }

    revalidatePath('/admin/resenas')

    return { success: true, data: { count: reviews.length } }
  } catch {
    return { success: false, error: 'No se pudieron actualizar las reseñas.' }
  }
}
