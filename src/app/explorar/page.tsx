import { getVenues } from '@/lib/queries/venues'
import { getEvents } from '@/lib/queries/events'
import { prisma } from '@/lib/prisma'
import { ExploreClient } from '@/components/features/explore/explore-client'
import type { ExploreVenue, ExploreEvent } from '@/types/explore'

export const metadata = {
  title: 'Explorar — Locales y Eventos en Loja',
  description: 'Descubre locales y eventos verificados en Loja con mapa interactivo.',
}

const INITIAL_EXPLORE_LIMIT = 60

export default async function ExplorarPage() {
  const [venueList, eventList, categories] = await Promise.all([
    getVenues({ status: 'APPROVED' }, INITIAL_EXPLORE_LIMIT),
    getEvents({ status: 'APPROVED' }, INITIAL_EXPLORE_LIMIT),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, icon: true },
    }),
  ])

  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const serializedVenues: ExploreVenue[] = venueList.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    description: v.description,
    image: v.image,
    location: v.location,
    address: v.address,
    lat: v.lat ?? null,
    lng: v.lng ?? null,
    featured: v.featured,
    phone: v.phone,
    website: v.website,
    category: v.category,
  }))

  const serializedEvents: ExploreEvent[] = eventList.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description,
    image: e.image,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    location: e.location,
    address: e.address,
    lat: e.lat ?? null,
    lng: e.lng ?? null,
    featured: e.featured,
    category: e.category,
  }))

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background pt-14">
      {/* Main explore UI */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ExploreClient
          initialVenues={serializedVenues}
          initialEvents={serializedEvents}
          categories={categories}
          mapboxToken={mapboxToken}
          mapStyle={mapStyle}
        />
      </div>
    </div>
  )
}
