import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { getInteractionMetrics } from '@/lib/interactions'
import { getViewSeries, VIEW_RETENTION_DAYS } from '@/lib/views'

/**
 * Business dashboard for the owner of a venue: what needs answering and how the
 * listing is doing. The daily series comes from `ViewEvent`, so it only reaches
 * as far back as the retention window — the lifetime counter is reported
 * separately rather than being mixed into the chart.
 */
export const GET = withMobileErrors(
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    const principal = await getMobilePrincipal(request)
    if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus métricas.', 401)

    const { slug } = await context.params
    const venue = await prisma.venue.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
        claimedBy: true,
        verified: true,
        viewCount: true,
        avgRating: true,
        reviewCount: true,
      },
    })

    if (!venue) return mobileError('NOT_FOUND', 'Local no encontrado.', 404)

    const isOwner = venue.userId === principal.userId || venue.claimedBy === principal.userId
    if (!isOwner && principal.role !== 'ADMIN') {
      return mobileError('FORBIDDEN', 'Solo el dueño puede ver estas métricas.', 403)
    }

    const [series, pendingReviews, pendingQuestions, upcomingReservations, favorites] =
      await Promise.all([
        getViewSeries({ kind: 'venue', itemId: venue.id, days: VIEW_RETENTION_DAYS }),
        prisma.review.count({ where: { venueId: venue.id, ownerReply: null } }),
        prisma.question.count({ where: { venueId: venue.id, answer: null } }),
        prisma.reservation.count({
          where: { venueId: venue.id, date: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } },
        }),
        prisma.favorite.count({ where: { venueId: venue.id } }),
      ])

    return mobileSuccess({
      venue: { id: venue.id, name: venue.name, slug: venue.slug, verified: venue.verified },
      lifetimeViews: venue.viewCount,
      recentViews: series.reduce((total, day) => total + day.views, 0),
      viewSeries: series,
      avgRating: venue.avgRating,
      reviewCount: venue.reviewCount,
      favorites: favorites,
      pendingReviewReplies: pendingReviews,
      unansweredQuestions: pendingQuestions,
      upcomingReservations,
      retentionDays: VIEW_RETENTION_DAYS,
      interactions: await getInteractionMetrics('venue', venue.id),
    })
  },
)
