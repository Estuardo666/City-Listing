import { getPersonalizedHomeData } from '@/lib/queries/onboarding'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

function mapCategory(category: { id: string; name: string; slug: string; icon: string | null; color: string | null }) {
  return category
}

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus recomendaciones.', 401)

  const data = await getPersonalizedHomeData(principal.userId)
  return mobileSuccess({
    interests: {
      categories: data.interests.map(({ category }) => mapCategory(category)),
      preferences: data.preferences.map(({ preference }) => preference),
    },
    followingVenues: data.followingVenues.map(({ venue, ...follow }) => ({
      ...follow,
      venue: {
        ...venue,
        categories: venue.venueCategories.map(({ category }) => category),
      },
    })),
    relatedEvents: data.relatedEvents.map(({ eventCategories, ...event }) => ({
      ...event,
      categories: eventCategories.map(({ category }) => category),
    })),
    relatedVenues: data.relatedVenues.map(({ venueCategories, ...venue }) => ({
      ...venue,
      categories: venueCategories.map(({ category }) => category),
    })),
  })
}
