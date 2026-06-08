import { CalendarDays, Star, Sparkles, Tag, Ticket, LayoutGrid } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getEvents } from '@/lib/queries/events'
import { ExploreClient } from '@/components/features/explore/explore-client'
import { ListingSection } from '@/components/features/listing/listing-section'
import { ListingCta } from '@/components/features/listing/listing-cta'
import { NearYouSection } from '@/components/features/listing/near-you-section'
import type { ExploreEvent } from '@/types/explore'
import type { EventListItem } from '@/types/event'

export const metadata = {
  title: 'Eventos en Loja',
  description: 'Descubre eventos verificados en Loja con mapa interactivo.',
}

const FEATURED_TAKE = 6
const FREE_TAKE = 6
const TOP_RATED_TAKE = 6
const ALL_TAKE = 12

export default async function EventosPage() {
  const [allApproved, featuredEvents, freeEvents, topRatedEvents, categories] = await Promise.all([
    getEvents({ status: 'APPROVED' }, 60),
    prisma.event.findMany({
      where: { status: 'APPROVED', featured: true },
      orderBy: [{ featured: 'desc' }, { startDate: 'asc' }],
      take: FEATURED_TAKE,
      select: {
        id: true, title: true, slug: true, description: true, image: true,
        startDate: true, endDate: true, location: true, address: true,
        lat: true, lng: true, featured: true, price: true, isRecurring: true,
        avgRating: true, reviewCount: true,
        eventCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
    prisma.event.findMany({
      where: { status: 'APPROVED', OR: [{ price: null }, { price: 0 }] },
      orderBy: { startDate: 'asc' },
      take: FREE_TAKE,
      select: {
        id: true, title: true, slug: true, description: true, image: true,
        startDate: true, endDate: true, location: true, address: true,
        lat: true, lng: true, featured: true, price: true, isRecurring: true,
        avgRating: true, reviewCount: true,
        eventCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
    prisma.event.findMany({
      where: { status: 'APPROVED', avgRating: { gte: 4 } },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      take: TOP_RATED_TAKE,
      select: {
        id: true, title: true, slug: true, description: true, image: true,
        startDate: true, endDate: true, location: true, address: true,
        lat: true, lng: true, featured: true, price: true, isRecurring: true,
        avgRating: true, reviewCount: true,
        eventCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, icon: true },
    }),
  ])

  const allEvents = allApproved.slice(0, ALL_TAKE) as EventListItem[]

  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const serializedEvents = allApproved.map((e) => ({
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
    categories: (e as any).eventCategories?.map((ec: any) => ec.category) ?? [],
  })) as ExploreEvent[]

  return (
    <div className="bg-background pt-14">
      {/* Mapa */}
      <div className="h-[70vh] w-full overflow-hidden">
        <ExploreClient
          initialVenues={[]}
          initialEvents={serializedEvents}
          categories={categories}
          mapboxToken={mapboxToken}
          mapStyle={mapStyle}
          mode="events"
        />
      </div>

      {/* Contenido debajo del mapa */}
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Agenda verificada
          </span>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Eventos en Loja
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Conciertos, cultura, deportes y actividades recomendadas por la comunidad. Filtra por categoria y encuentra ubicaciones en el mapa.
          </p>
        </div>

        {/* Destacados */}
        <ListingSection
          title="Destacados"
          icon={<Sparkles className="h-5 w-5" />}
          preTitle="Seleccion editorial"
          items={featuredEvents as EventListItem[]}
          type="events"
        />

        {/* Cerca de ti */}
        <NearYouSection type="events" mapboxToken={mapboxToken} />

        {/* Gratis */}
        <ListingSection
          title="Entrada libre"
          icon={<Ticket className="h-5 w-5" />}
          preTitle="Sin costo"
          items={freeEvents as EventListItem[]}
          type="events"
        />

        {/* Mejor reseñados */}
        <ListingSection
          title="Mejor reseñados"
          icon={<Star className="h-5 w-5" />}
          preTitle="Top valorados"
          items={topRatedEvents as EventListItem[]}
          type="events"
        />

        {/* Todos */}
        <ListingSection
          title="Todos los eventos"
          icon={<LayoutGrid className="h-5 w-5" />}
          items={allEvents}
          type="events"
          enableLoadMore
          initialSkip={ALL_TAKE}
          take={ALL_TAKE}
          sort="recent"
        />

        {/* CTA */}
        <ListingCta type="events" />
      </div>
    </div>
  )
}
