import { getVenueBySlug } from '@/lib/queries/venues'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const venue = await getVenueBySlug(slug)
  if (!venue) return mobileError('NOT_FOUND', 'Local no encontrado.', 404)

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
    categories: venue.venueCategories.map(({ category }) => category),
    media: venue.media.map(({ id, url, alt, type, order }) => ({ id, url, alt, type, order })),
    services: venue.services.map(({ id, name, description }) => ({ id, name, description })),
    events: venue.events,
    promotions: venue.promotions,
    reviews: venue.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.content,
      createdAt: review.createdAt,
      user: { id: review.user.id, name: review.user.name, image: review.user.image },
    })),
  }
  return mobileSuccess(data)
}
