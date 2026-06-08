import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { MapPin, Star, Sparkles, Tag, LayoutGrid, TrendingUp, ArrowRight, CalendarDays } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ExploreClient } from '@/components/features/explore/explore-client'
import { ListingSection } from '@/components/features/listing/listing-section'
import { ListingCta } from '@/components/features/listing/listing-cta'
import { NearYouSection } from '@/components/features/listing/near-you-section'
import { JsonLd, buildCategoryJsonLd } from '@/components/json-ld'
import {
  getCategoryBySlug,
  getCategorySlugsForStaticParams,
  getCategorySeoData,
  getCategoryWithChildrenSlugs,
  getParentVenueCategories,
} from '@/lib/queries/categories'
import { getRankedVenues, MIN_REVIEWS_FOR_RANKING } from '@/lib/rankings'
import { VenueBadges } from '@/components/features/rankings/venue-badge'
import type { ExploreVenue } from '@/types/explore'
import type { VenueListItem } from '@/types/venue'

export const revalidate = 3600

export async function generateStaticParams() {
  return getCategorySlugsForStaticParams()
}

type PageProps = {
  params: Promise<{ categorySlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params
  const category = await getCategoryBySlug(categorySlug)

  if (!category) return { title: 'No encontrado' }

  const { title, description } = getCategorySeoData(category)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://viveloja.com/${category.slug}`,
      siteName: 'ViveLoja',
      type: 'website',
      locale: 'es_EC',
    },
    alternates: {
      canonical: `https://viveloja.com/${category.slug}`,
    },
  }
}

