import { getEventBySlug } from '@/lib/queries/events'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) return mobileError('NOT_FOUND', 'Evento no encontrado.', 404)

  const data = {
    id: event.id,
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
      user: { id: review.user.id, name: review.user.name, image: review.user.image },
      photos: review.photos.map(({ id, url, order }) => ({ id, url, order })),
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
  return mobileSuccess(data)
}
