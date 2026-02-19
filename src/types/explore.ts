export type ExploreItemType = 'venue' | 'event'

export type ExploreVenue = {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  location: string
  address: string | null
  lat: number | null
  lng: number | null
  featured: boolean
  phone: string | null
  website: string | null
  category: {
    id: string
    name: string
    slug: string
    color: string | null
    icon: string | null
  }
}

export type ExploreEvent = {
  id: string
  title: string
  slug: string
  description: string
  image: string | null
  startDate: string
  endDate: string | null
  location: string
  address: string | null
  lat: number | null
  lng: number | null
  featured: boolean
  category: {
    id: string
    name: string
    slug: string
    color: string | null
    icon: string | null
  }
}

export type ExploreItem =
  | ({ _type: 'venue' } & ExploreVenue)
  | ({ _type: 'event' } & ExploreEvent)

export type ExploreFilters = {
  q: string
  type: 'all' | 'venues' | 'events'
  category: string
  featured: boolean
}

export type ExploreMapMarker = {
  id: string
  type: ExploreItemType
  lat: number
  lng: number
  name: string
  slug: string
  category: string
  categoryIcon: string | null
}

export type MapBounds = {
  north: number
  south: number
  east: number
  west: number
}

export type UserLocation = {
  lat: number
  lng: number
}

export const PROXIMITY_STEPS = [500, 1000, 2000, 3000, 5000] // meters
