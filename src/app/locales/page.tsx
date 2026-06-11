import { MapPin, Star, Sparkles, Tag, LayoutGrid } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getVenues } from '@/lib/queries/venues'
import { ExploreClient } from '@/components/features/explore/explore-client'
import { ListingSection } from '@/components/features/listing/listing-section'
import { ListingCta } from '@/components/features/listing/listing-cta'
import { NearYouSection } from '@/components/features/listing/near-you-section'
import type { ExploreVenue } from '@/types/explore'
import type { VenueListItem } from '@/types/venue'

export const metadata = {
  title: 'Locales en Loja',
  description:
    'Directorio de restaurantes, cafés, bares y servicios verificados en Loja, Ecuador. Reseñas reales, mapa interactivo, promociones activas y los locales mejor valorados por la comunidad.',
  openGraph: {
    title: 'Locales Verificados en Loja | Vive Loja',
    description: 'Restaurantes, cafés, bares y servicios con reseñas reales y mapa interactivo en Loja, Ecuador.',
    url: 'https://viveloja.com/locales',
    siteName: 'Vive Loja',
    images: [{ url: 'https://viveloja.com/viveloja.png', width: 1200, height: 630, alt: 'Locales en Loja - Vive Loja' }],
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Locales Verificados en Loja',
    description: 'Restaurantes, cafés, bares y servicios con reseñas reales y mapa interactivo en Loja, Ecuador.',
    images: ['https://viveloja.com/viveloja.png'],
  },
  alternates: { canonical: 'https://viveloja.com/locales' },
}

const FEATURED_TAKE = 6
const PROMO_TAKE = 6
const TOP_RATED_TAKE = 6
const ALL_TAKE = 12

export default async function LocalesPage() {
  const [allApproved, featuredVenues, promoVenues, topRatedVenues, categories] = await Promise.all([
    getVenues({ status: 'APPROVED' }, 60),
    prisma.venue.findMany({
      where: { status: 'APPROVED', featured: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: FEATURED_TAKE,
      select: {
        id: true, name: true, slug: true, description: true, image: true,
        location: true, address: true, lat: true, lng: true, featured: true,
        status: true, phone: true, website: true, priceRange: true,
        avgRating: true, reviewCount: true, verified: true, badge: true,
        venueCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
    prisma.venue.findMany({
      where: {
        status: 'APPROVED',
        promotions: { some: { status: 'ACTIVE', validUntil: { gte: new Date() } } },
      },
      orderBy: { createdAt: 'desc' },
      take: PROMO_TAKE,
      select: {
        id: true, name: true, slug: true, description: true, image: true,
        location: true, address: true, lat: true, lng: true, featured: true,
        status: true, phone: true, website: true, priceRange: true,
        avgRating: true, reviewCount: true, verified: true, badge: true,
        venueCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
    prisma.venue.findMany({
      where: { status: 'APPROVED', avgRating: { gte: 4 } },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      take: TOP_RATED_TAKE,
      select: {
        id: true, name: true, slug: true, description: true, image: true,
        location: true, address: true, lat: true, lng: true, featured: true,
        status: true, phone: true, website: true, priceRange: true,
        avgRating: true, reviewCount: true, verified: true, badge: true,
        venueCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
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

  const allVenues = allApproved.slice(0, ALL_TAKE) as VenueListItem[]

  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const serializedVenues = allApproved.map((v) => ({
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

  return (
    <div className="bg-background pt-14">
      {/* Mapa */}
      <div className="h-[70vh] w-full overflow-hidden">
        <ExploreClient
          initialVenues={serializedVenues}
          initialEvents={[]}
          categories={categories}
          mapboxToken={mapboxToken}
          mapStyle={mapStyle}
          mode="venues"
        />
      </div>

      {/* Contenido debajo del mapa */}
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Directorio local
          </span>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Locales verificados en Loja
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Restaurantes, cafés, bares y servicios recomendados por la comunidad y revisados por el equipo editorial.
          </p>
        </div>

        {/* Destacados */}
        <ListingSection
          title="Destacados"
          icon={<Sparkles className="h-5 w-5" />}
          preTitle="Seleccion editorial"
          items={featuredVenues as VenueListItem[]}
          type="venues"
        />

        {/* Cerca de ti */}
        <NearYouSection type="venues" mapboxToken={mapboxToken} />

        {/* Con promocion */}
        <ListingSection
          title="Con promocion"
          icon={<Tag className="h-5 w-5" />}
          preTitle="Ofertas activas"
          items={promoVenues as VenueListItem[]}
          type="venues"
        />

        {/* Mejor reseñados */}
        <ListingSection
          title="Mejor reseñados"
          icon={<Star className="h-5 w-5" />}
          preTitle="Top valorados"
          items={topRatedVenues as VenueListItem[]}
          type="venues"
        />

        {/* Todos */}
        <ListingSection
          title="Todos los locales"
          icon={<LayoutGrid className="h-5 w-5" />}
          items={allVenues}
          type="venues"
          enableLoadMore
          initialSkip={ALL_TAKE}
          take={ALL_TAKE}
          sort="recent"
        />

        {/* CTA */}
        <ListingCta type="venues" />
      </div>
    </div>
  )
}
