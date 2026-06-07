'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reviewSchema } from '@/schemas/review.schema'
import { POINTS } from '@/lib/gamification'
import { awardPointsAction, incrementUserStatsAction } from '@/actions/gamification'
import { checkAndAwardBadgesAction } from '@/actions/gamification'
import type { ActionResponse } from '@/types/action-response'
import type { Review, User } from '@prisma/client'

type ReviewWithUser = Review & {
  user: Pick<User, 'id' | 'name' | 'image'>
}

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

export async function createReviewAction(
  entityType: 'venue' | 'event',
  entityId: string,
  input: unknown
): Promise<ActionResponse<ReviewWithUser>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado. Inicia sesión para dejar una reseña.' }
    }

    const parsed = reviewSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const existing = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        [`${entityType}Id`]: entityId,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'Ya dejaste una reseña para este local/evento.',
      }
    }

    const created = await prisma.review.create({
      data: {
        rating: parsed.data.rating,
        title: parsed.data.title,
        content: parsed.data.content,
        userId: session.user.id,
        [`${entityType}Id`]: entityId,
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    await recalculateAvgRating(entityType, entityId)

    // Gamificación: otorgar puntos y verificar badges
    await awardPointsAction(session.user.id, POINTS.REVIEW_TEXT, 'review_created')
    await incrementUserStatsAction(session.user.id, { reviews: 1 })
    await checkAndAwardBadgesAction(session.user.id)

    if (entityType === 'venue') {
      const venue = await prisma.venue.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    } else {
      const event = await prisma.event.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (event) revalidatePath(`/eventos/${event.slug}`)
    }

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear la reseña. Intenta nuevamente.' }
  }
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, venueId: true, eventId: true },
    })

    if (!review) {
      return { success: false, error: 'Reseña no encontrada.' }
    }

    if (session.user.role !== 'ADMIN' && review.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso para eliminar esta reseña.' }
    }

    await prisma.review.delete({ where: { id: reviewId } })

    if (review.venueId) {
      await recalculateAvgRating('venue', review.venueId)
      const venue = await prisma.venue.findUnique({ where: { id: review.venueId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    } else if (review.eventId) {
      await recalculateAvgRating('event', review.eventId)
      const event = await prisma.event.findUnique({ where: { id: review.eventId }, select: { slug: true } })
      if (event) revalidatePath(`/eventos/${event.slug}`)
    }

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar la reseña.' }
  }
}
