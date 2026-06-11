import { getVenues } from '@/lib/queries/venues'
import { getEvents } from '@/lib/queries/events'
import { prisma } from '@/lib/prisma'
import { ExploreClient } from '@/components/features/explore/explore-client'
import type { ExploreVenue, ExploreEvent } from '@/types/explore'

export const metadata = {
  title: 'Explorar — Locales y Eventos en Loja',
  description:
    'Explora restaurantes, bares, cafés, eventos y servicios en Loja, Ecuador. Mapa interactivo con locales verificados, reseñas de la comunidad y planes para disfrutar tu ciudad.',
  openGraph: {
    title: 'Explorar Locales y Eventos en Loja',
    description: 'Mapa interactivo con restaurantes, bares, eventos y servicios verificados en Loja, Ecuador.',
    url: 'https://viveloja.com/explorar',
    siteName: 'Vive Loja',
    images: [{ url: 'https://viveloja.com/viveloja.png', width: 1200, height: 630, alt: 'Explorar Loja - Vive Loja' }],
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explorar Locales y Eventos en Loja',
    description: 'Mapa interactivo con restaurantes, bares, eventos y servicios verificados en Loja, Ecuador.',
    images: ['https://viveloja.com/viveloja.png'],
  },
  alternates: { canonical: 'https://viveloja.com/explorar' },
}

const INITIAL_EXPLORE_LIMIT = 60

export default async function ExplorarPage() {
  const [venueList, eventList, categories] = await Promise.all([
    getVenues({ status: 'APPROVED' }, INITIAL_EXPLORE_LIMIT),
    getEvents({ status: 'APPROVED' }, INITIAL_EXPLORE_LIMIT),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        subcategories: {
          select: { id: true, name: true, slug: true, icon: true },
          orderBy: { name: 'asc' },
        },
      },
    }),
  ])

  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const serializedVenues = venueList.map((v) => ({
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
    priceRange: (v as any).priceRange ?? null,
    avgRating: (v as any).avgRating ?? null,
    reviewCount: (v as any).reviewCount ?? 0,
    verified: (v as any).verified ?? false,
    promotions: [],
    services: [],
    businessHours: [],
    categories: v.venueCategories.map((vc: any) => vc.category),
  })) as ExploreVenue[]

  const serializedEvents = eventList.map((e) => ({
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
    price: (e as any).price ?? null,
    avgRating: (e as any).avgRating ?? null,
    reviewCount: (e as any).reviewCount ?? 0,
    categories: e.eventCategories.map((ec: any) => ec.category),
  })) as ExploreEvent[]

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