const FEATURED_TAKE = 6
const PROMO_TAKE = 6
const TOP_RATED_TAKE = 6
const ALL_TAKE = 12
const RANKING_TAKE = 5
const RELATED_EVENTS_TAKE = 6

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params

  const category = await getCategoryBySlug(categorySlug)

  if (!category || category.type !== 'VENUE') notFound()

  const childSlugs = await getCategoryWithChildrenSlugs(categorySlug)

  const {
    title: seoTitle,
    description: seoDescription,
    introText,
  } = getCategorySeoData(category)

  const categoryFilter = { category: { slug: { in: childSlugs } } }

  const [
    allApproved,
    featuredVenues,
    promoVenues,
    topRatedVenues,
    categories,
    rankedVenues,
    relatedEvents,
    otherCategories,
  ] = await Promise.all([
    prisma.venue.findMany({
      where: { status: 'APPROVED', ...categoryFilter },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 60,
      select: {
        id: true, name: true, slug: true, description: true, image: true,
        location: true, address: true, lat: true, lng: true, featured: true,
        status: true, phone: true, website: true, priceRange: true,
        avgRating: true, reviewCount: true, verified: true, badge: true,
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    }),
    prisma.venue.findMany({
      where: { status: 'APPROVED', featured: true, ...categoryFilter },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: FEATURED_TAKE,
      select: {
        id: true, name: true, slug: true, description: true, image: true,
        location: true, address: true, lat: true, lng: true, featured: true,
        status: true, phone: true, website: true, priceRange: true,
        avgRating: true, reviewCount: true, verified: true, badge: true,
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    }),
    prisma.venue.findMany({
      where: {
        status: 'APPROVED',
        ...categoryFilter,
        promotions: { some: { status: 'ACTIVE', validUntil: { gte: new Date() } } },
      },
      orderBy: { createdAt: 'desc' },
      take: PROMO_TAKE,
      select: {
        id: true, name: true, slug: true, description: true, image: true,
        location: true, address: true, lat: true, lng: true, featured: true,
        status: true, phone: true, website: true, priceRange: true,
        avgRating: true, reviewCount: true, verified: true, badge: true,
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    }),
    prisma.venue.findMany({
      where: { status: 'APPROVED', avgRating: { gte: 4 }, ...categoryFilter },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      take: TOP_RATED_TAKE,
      select: {
        id: true, name: true, slug: true, description: true, image: true,
        location: true, address: true, lat: true, lng: true, featured: true,
        status: true, phone: true, website: true, priceRange: true,
        avgRating: true, reviewCount: true, verified: true, badge: true,
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, icon: true },
    }),
    getRankedVenues(childSlugs, RANKING_TAKE),
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        startDate: { gte: new Date() },
        venue: { category: { slug: { in: childSlugs } } },
      },
      orderBy: { startDate: 'asc' },
      take: RELATED_EVENTS_TAKE,
      select: {
        id: true, title: true, slug: true, description: true, image: true,
        startDate: true, endDate: true, location: true, address: true,
        lat: true, lng: true, featured: true, price: true, isRecurring: true,
        avgRating: true, reviewCount: true,
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    }),
    getParentVenueCategories(),
  ])

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
    category: v.category,
  })) as ExploreVenue[]

  const allVenues = allApproved.slice(0, ALL_TAKE) as VenueListItem[]

  const venueBadgesMap: Record<string, typeof rankedVenues[number]['badges']> = {}
  for (const v of rankedVenues) {
    if (v.badges.length > 0) venueBadgesMap[v.id] = v.badges
  }

  const jsonLd = buildCategoryJsonLd({
    name: seoTitle,
    slug: category.slug,
    description: seoDescription,
    venues: allApproved.map((v) => ({
      name: v.name,
      slug: v.slug,
      image: v.image,
      avgRating: v.avgRating,
      reviewCount: v.reviewCount,
      address: v.address,
      phone: v.phone,
    })),
  })

  return (
    <div className="bg-background pt-14">
      <JsonLd data={jsonLd} />

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
          <div className="flex items-center gap-2">
            {category.icon && <span className="text-2xl">{category.icon}</span>}
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Directorio local
            </span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {category.name} en Loja
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {introText}
          </p>
        </div>

        {/* Destacados */}
        {featuredVenues.length > 0 && (
          <ListingSection
            title="Destacados"
            icon={<Sparkles className="h-5 w-5" />}
            preTitle="Seleccion editorial"
            items={featuredVenues as VenueListItem[]}
            type="venues"
            venueBadges={venueBadgesMap}
          />
        )}

        {/* Cerca de ti */}
        <NearYouSection type="venues" mapboxToken={mapboxToken} />

        {/* Con promocion */}
        {promoVenues.length > 0 && (
          <ListingSection
            title="Con promocion"
            icon={<Tag className="h-5 w-5" />}
            preTitle="Ofertas activas"
            items={promoVenues as VenueListItem[]}
            type="venues"
            venueBadges={venueBadgesMap}
          />
        )}

        {/* Mejor resenados */}
        {topRatedVenues.length > 0 && (
          <ListingSection
            title="Mejor resenados"
            icon={<Star className="h-5 w-5" />}
            preTitle="Top valorados"
            items={topRatedVenues as VenueListItem[]}
            type="venues"
            venueBadges={venueBadgesMap}
          />
        )}

        {/* Ranking Top 5 */}
        {rankedVenues.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Ranking
                </span>
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    Top {category.name} de Loja
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Basado en calificaciones, resenas e interacciones de la comunidad
                </p>
              </div>
              <Link
                href={`/mejores/${category.slug}`}
                className="hidden items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:flex"
              >
                Ver ranking completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {rankedVenues.map((venue, index) => (
                <Link
                  key={venue.id}
                  href={`/locales/${venue.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-emerald/30"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    index === 0 ? 'bg-amber-400 text-white' :
                    index === 1 ? 'bg-gray-300 text-gray-800' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-accent text-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-foreground transition-colors group-hover:text-emerald">
                      {venue.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Math.round(venue.avgRating ?? 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {(venue.avgRating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({venue.reviewCount} resenas)
                      </span>
                    </div>
                  </div>
                  {venue.badges.length > 0 && (
                    <div className="hidden sm:block">
                      <VenueBadges badges={venue.badges} />
                    </div>
                  )}
                </Link>
              ))}
            </div>

            <div className="flex justify-center sm:hidden">
              <Link
                href={`/mejores/${category.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Ver ranking completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Eventos relacionados */}
        {relatedEvents.length > 0 && (
          <ListingSection
            title={`Eventos de ${category.name.toLowerCase()}`}
            icon={<CalendarDays className="h-5 w-5" />}
            preTitle="Proximamente"
            items={relatedEvents as any[]}
            type="events"
          />
        )}

        {/* Todos */}
        <ListingSection
          title={`Todos los ${category.name.toLowerCase()}`}
          icon={<LayoutGrid className="h-5 w-5" />}
          items={allVenues}
          type="venues"
          enableLoadMore
          initialSkip={ALL_TAKE}
          take={ALL_TAKE}
          sort="recent"
          venueBadges={venueBadgesMap}
        />

        {/* CTA */}
        <ListingCta type="venues" />

        {/* Enlaces internos a otras categorias */}
        {otherCategories.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Explora otras categorias
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherCategories
                .filter((c) => c.slug !== category.slug)
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/${c.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-emerald"
                  >
                    {c.icon && <span>{c.icon}</span>}
                    {c.name}
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
