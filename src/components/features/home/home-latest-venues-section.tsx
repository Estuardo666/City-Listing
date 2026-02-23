import { getVenues } from '@/lib/queries/venues'
import { HomeLatestVenues } from './home-latest-venues'

export async function HomeLatestVenuesSection() {
  const venueList = await getVenues({ status: 'APPROVED' }, 80)
  return <HomeLatestVenues venues={venueList} />
}
