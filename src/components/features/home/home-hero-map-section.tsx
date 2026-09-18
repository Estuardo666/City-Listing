import { HomeHeroMap } from './home-hero-map'
import { getExploreMapData } from '@/lib/queries/explore-map-data'

export async function HomeHeroMapSection() {
  // The hero only needs enough points to make the first viewport useful. The
  // full discovery surface is paginated in /explorar.
  const { venues, events } = await getExploreMapData({ venueLimit: 24, eventLimit: 24 })
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  return (
    <HomeHeroMap
      venues={venues}
      events={events}
      mapboxToken={mapboxToken}
      mapStyle={mapStyle}
    />
  )
}
