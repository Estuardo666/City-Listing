import { getVenues } from '@/lib/queries/venues'
import { HomeFeaturedVenues } from './home-featured-venues'

export async function HomeFeaturedVenuesSection() {
  const venueList = await getVenues({ status: 'APPROVED' }, 80)
  return <HomeFeaturedVenues venues={venueList} />
}
