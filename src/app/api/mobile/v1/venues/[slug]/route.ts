import { getMobilePrincipal } from '@/lib/mobile-auth'
import { getVenueBySlug } from '@/lib/queries/venues'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

type MobileMenuCategory = {
  id: string
  name: string
  order: number
  items: Array<{
    id: string
    name: string
    description: string | null
    price: number | null
    image: string | null
    order: number
    isAvailable: boolean
    isFeatured: boolean
  }>
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const venue = await getVenueBySlug(slug)
  if (!venue) return mobileError('NOT_FOUND', 'Local no encontrado.', 404)

  // The endpoint stays public; a bearer token only adds the owner-only fields,
  // which is what unlocks the claim CTA and the reply affordance in the app.
  const principal = await getMobilePrincipal(request)

  const menuCategories = (venue as typeof venue & { menuCategories?: MobileMenuCategory[] }).menuCategories ?? []
  const data = {
    id: venue.id,
    name: venue.name,
    slug: venue.slug,
    description: venue.description,
    image: venue.image,
    location: venue.location,
    address: venue.address,
    lat: venue.lat,
    lng: venue.lng,
    featured: venue.featured,
    phone: venue.phone,
    website: venue.website,
    priceRange: venue.priceRange,
    avgRating: venue.avgRating,
    reviewCount: venue.reviewCount,
    verified: venue.verified,
    claimed: venue.claimed,
    isOwnedByMe: principal ? venue.userId === principal.userId : false,
    canReclaim: principal ? venue.userId !== principal.userId && !venue.claimed : false,
    categories: venue.venueCategories.map(({ category }) => category),
    media: venue.media.map(({ id, url, alt, type, order }) => ({ id, url, alt, type, order })),
    services: venue.services.map(({ id, name, description }) => ({ id, name, description })),
    operatingHours: venue.operatingHours,
    businessHours: venue.businessHours,
    menu: menuCategories.map((category) => ({
      id: category.id,
      name: category.name,
      order: category.order,
      items: category.items.map(({ id, name, description, price, image, order, isAvailable, isFeatured }) => ({
        id,
        name,
        description,
        price,
        image,
        order,
        isAvailable,
        isFeatured,
      })),
    })),
    products: venue.products.map(({ id, name, description, price, image, isAvailable, isFeatured, order }) => ({
      id,
      name,
      description,
      price,
      image,
      isAvailable,
      isFeatured,
      order,
    })),
    events: venue.events,
    promotions: venue.promotions.map(({ id, title, description, image, discount, validFrom, validUntil, terms, featured }) => ({
      id,
      title,
      description,
      image,
      discount,
      validFrom,
      validUntil,
      terms,
      featured,
    })),
    reviews: venue.reviews.map((review) => ({
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
    questions: ((venue as any).questions ?? []).map((question: any) => ({
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
