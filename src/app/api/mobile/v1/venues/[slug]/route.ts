import { getMobilePrincipal } from '@/lib/mobile-auth'
import { getVenueBySlug } from '@/lib/queries/venues'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { openStatus, operatingHoursToRows, lojaNowParts, lojaDay } from '@/lib/loja-day'
import { prisma } from '@/lib/prisma'
import { isGoogleDataStale, googlePlaceUrl } from '@/lib/google/freshness'
import { getBadgeInfo, getGoogleBadges } from '@/lib/badges'
import { CACHE_TTL, withCache } from '@/lib/cache'

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

/** Estado abierto/cerrado del local, respetando SpecialHours del dia y del anterior. */
async function venueOpenState(venue: { id: string; businessHours: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>; operatingHours: unknown }) {
  const { date, prevDate } = lojaNowParts()
  const specials = await prisma.specialHours.findMany({
    where: {
      venueId: venue.id,
      date: {
        gte: new Date(`${prevDate}T00:00:00Z`),
        lt: new Date(new Date(`${date}T00:00:00Z`).getTime() + 86400_000),
      },
    },
    select: { date: true, openTime: true, closeTime: true, isClosed: true },
  })
  const specialToday = specials.find((s) => lojaDay(s.date).date === date) ?? null
  const specialYesterday = specials.find((s) => lojaDay(s.date).date === prevDate) ?? null

  const rows = venue.businessHours.length > 0
    ? venue.businessHours
    : operatingHoursToRows(venue.operatingHours as Parameters<typeof operatingHoursToRows>[0])

  return openStatus(rows, { specialToday, specialYesterday })
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [venue, principal, venueMeta] = await Promise.all([
    // Only the public, first-party DTO is persisted. Google fields and
    // request-specific ownership flags are deliberately kept out of Redis.
    withCache(`mobile:venue:${slug}:v2`, async () => {
      const source = await getVenueBySlug(slug)
      if (!source) return null

      const menuCategories = (source as typeof source & { menuCategories?: MobileMenuCategory[] }).menuCategories ?? []
      return {
        id: source.id,
        name: source.name,
        slug: source.slug,
        description: source.description,
        image: source.image,
        location: source.location,
        address: source.address,
        lat: source.lat,
        lng: source.lng,
        featured: source.featured,
        sponsoredUntil: source.sponsoredUntil,
        phone: source.phone,
        website: source.website,
        priceRange: source.priceRange,
        avgRating: source.avgRating,
        reviewCount: source.reviewCount,
        verified: source.verified,
        claimed: source.claimed,
        effectivePlan: source.effectivePlan,
        capabilities: source.capabilities,
        entitlementsVersion: source.entitlementsVersion,
        categories: source.venueCategories.map(({ category }) => category),
        media: source.media.map(({ id, url, alt, type, order }) => ({ id, url, alt, type, order })),
        services: source.services.map(({ id, name, description }) => ({ id, name, description })),
        operatingHours: source.operatingHours,
        businessHours: source.businessHours,
        // This is first-party operational data. A one-minute TTL keeps it
        // accurate while avoiding a SpecialHours query on every detail hit.
        openState: await venueOpenState(source),
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
        products: source.products.map(({ id, name, description, price, image, isAvailable, isFeatured, order }) => ({
          id,
          name,
          description,
          price,
          image,
          isAvailable,
          isFeatured,
          order,
        })),
        events: source.events,
        promotions: source.promotions.map(({ id, title, description, image, discount, validFrom, validUntil, terms, featured }) => ({
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
        reviews: source.reviews.map((review) => ({
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
        questions: ((source as any).questions ?? []).map((question: any) => ({
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
    }, CACHE_TTL.MOBILE_PUBLIC),
    // The endpoint stays public; a bearer token only adds the owner-only
    // fields, which is what unlocks the claim CTA and the reply affordance.
    getMobilePrincipal(request),
    // Google-derived values are read fresh from our DB and never put in the
    // persistent public DTO cache. This preserves attribution/freshness rules.
    prisma.venue.findFirst({
      where: { slug, status: 'APPROVED', isActive: true },
      select: {
        userId: true,
        googleLastSyncAt: true,
        googleRating: true,
        googleReviewCount: true,
        googlePlaceId: true,
      },
    }),
  ])

  if (!venue || !venueMeta) return mobileError('NOT_FOUND', 'Local no encontrado.', 404)

  // Same rule as the web detail page: Google caps cached Places content at 30
  // days, so a stale row drops the rating, its count and the badges derived
  // from them rather than showing numbers Google no longer backs.
  const googleExpired = isGoogleDataStale(venueMeta.googleLastSyncAt)
  const googleRating = googleExpired ? null : (venueMeta.googleRating ?? null)
  const googleReviewCount = googleExpired ? 0 : (venueMeta.googleReviewCount ?? 0)
  const googlePlaceId = venueMeta.googlePlaceId ?? null
  const googleBadges = getGoogleBadges({ googleRating, googleReviewCount }).map((type) => {
    const info = getBadgeInfo(type)
    return { type, label: info.label, icon: info.icon }
  })
  const data = {
    ...venue,
    // Google's own rating, shown in preference to the ViveLoja average when the
    // place has one, exactly as the web detail page does. Attribution is
    // mandatory whenever it is displayed, hence googleMapsUrl.
    googleRating,
    googleReviewCount,
    googleBadges,
    googleMapsUrl: googlePlaceId ? googlePlaceUrl(googlePlaceId) : null,
    isOwnedByMe: principal ? venueMeta.userId === principal.userId : false,
    canReclaim: principal ? venueMeta.userId !== principal.userId && !venue.claimed : false,
  }
  const response = mobileSuccess(data)
  // The response contains fresh Google-derived metadata and optional
  // user-specific ownership flags, so no intermediary may reuse it.
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
