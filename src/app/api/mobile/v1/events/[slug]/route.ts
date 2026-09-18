import { getEventBySlug } from '@/lib/queries/events'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { getPublicTicketingBySlug } from '@/lib/ticketing'
import { CACHE_TTL, withCache } from '@/lib/cache'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await withCache(`mobile:event:${slug}:v2`, async () => {
    const event = await getEventBySlug(slug)
    if (!event) return null

    return {
      id: event.id,
      status: event.status,
      title: event.title,
      slug: event.slug,
      description: event.description,
      image: event.image,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      address: event.address,
      lat: event.lat,
      lng: event.lng,
      featured: event.featured,
      sponsoredUntil: event.sponsoredUntil,
      price: event.price,
      avgRating: event.avgRating,
      reviewCount: event.reviewCount,
      categories: event.eventCategories.map(({ category }) => category),
      media: event.media.map(({ id, url, alt, type, order }) => ({ id, url, alt, type, order })),
      venue: event.venue ? { id: event.venue.id, name: event.venue.name, slug: event.venue.slug } : null,
      reviews: event.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
        ownerReply: review.ownerReply,
        ownerReplyAt: review.ownerReplyAt,
        user: { id: review.user.id, name: review.user.name, image: review.user.image },
        photos: (((review as typeof review & { photos?: { id: string; url: string; order: number }[] }).photos) ?? []).map(({ id, url, order }) => ({ id, url, order })),
      })),
      questions: ((event as any).questions ?? []).map((question: any) => ({
        id: question.id,
        content: question.content,
        answer: question.answer,
        answerBy: question.answerBy,
        answeredAt: question.answeredAt,
        status: question.status,
        createdAt: question.createdAt,
          user: { id: question.user.id, name: question.user.name, image: question.user.image },
        })),
    }
  }, CACHE_TTL.MOBILE_PUBLIC)

  if (!data) return mobileError('NOT_FOUND', 'Evento no encontrado.', 404)
  // Ticket availability and seat maps are intentionally live. Cache only the
  // descriptive event DTO so this optimization cannot stale a purchase flow.
  const ticketing = data.status === 'APPROVED'
    ? await getPublicTicketingBySlug(data.slug).catch(() => ({ eventId: data.id, mode: 'NONE' as const }))
    : { eventId: data.id, mode: 'NONE' as const }
  const response = mobileSuccess({ ...data, ticketing })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
