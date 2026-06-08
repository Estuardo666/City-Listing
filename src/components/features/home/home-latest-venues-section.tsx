import { getVenues } from '@/lib/queries/venues'
import { HomeLatestVenues } from './home-latest-venues'
import type { ExploreVenue } from '@/types/explore'

export async function HomeLatestVenuesSection() {
  const venueList = await getVenues({ status: 'APPROVED' }, 80)
  const formattedVenues: ExploreVenue[] = venueList.map((venue) => ({
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
    categories: venue.venueCategories.map((vc) => vc.category),
  }))
  return <HomeLatestVenues venues={formattedVenues} />
}
